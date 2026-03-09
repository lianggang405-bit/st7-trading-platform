/**
 * Metals-API 数据收集器
 * 用于获取真实的黄金、白银等贵金属价格
 *
 * API 文档: https://metals-api.com
 */

import {
  METALS_API_CONFIG,
  getMetalsApiKey,
  isMetalsApiConfigured,
  convertRateToPrice,
  metalsSymbolToSystemSymbol,
  systemSymbolToMetalsSymbol,
  type MetalsApiResponse,
  type MetalsRate,
} from '../config/metals-api';

/**
 * Metals-API 数据收集器
 */
export class MetalsDataCollector {
  private apiKey: string | null;
  private isEnabled: boolean;
  private cache: Map<string, MetalsRate> = new Map();
  private lastFetchTime: number = 0;

  constructor() {
    this.apiKey = getMetalsApiKey();
    this.isEnabled = isMetalsApiConfigured();

    if (this.isEnabled) {
      console.log('[MetalsCollector] ✅ Enabled with API key');
    } else {
      console.log('[MetalsCollector] ⚠️ Disabled (no API key configured)');
      console.log('[MetalsCollector] ℹ️ To enable, set METALS_API_KEY in .env file');
    }
  }

  /**
   * 检查收集器是否启用
   */
  public isAvailable(): boolean {
    return this.isEnabled && this.apiKey !== null;
  }

  /**
   * 获取所有贵金属的当前价格
   */
  public async getAllMetalsRates(): Promise<MetalsRate[]> {
    if (!this.isAvailable()) {
      console.log('[MetalsCollector] ⚠️ Not available, skipping fetch');
      return [];
    }

    try {
      const url = `${METALS_API_CONFIG.baseUrl}/latest?access_key=${this.apiKey}&base=${METALS_API_CONFIG.base}&symbols=${METALS_API_CONFIG.symbols.join(',')}`;

      console.log('[MetalsCollector] 📡 Fetching metals rates...');

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: any = await response.json();

      if (!data.success) {
        throw new Error(data.error?.info || 'API request failed');
      }

      // 解析返回的汇率
      const rates: MetalsRate[] = [];
      for (const [symbol, rate] of Object.entries(data.rates)) {
        const price = convertRateToPrice(symbol, rate);

        const metalRate: MetalsRate = {
          symbol: metalsSymbolToSystemSymbol(symbol),
          rate,
          price,
          timestamp: data.timestamp || Date.now(),
        };

        rates.push(metalRate);

        // 更新缓存
        this.cache.set(metalRate.symbol, metalRate);
      }

      this.lastFetchTime = Date.now();

      console.log(`[MetalsCollector] ✅ Fetched ${rates.length} metals rates:`);
      rates.forEach((rate) => {
        console.log(`  ${rate.symbol}: $${rate.price.toFixed(2)} (rate: ${rate.rate.toFixed(6)})`);
      });

      return rates;

    } catch (error) {
      console.error('[MetalsCollector] ❌ Error fetching metals rates:', error);
      return [];
    }
  }

  /**
   * 获取单个贵金属的价格
   */
  public async getMetalsRate(symbol: string): Promise<MetalsRate | null> {
    if (!this.isAvailable()) {
      console.log(`[MetalsCollector] ⚠️ Not available, skipping fetch for ${symbol}`);
      return null;
    }

    try {
      const metalsSymbol = systemSymbolToMetalsSymbol(symbol);
      const url = `${METALS_API_CONFIG.baseUrl}/latest?access_key=${this.apiKey}&base=${METALS_API_CONFIG.base}&symbols=${metalsSymbol}`;

      console.log(`[MetalsCollector] 📡 Fetching ${symbol} rate...`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: any = await response.json();

      if (!data.success) {
        throw new Error(data.error?.info || 'API request failed');
      }

      const rate = data.rates[metalsSymbol];
      if (rate === undefined) {
        console.warn(`[MetalsCollector] ⚠️ No rate found for ${metalsSymbol}`);
        return null;
      }

      const price = convertRateToPrice(metalsSymbol, rate);

      const metalRate: MetalsRate = {
        symbol: metalsSymbolToSystemSymbol(metalsSymbol),
        rate,
        price,
        timestamp: data.timestamp || Date.now(),
      };

      // 更新缓存
      this.cache.set(metalRate.symbol, metalRate);

      console.log(`[MetalsCollector] ✅ Fetched ${symbol}: $${price.toFixed(2)} (rate: ${rate.toFixed(6)})`);

      return metalRate;

    } catch (error) {
      console.error(`[MetalsCollector] ❌ Error fetching ${symbol} rate:`, error);
      return null;
    }
  }

  /**
   * 从缓存获取贵金属价格
   */
  public getCachedRate(symbol: string): MetalsRate | null {
    const cached = this.cache.get(symbol);
    if (!cached) {
      return null;
    }

    // 检查缓存是否过期
    const age = Date.now() - cached.timestamp;
    if (age > METALS_API_CONFIG.cacheTTL) {
      console.log(`[MetalsCollector] ⏰ Cache expired for ${symbol} (age: ${age}ms)`);
      this.cache.delete(symbol);
      return null;
    }

    return cached;
  }

  /**
   * 获取所有缓存的贵金属价格
   */
  public getAllCachedRates(): MetalsRate[] {
    const rates: MetalsRate[] = [];
    const now = Date.now();

    this.cache.forEach((rate) => {
      const age = now - rate.timestamp;
      if (age <= METALS_API_CONFIG.cacheTTL) {
        rates.push(rate);
      } else {
        this.cache.delete(rate.symbol);
      }
    });

    return rates;
  }

  /**
   * 启动定时器，定期刷新贵金属价格
   */
  public startAutoRefresh(interval: number = 60000): void {
    console.log(`[MetalsCollector] 🔄 Starting auto-refresh (interval: ${interval / 1000}s)`);

    // 立即获取一次
    this.getAllMetalsRates();

    // 设置定时器
    setInterval(async () => {
      console.log('[MetalsCollector] 🔄 Auto-refreshing metals rates...');
      await this.getAllMetalsRates();
    }, interval);
  }

  /**
   * 停止定时器
   */
  public stopAutoRefresh(): void {
    console.log('[MetalsCollector] ⏹️ Stopped auto-refresh');
  }

  /**
   * 获取缓存大小
   */
  public getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * 清空缓存
   */
  public clearCache(): void {
    this.cache.clear();
    console.log('[MetalsCollector] 🧹 Cache cleared');
  }
}

// 导出单例实例
export const metalsCollector = new MetalsDataCollector();
