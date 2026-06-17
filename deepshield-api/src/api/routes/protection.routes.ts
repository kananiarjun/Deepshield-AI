import { Router } from 'express';
import { ProtectionService } from '../../services/protection.service.js';
import { WalrusService } from '../../walrus/walrus.service.js';
import { MoveService } from '../../sui/move.service.js';
import { VerificationService } from '../../verification/verification.service.js';
import { prisma } from '../../database/prisma.js';

const router = Router();

router.post('/analyze', async (req, res, next) => {
  try {
    const { pair, amount, slippage, wallet } = req.body;
    const result = await ProtectionService.analyze(pair, amount, slippage, wallet);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.post('/execute', async (req, res, next) => {
  try {
    const { pair, amount, slippage, wallet, strategy, estimatedSavings, riskScore } = req.body;
    
    // 1. Analyze and execute (mocked execution)
    const execResult: any = await ProtectionService.execute(req.body);
    
    // 2. Upload to Walrus
    const walrusResult = await WalrusService.uploadProtectionReplay({
      request: req.body,
      execution: execResult
    });

    // 3. Store Protection Proof and Record on Sui
    const recipient = wallet || '0x0288094852c5254052abd0c431915f883eee0c8372807f099506864749d30c6d';
    
    const finalRiskScore = riskScore || execResult.riskScore || 50;
    const finalStrategy = strategy || execResult.strategy || 'Direct Execution';
    const finalSavingsStr = estimatedSavings || execResult.estimatedSavings || '$0.00';

    const proofResult = await MoveService.createProtectionProof(
      recipient,
      pair || 'SUI/USDC',
      finalRiskScore,
      finalStrategy,
      finalSavingsStr,
      walrusResult.blobId
    );

    await MoveService.recordProtection(
      recipient,
      pair || 'SUI/USDC',
      finalStrategy,
      finalSavingsStr,
      finalSavingsStr, // actual savings
      walrusResult.blobId
    );

    // 3.5 Store in SQLite DB & update User stats
    const numericSavings = typeof finalSavingsStr === 'string'
      ? parseFloat(finalSavingsStr.replace(/[^0-9.]/g, '')) || 0
      : parseFloat(finalSavingsStr) || 0;

    const numericAmount = parseFloat(amount) || 0;

    const protectedTrade = await prisma.protectedTrade.create({
      data: {
        walletAddress: recipient,
        tokenPair: pair || 'SUI/USDC',
        tradeAmount: numericAmount,
        riskScore: finalRiskScore,
        protectionStrategy: finalStrategy,
        estimatedSavings: numericSavings,
        actualSavings: numericSavings,
        txHash: proofResult.txHash,
        status: 'Protected'
      }
    });

    await prisma.replayEvent.create({
      data: {
        tradeId: protectedTrade.id,
        attackType: finalRiskScore > 70 ? 'Sandwich Attack' : 'Frontrunning',
        protectionMethod: finalStrategy,
        estimatedLoss: numericSavings,
        actualLoss: 0,
        savedAmount: numericSavings
      }
    });

    await prisma.user.upsert({
      where: { walletAddress: recipient },
      update: {
        totalProtectedTrades: { increment: 1 },
        totalSavings: { increment: numericSavings },
        protectionScore: { increment: 5 }
      },
      create: {
        walletAddress: recipient,
        totalProtectedTrades: 1,
        totalSavings: numericSavings,
        protectionScore: 100
      }
    });

    // 4. Verify
    const verification = await VerificationService.verifyProtectionProof(
      proofResult.objectId,
      walrusResult.blobId,
      proofResult.txHash
    );

    res.json({ 
      success: true, 
      data: {
        ...execResult,
        verification: {
          ...verification,
          walrusStatus: walrusResult.status,
          walrusMessage: walrusResult.message
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
