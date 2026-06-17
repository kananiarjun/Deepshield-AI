import { MoveService } from '../sui/move.service.js';

export class ContractService {
  static async commitOrder(orderDetails: any) {
    const wallet = orderDetails.wallet || '0x0288094852c5254052abd0c431915f883eee0c8372807f099506864749d30c6d';
    const res = await MoveService.recordProtection(
      wallet,
      orderDetails.pair || 'SUI/USDC',
      'Commit-Reveal',
      String(orderDetails.amount || '10'),
      '0',
      'dummy_commit_blob'
    );
    return { success: res.success, digest: res.txHash };
  }

  static async revealOrder(commitDigest: string) {
    return { success: true, executedAt: Date.now() };
  }

  static async saveRiskReport(report: any) {
    const wallet = report.wallet || '0x0288094852c5254052abd0c431915f883eee0c8372807f099506864749d30c6d';
    const res = await MoveService.createRiskReport(
      wallet,
      report.pair || 'SUI/USDC',
      report.riskScore || 50,
      report.recommendation || 'Hold',
      report.walrusBlobId || 'dummy_blob'
    );
    return { success: res.success, objectId: res.objectId };
  }

  static async recordProtection(tradeData: any) {
    const wallet = tradeData.wallet || '0x0288094852c5254052abd0c431915f883eee0c8372807f099506864749d30c6d';
    const res = await MoveService.recordProtection(
      wallet,
      tradeData.pair || 'SUI/USDC',
      tradeData.strategy || 'Direct Execution',
      tradeData.estimatedSavings || '$0.00',
      tradeData.actualSavings || '$0.00',
      tradeData.walrusBlobId || 'dummy_blob'
    );
    return { success: res.success, objectId: res.objectId };
  }
}
