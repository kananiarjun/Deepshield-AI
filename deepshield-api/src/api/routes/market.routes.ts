import { Router } from 'express';
import { DeepBookService } from '../../services/deepbook.service.js';
import { intelligenceData } from '../../utils/mockData.js';
import { WalrusService } from '../../walrus/walrus.service.js';
import { MoveService } from '../../sui/move.service.js';
import { VerificationService } from '../../verification/verification.service.js';
import { prisma } from '../../database/prisma.js';

const router = Router();

router.get('/tokens', async (req, res, next) => {
  try {
    const markets = await DeepBookService.getMarkets();
    res.json({ success: true, data: markets });
  } catch (error) {
    next(error);
  }
});

router.get('/:token', async (req, res, next) => {
  try {
    const liquidity = await DeepBookService.getLiquidity(req.params.token);
    res.json({ success: true, data: liquidity });
  } catch (error) {
    next(error);
  }
});

router.get('/:token/analysis', async (req, res, next) => {
  try {
    const token = req.params.token;
    // 1. In a real app we would call Gemini here to generate the report.
    // For now we use the mock data as the "generated report".
    const reportData: any = intelligenceData[token as keyof typeof intelligenceData] || intelligenceData.SUI;
    
    // 2. Upload to Walrus
    const walrusResult = await WalrusService.uploadMarketAnalysis(reportData);

    // 3. Store Reference in Move
    const fallbackWallet = process.env.SUI_PRIVATE_KEY ? '0x0288094852c5254052abd0c431915f883eee0c8372807f099506864749d30c6d' : '0x0';
    const recipient = req.query.wallet as string || fallbackWallet;

    const suiResult = await MoveService.saveMarketAnalysis(
      recipient,
      token,
      reportData.sentiment || 'Neutral',
      reportData.confidence || 85,
      walrusResult.blobId
    );

    // 3.5 Store in SQLite DB
    await prisma.riskReport.create({
      data: {
        walletAddress: recipient,
        tokenPair: token + '/USDC',
        riskScore: reportData.confidence || 85,
        mevProbability: reportData.confidence > 80 ? 0.8 : 0.1,
        liquidityScore: 0.9,
        volatilityScore: 0.2,
        whaleScore: reportData.confidence > 90 ? 0.9 : 0.3,
        recommendation: reportData.action || 'Hold'
      }
    });

    // 4. Verify
    const verification = await VerificationService.verifyRiskReport(
      suiResult.objectId,
      walrusResult.blobId,
      suiResult.txHash
    );

    res.json({
      success: true,
      data: {
        aiAnalysis: reportData,
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
