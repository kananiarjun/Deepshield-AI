import { Router } from 'express';
import { prisma } from '../../database/prisma.js';
import { VerificationService } from '../../verification/verification.service.js';

const router = Router();

router.get('/history', async (req, res, next) => {
  try {
    const replays = await prisma.replayEvent.findMany({
      include: { trade: true },
      orderBy: { createdAt: 'desc' }
    });

    const dataWithVerification = await Promise.all(replays.map(async (event) => {
      const trade = event.trade;
      const blobId = 'fallback_blob_' + trade.id;
      const objectId = trade.txHash || '0x0288094852c5254052abd0c431915f883eee0c8372807f099506864749d30c6d';
      const txHash = trade.txHash || '0xunknown';

      const verification = await VerificationService.verifyProtectionProof(
        objectId,
        blobId,
        txHash
      );

      return {
        id: trade.id,
        pair: trade.tokenPair,
        originalRisk: trade.riskScore,
        predictedLoss: `$${event.estimatedLoss.toFixed(2)}`,
        actualExecution: event.protectionMethod,
        moneySaved: `$${event.savedAmount.toFixed(2)}`,
        aiRecommendation: trade.protectionStrategy,
        timestamp: event.createdAt.toLocaleString(),
        verification
      };
    }));

    res.json({ success: true, data: dataWithVerification });
  } catch (error) {
    next(error);
  }
});

router.get('/:tradeId', async (req, res, next) => {
  try {
    const trade = await prisma.protectedTrade.findUnique({
      where: { id: req.params.tradeId },
      include: { replayEvents: true }
    });

    if (!trade) {
      return res.status(404).json({ success: false, message: 'Trade not found' });
    }

    const replayEvent = trade.replayEvents[0] || { estimatedLoss: 0, savedAmount: 0, protectionMethod: trade.protectionStrategy };

    res.json({
      success: true,
      data: {
        id: trade.id,
        pair: trade.tokenPair,
        originalRisk: trade.riskScore,
        predictedLoss: `$${replayEvent.estimatedLoss.toFixed(2)}`,
        actualExecution: replayEvent.protectionMethod,
        moneySaved: `$${replayEvent.savedAmount.toFixed(2)}`,
        aiRecommendation: trade.protectionStrategy,
        timestamp: trade.createdAt.toLocaleString()
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
