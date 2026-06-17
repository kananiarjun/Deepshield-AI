import { prisma } from './prisma.js';

export async function seedDatabase() {
  try {
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      console.log('[Database Seed] Database already has data. Skipping seed.');
      return;
    }

    console.log('[Database Seed] Database is empty. Seeding initial data...');

    // 1. Seed Users (Leaderboard)
    const user1 = await prisma.user.create({
      data: {
        walletAddress: '0x7a8d29837c4d29184b2e8a104c8f5e71829e0cd4',
        protectionScore: 998,
        totalProtectedTrades: 1420,
        totalSavings: 145200,
      }
    });

    const user2 = await prisma.user.create({
      data: {
        walletAddress: '0x3b9e11245c381df98c3e809dfb102ce20cf28ba1',
        protectionScore: 985,
        totalProtectedTrades: 890,
        totalSavings: 112450,
      }
    });

    const user3 = await prisma.user.create({
      data: {
        walletAddress: '0x9c2f481c5d8a0b12e3f4958e0a1c6a4e3210bc5e',
        protectionScore: 972,
        totalProtectedTrades: 650,
        totalSavings: 89100,
      }
    });

    const user4 = await prisma.user.create({
      data: {
        walletAddress: '0x0288094852c5254052abd0c431915f883eee0c8372807f099506864749d30c6d', // admin wallet
        protectionScore: 945,
        totalProtectedTrades: 312,
        totalSavings: 45200,
      }
    });

    const user5 = await prisma.user.create({
      data: {
        walletAddress: '0x5d8c381f9a0c8d7e6f0b4d9e8a7c6b5e4d3c2b1a',
        protectionScore: 910,
        totalProtectedTrades: 420,
        totalSavings: 34500,
      }
    });

    // 2. Seed Protected Trades
    const trade1 = await prisma.protectedTrade.create({
      data: {
        walletAddress: '0x0288094852c5254052abd0c431915f883eee0c8372807f099506864749d30c6d',
        tokenPair: 'SUI/USDC',
        tradeAmount: 45200,
        riskScore: 12,
        protectionStrategy: 'Commit-Reveal',
        estimatedSavings: 142.50,
        actualSavings: 142.50,
        txHash: '0x4f8ba1683cb0f7a33cee805a67d40f31e6ba303753fd3a4cfdfacea7163a5',
        status: 'Protected',
      }
    });

    const trade2 = await prisma.protectedTrade.create({
      data: {
        walletAddress: '0x0288094852c5254052abd0c431915f883eee0c8372807f099506864749d30c6d',
        tokenPair: 'CETUS/SUI',
        tradeAmount: 12450,
        riskScore: 85,
        protectionStrategy: 'Split Order',
        estimatedSavings: 310.20,
        actualSavings: 310.20,
        txHash: '0x2c29837df2a0194837cee805a67d40f31e6ba303753fd3a4cfdfacea7163a5',
        status: 'Protected',
      }
    });

    const trade3 = await prisma.protectedTrade.create({
      data: {
        walletAddress: '0x0288094852c5254052abd0c431915f883eee0c8372807f099506864749d30c6d',
        tokenPair: 'WETH/USDC',
        tradeAmount: 105000,
        riskScore: 45,
        protectionStrategy: 'Delayed Batch',
        estimatedSavings: 85.00,
        actualSavings: 85.00,
        txHash: '0x99238cf73a0194837cee805a67d40f31e6ba303753fd3a4cfdfacea7163a5',
        status: 'Protected',
      }
    });

    const trade4 = await prisma.protectedTrade.create({
      data: {
        walletAddress: '0x0288094852c5254052abd0c431915f883eee0c8372807f099506864749d30c6d',
        tokenPair: 'DEEP/USDT',
        tradeAmount: 8900,
        riskScore: 5,
        protectionStrategy: 'Direct Execution',
        estimatedSavings: 12.40,
        actualSavings: 12.40,
        txHash: '0xab29837cf2a0194837cee805a67d40f31e6ba303753fd3a4cfdfacea7163a5',
        status: 'Protected',
      }
    });

    const trade5 = await prisma.protectedTrade.create({
      data: {
        walletAddress: '0x0288094852c5254052abd0c431915f883eee0c8372807f099506864749d30c6d',
        tokenPair: 'WAL/SUI',
        tradeAmount: 34100,
        riskScore: 92,
        protectionStrategy: 'AI Selected',
        estimatedSavings: 450.80,
        actualSavings: 450.80,
        txHash: '0xef29837df2a0194837cee805a67d40f31e6ba303753fd3a4cfdfacea7163a5',
        status: 'Protected',
      }
    });

    // 3. Seed Replay Events
    await prisma.replayEvent.create({
      data: {
        tradeId: trade1.id,
        attackType: 'Frontrunning',
        protectionMethod: 'Commit-Reveal',
        estimatedLoss: 142.50,
        actualLoss: 0,
        savedAmount: 142.50,
      }
    });

    await prisma.replayEvent.create({
      data: {
        tradeId: trade2.id,
        attackType: 'Sandwich Attack',
        protectionMethod: 'Split Order',
        estimatedLoss: 310.20,
        actualLoss: 0,
        savedAmount: 310.20,
      }
    });

    await prisma.replayEvent.create({
      data: {
        tradeId: trade3.id,
        attackType: 'Jit Liquidity Attack',
        protectionMethod: 'Delayed Batch',
        estimatedLoss: 85.00,
        actualLoss: 0,
        savedAmount: 85.00,
      }
    });

    // 4. Seed Whale Events
    await prisma.whaleEvent.create({
      data: {
        token: 'SUI',
        eventType: 'Buy Wall',
        volume: 1250000,
        impact: 'High',
        confidence: 0.95
      }
    });

    await prisma.whaleEvent.create({
      data: {
        token: 'CETUS',
        eventType: 'Large Sell',
        volume: 1800000,
        impact: 'Critical',
        confidence: 0.88
      }
    });

    await prisma.whaleEvent.create({
      data: {
        token: 'DEEP',
        eventType: 'Liquidity Shift',
        volume: 5000000,
        impact: 'Medium',
        confidence: 0.75
      }
    });

    await prisma.whaleEvent.create({
      data: {
        token: 'WAL',
        eventType: 'Flash Loan',
        volume: 3400000,
        impact: 'High Volatility',
        confidence: 0.95
      }
    });

    // 5. Seed Risk Reports
    await prisma.riskReport.create({
      data: {
        walletAddress: '0x0288094852c5254052abd0c431915f883eee0c8372807f099506864749d30c6d',
        tokenPair: 'SUI/USDC',
        riskScore: 92,
        mevProbability: 0.85,
        liquidityScore: 0.95,
        volatilityScore: 0.45,
        whaleScore: 0.92,
        recommendation: 'Protected Buy'
      }
    });

    await prisma.riskReport.create({
      data: {
        walletAddress: '0x0288094852c5254052abd0c431915f883eee0c8372807f099506864749d30c6d',
        tokenPair: 'CETUS/SUI',
        riskScore: 88,
        mevProbability: 0.75,
        liquidityScore: 0.40,
        volatilityScore: 0.65,
        whaleScore: 0.88,
        recommendation: 'Wait'
      }
    });

    console.log('[Database Seed] Seeding completed successfully!');
  } catch (error) {
    console.error('[Database Seed] Error seeding database:', error);
  }
}
