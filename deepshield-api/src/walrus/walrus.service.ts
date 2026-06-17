import axios from 'axios';

export interface WalrusResponse {
  blobId: string;
  blobUrl: string;
  timestamp: number;
  status: 'Stored' | 'Failed';
  message?: string;
}

class AsyncSemaphore {
  private queue: (() => void)[] = [];
  private activeCount = 0;
  constructor(private maxConcurrent: number) { }

  async acquire(): Promise<void> {
    if (this.activeCount < this.maxConcurrent) {
      this.activeCount++;
      return Promise.resolve();
    }
    return new Promise(resolve => {
      this.queue.push(resolve);
    });
  }

  release(): void {
    if (this.queue.length > 0) {
      const resolve = this.queue.shift();
      if (resolve) resolve();
    } else {
      this.activeCount--;
    }
  }
}

export class WalrusService {
  private static publisherUrl = process.env.WALRUS_PUBLISHER_URL || 'https://publisher.walrus-testnet.walrus.space';
  private static aggregatorUrl = process.env.WALRUS_AGGREGATOR_URL || 'https://aggregator.walrus-testnet.walrus.space';

  // Restrict concurrent uploads to avoid rate limits or congestion
  private static uploadQueue = new AsyncSemaphore(5);

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private static async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 5,
    baseDelayMs: number = 1000
  ): Promise<T> {
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        return await operation();
      } catch (error: any) {
        attempt++;
        const status = error?.response?.status;
        // Retry on rate limits (429), server errors (503, 502, 500), or timeout/network issues
        const shouldRetry = status === 429 || status === 503 || status === 502 || !status;
        
        if (attempt >= maxRetries || !shouldRetry) {
          throw error;
        }
        
        // Exponential backoff
        const delayMs = baseDelayMs * Math.pow(2, attempt - 1);
        console.warn(`[WalrusService] Attempt ${attempt} failed with ${status || 'Network Error'}. Retrying in ${delayMs}ms...`);
        await this.delay(delayMs);
      }
    }
    throw new Error("Unreachable");
  }

  private static async uploadJson(data: any, epochs: number = 5): Promise<WalrusResponse> {
    await this.uploadQueue.acquire();

    try {
      const jsonString = JSON.stringify(data);
      const url = `${this.publisherUrl}/v1/blobs?epochs=${epochs}`;

      return await this.executeWithRetry(async () => {
        // Upload with a 15s timeout
        const response = await axios.put(url, jsonString, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 15000
        });

        const resData = response.data;
        let blobId = '';

        if (resData.alreadyCertified) {
          blobId = resData.alreadyCertified.blobId;
        } else if (resData.newlyCreated) {
          blobId = resData.newlyCreated.blobObject.blobId;
        } else {
          throw new Error('Unexpected response format from Walrus Publisher');
        }

        return {
          blobId,
          blobUrl: `${this.aggregatorUrl}/v1/blobs/${blobId}`,
          timestamp: Date.now(),
          status: 'Stored',
          message: 'Stored securely on Walrus'
        };
      }, 5, 2000); // 5 retries, starting at 2s delay

    } catch (error: any) {
      console.error('[WalrusService] ❌ Walrus Upload failed after retries:', error?.message || error);
      throw new Error(`Walrus Storage Failed: ${error?.message || 'Network Congested'}`);
    } finally {
      this.uploadQueue.release();
    }
  }

  static async uploadRiskReport(report: any): Promise<WalrusResponse> {
    return this.uploadJson({ type: 'RiskReport', ...report });
  }

  static async uploadMarketAnalysis(analysis: any): Promise<WalrusResponse> {
    return this.uploadJson({ type: 'MarketAnalysis', ...analysis });
  }

  static async uploadProtectionReplay(replay: any): Promise<WalrusResponse> {
    return this.uploadJson({ type: 'ProtectionReplay', ...replay });
  }

  static async uploadPortfolioAnalysis(analysis: any): Promise<WalrusResponse> {
    return this.uploadJson({ type: 'PortfolioAnalysis', ...analysis });
  }

  static async uploadWhaleReport(report: any): Promise<WalrusResponse> {
    return this.uploadJson({ type: 'WhaleReport', ...report });
  }

  static async uploadSimulationResult(result: any): Promise<WalrusResponse> {
    return this.uploadJson({ type: 'SimulationResult', ...result });
  }

  static async getBlob(blobId: string): Promise<any> {
    if (!blobId || blobId.startsWith('mock_')) return null;

    try {
      return await this.executeWithRetry(async () => {
        const response = await axios.get(`${this.aggregatorUrl}/v1/blobs/${blobId}`, { timeout: 10000 });
        return response.data;
      }, 3, 1000);
    } catch (error) {
      console.error(`[WalrusService] Failed to retrieve blob ${blobId}:`, error);
      return null;
    }
  }

  static async verifyBlob(blobId: string): Promise<boolean> {
    if (!blobId || blobId.startsWith('mock_') || blobId.startsWith('fallback_')) return false;

    try {
      await this.executeWithRetry(async () => {
        await axios.head(`${this.aggregatorUrl}/v1/blobs/${blobId}`, { timeout: 3000 });
      }, 2, 500);
      return true;
    } catch (error) {
      return false;
    }
  }
}
