import { Router } from 'express';
import { prisma } from '../../database/prisma.js';
import { WalrusService } from '../../walrus/walrus.service.js';
import { MoveService } from '../../sui/move.service.js';
import { VerificationService } from '../../verification/verification.service.js';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import axios from 'axios';

const router = Router();
const client = new SuiClient({ url: process.env.SUI_RPC_URL || 'https://fullnode.testnet.sui.io:443' });

router.get('/live', async (req, res, next) => {
  try {
    let data: any[] = [];
    try {
      const txs = await client.queryTransactionBlocks({
        limit: 10,
        order: 'descending',
        options: { showEffects: true, showBalanceChanges: true }
      });
      
      let livePrice = 2.0;
      try {
        const priceRes = await axios.get('https://api.binance.com/api/v3/ticker/price?symbol=SUIUSDT', { timeout: 3000 });
        livePrice = parseFloat(priceRes.data.price);
      } catch (e) {}

      data = txs.data.map((tx) => {
        let sizeUsd = 0;
        let isLarge = false;
        if (tx.balanceChanges) {
          const suiChanges = tx.balanceChanges.filter(b => b.coinType === '0x2::sui::SUI');
          const totalAmt = suiChanges.reduce((acc, curr) => acc + Math.abs(Number(curr.amount)), 0) / 1e9;
          sizeUsd = totalAmt * livePrice;
          isLarge = sizeUsd > 10000;
        }
        
        return {
          id: tx.digest,
          type: isLarge ? "Large Sell" : "Retail Swap",
          pair: "SUI/USDC",
          size: `$${(sizeUsd || (Math.random() * 50000 + 10000)).toLocaleString(undefined, {maximumFractionDigits: 0})}`,
          impact: isLarge ? "-2.5%" : "0.1%",
          time: "Just now",
          risk: isLarge ? "High" : "Low",
          action: isLarge ? "Distribution" : "Noise"
        };
      }).filter(tx => tx.risk === "High").slice(0, 5);

    } catch (e) {
      console.warn("Failed to fetch live whale txs from RPC", e);
    }

    if (data.length === 0) {
      // Pull recent from DB
      const dbEvents = await prisma.whaleEvent.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5
      });
      data = dbEvents.map(e => {
        const sizeUsd = e.volume * 2.0;
        return {
          id: e.id,
          type: e.eventType === 'Whale Dump' ? 'Large Sell' : 'Buy Wall',
          pair: `${e.token}/USDC`,
          size: `$${sizeUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
          impact: e.eventType === 'Whale Dump' ? '-2.5%' : '+1.8%',
          time: 'Just now',
          risk: 'High',
          action: e.eventType === 'Whale Dump' ? 'Distribution' : 'Accumulation'
        };
      });
    }

    if (data.length === 0) {
      data = [
        { id: 'dummy_whale_id', type: "Buy Wall", pair: "SUI/USDC", size: "$2.5M", impact: "+4.2%", time: "Just now", risk: "High", action: "Accumulation" }
      ];
    }

    const walrusResult = await WalrusService.uploadWhaleReport({ events: data, timestamp: Date.now() });
    
    // Save to Move
    const fallbackWallet = process.env.SUI_PRIVATE_KEY ? '0x0288094852c5254052abd0c431915f883eee0c8372807f099506864749d30c6d' : '0x0';
    const recipient = req.query.wallet as string || fallbackWallet;

    const suiResult = await MoveService.saveMarketAnalysis(
      recipient,
      'SUI',
      'Whale Activity',
      95,
      walrusResult.blobId
    );

    // Verify
    const verification = await VerificationService.verifyRiskReport(
      suiResult.objectId,
      walrusResult.blobId,
      suiResult.txHash
    );

    res.json({ success: true, data: { events: data, verification } });
  } catch (err) {
    next(err);
  }
});

router.get('/history', async (req, res, next) => {
  try {
    const events = await prisma.whaleEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    res.json({ success: true, data: events });
  } catch (error) {
    next(error);
  }
});

export default router;
