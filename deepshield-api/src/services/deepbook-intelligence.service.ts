import { DeepBookService } from './deepbook.service.js';

const DEFAULT_POOL = '0x1c19362ca52b8ffd7a33cee805a67d40f31e6ba303753fd3a4cfdfacea7163a5';

export class DeepBookIntelligenceService {
  static async analyzeLiquidity(poolId: string) {
    const liq = await DeepBookService.getLiquidity(poolId);
    return {
      totalLiquidityUSD: liq.totalLiquidityUSD,
      baseLiquidity: liq.baseLiquidity,
      quoteLiquidity: liq.quoteLiquidity,
      health: liq.totalLiquidityUSD > 50000 ? 'Healthy' : 'Low'
    };
  }

  static async analyzeSpread(poolId: string) {
    const spread = await DeepBookService.getSpread(poolId);
    return {
      spreadPercent: spread.spreadPercent,
      isWidening: spread.spreadPercent > 0.01
    };
  }

  static async analyzeVolatility(poolId: string) {
    const trades = await DeepBookService.getRecentTrades(poolId);
    if (trades.length < 2) return { volatilityScore: 10, status: 'Low' };
    
    // Simple standard deviation of prices to estimate volatility
    const prices = trades.map(t => t.price);
    const mean = prices.reduce((acc, p) => acc + p, 0) / prices.length;
    const variance = prices.reduce((acc, p) => acc + Math.pow(p - mean, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);
    const volatilityPercent = stdDev / mean;
    const score = Math.min(Math.floor(volatilityPercent * 1000), 100);

    return {
      volatilityScore: score,
      status: score > 50 ? 'High' : (score > 20 ? 'Medium' : 'Low')
    };
  }

  static async analyzeDepth(poolId: string) {
    const depth = await DeepBookService.getMarketDepth(poolId);
    return {
      plus2Percent: depth.plus2Percent,
      minus2Percent: depth.minus2Percent,
      imbalance: depth.plus2Percent > depth.minus2Percent * 1.1 ? 'Bid Heavy' : (depth.minus2Percent > depth.plus2Percent * 1.1 ? 'Ask Heavy' : 'Balanced')
    };
  }

  static async generateExecutionPlan(tradeParams: { pair: string, amount: number, wallet: string }) {
    const targetPool = DEFAULT_POOL;
    const liquidity = await this.analyzeLiquidity(targetPool);
    const spread = await this.analyzeSpread(targetPool);
    const volatility = await this.analyzeVolatility(targetPool);
    const depth = await this.analyzeDepth(targetPool);

    let strategy = 'Normal Execution';
    let riskScore = 15;
    let savings = '$0.00';
    let explanation = 'DeepBook metrics are stable. Normal execution is safe.';

    if (volatility.status === 'High' || liquidity.health === 'Low') {
      strategy = 'Commit-Reveal Protection';
      riskScore = 92;
      savings = `$${(tradeParams.amount * 0.03).toFixed(2)}`;
      explanation = `Risk Score ${riskScore}. Reason: Liquidity is low and volatility is high. Routing via DeepShield private RPC to prevent front-running.`;
    } else if (spread.isWidening || depth.imbalance === 'Ask Heavy') {
      strategy = 'Split Order';
      riskScore = 65;
      savings = `$${(tradeParams.amount * 0.015).toFixed(2)}`;
      explanation = `Risk Score ${riskScore}. Reason: Spread is widening and order book is ask heavy. Splitting order into tranches minimizes slippage impact.`;
    } else if (tradeParams.amount > 50000) {
      strategy = 'Delayed Batch';
      riskScore = 45;
      savings = `$${(tradeParams.amount * 0.008).toFixed(2)}`;
      explanation = `Risk Score ${riskScore}. Reason: Large trade size detected. Delaying execution and batching over 5 blocks to avoid market impact.`;
    } else {
      strategy = 'Protected Route';
      riskScore = 22;
      savings = `$${(tradeParams.amount * 0.005).toFixed(2)}`;
      explanation = `Risk Score ${riskScore}. Reason: Healthy DeepBook state on testnet. Routing through optimized path.`;
    }

    return {
      strategy,
      riskScore,
      estimatedSavings: savings,
      explanation,
      metrics: { liquidity, spread, volatility, depth }
    };
  }
}
