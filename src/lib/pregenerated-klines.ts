/**
 * 预生成K线系统
 * 提前生成和存储K线数据，减少实时请求延迟
 */

import { getKlines } from './market-klines';

interface StoredKline {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface KlineStorage {
  symbol: string;
  interval: string;
  data: StoredKline[];
  lastUpdated: number;
}

class PreGeneratedKlineService {
  private storage: Map<string, KlineStorage> = new Map();
  private generationInterval: NodeJS.Timeout | null = null;
  private readonly STORAGE_KEY_PREFIX = 'kline_';
  private readonly RETENTION_DAYS = 7; // 保留7天数据
  private readonly MAX_KLINES = 1000; // 每个交易对最多存储1000根K线

  /**
   * 生成存储键
   */
  private generateKey(symbol: string, interval: string): string {
    return `${this.STORAGE_KEY_PREFIX}${symbol}_${interval}`;
  }

  /**
   * 获取或创建存储
   */
  private getOrCreateStorage(symbol: string, interval: string): KlineStorage {
    const key = this.generateKey(symbol, interval);
    let storage = this.storage.get(key);

    if (!storage) {
      storage = {
        symbol,
        interval,
        data: [],
        lastUpdated: 0,
      };
      this.storage.set(key, storage);
    }

    return storage;
  }

  /**
   * 生成指定交易对和周期的K线数据
   */
  async generateKlines(symbol: string, interval: string, limit: number = 200) {
    try {
      console.log(`[PreGenKline] 生成K线: ${symbol}_${interval}, limit=${limit}`);

      // 从数据源获取K线
      const klines = await getKlines(symbol, interval, limit);

      if (klines.length === 0) {
        console.log(`[PreGenKline] 无数据: ${symbol}_${interval}`);
        return;
      }

      // 获取或创建存储
      const storage = this.getOrCreateStorage(symbol, interval);

      // 合并数据（避免重复）
      const existingTimes = new Set(storage.data.map(k => k.time));
      const newKlines = klines.filter(k => !existingTimes.has(k.time));

      // 添加新数据
      storage.data = [...storage.data, ...newKlines];

      // 按时间排序（最新的在前）
      storage.data.sort((a, b) => b.time - a.time);

      // 限制数量
      if (storage.data.length > this.MAX_KLINES) {
        storage.data = storage.data.slice(0, this.MAX_KLINES);
      }

      // 更新时间戳
      storage.lastUpdated = Date.now();

      console.log(`[PreGenKline] 已生成 ${newKlines.length} 条新K线，总存储 ${storage.data.length} 条`);
    } catch (error) {
      console.error(`[PreGenKline] 生成K线失败: ${symbol}_${interval}`, error);
    }
  }

  /**
   * 获取预生成的K线数据
   */
  getKlines(symbol: string, interval: string, limit: number): StoredKline[] {
    const key = this.generateKey(symbol, interval);
    const storage = this.storage.get(key);

    if (!storage || storage.data.length === 0) {
      return [];
    }

    console.log(`[PreGenKline] 从预生成存储获取: ${symbol}_${interval}, 请求 ${limit} 条`);

    return storage.data.slice(0, limit);
  }

  /**
   * 检查是否有预生成数据
   */
  hasKlines(symbol: string, interval: string): boolean {
    const key = this.generateKey(symbol, interval);
    const storage = this.storage.get(key);
    return storage !== undefined && storage.data.length > 0;
  }

  /**
   * 更新最新K线（用于实时更新）
   */
  updateLatestKline(symbol: string, interval: string, kline: StoredKline) {
    const storage = this.getOrCreateStorage(symbol, interval);

    // 查找是否存在同一时间的K线
    const existingIndex = storage.data.findIndex(k => k.time === kline.time);

    if (existingIndex >= 0) {
      // 更新现有K线
      storage.data[existingIndex] = kline;
      console.log(`[PreGenKline] 更新K线: ${symbol}_${interval}, time=${kline.time}`);
    } else {
      // 添加新K线
      storage.data.unshift(kline);
      console.log(`[PreGenKline] 添加新K线: ${symbol}_${interval}, time=${kline.time}`);

      // 限制数量
      if (storage.data.length > this.MAX_KLINES) {
        storage.data = storage.data.slice(0, this.MAX_KLINES);
      }
    }

    storage.lastUpdated = Date.now();
  }

  /**
   * 清理过期数据
   */
  cleanExpiredData() {
    const now = Date.now();
    const retentionMs = this.RETENTION_DAYS * 24 * 60 * 60 * 1000;

    let cleanedCount = 0;

    this.storage.forEach((storage, key) => {
      const originalLength = storage.data.length;

      // 移除过期的K线
      storage.data = storage.data.filter(k => {
        const klineAge = now - k.time * 1000;
        return klineAge < retentionMs;
      });

      cleanedCount += originalLength - storage.data.length;

      // 如果没有数据了，移除存储
      if (storage.data.length === 0) {
        this.storage.delete(key);
      }
    });

    console.log(`[PreGenKline] 清理完成，移除 ${cleanedCount} 条过期K线`);
  }

  /**
   * 启动定时生成任务
   */
  startGeneration() {
    if (this.generationInterval) {
      return;
    }

    console.log('[PreGenKline] 启动定时生成任务');

    // 每5分钟生成一次热门交易对的K线
    const hotSymbols = ['BTCUSD', 'ETHUSD', 'XAUUSD', 'EURUSD', 'GBPUSD'];
    const intervals = ['1M', '5M', '15M', '1H'];

    this.generationInterval = setInterval(async () => {
      console.log('[PreGenKline] 开始批量生成K线');

      for (const symbol of hotSymbols) {
        for (const interval of intervals) {
          await this.generateKlines(symbol, interval, 200);

          // 添加小延迟避免请求过快
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      console.log('[PreGenKline] 批量生成完成');

      // 每小时清理一次过期数据
      this.cleanExpiredData();
    }, 5 * 60 * 1000); // 5分钟
  }

  /**
   * 停止定时生成任务
   */
  stopGeneration() {
    if (this.generationInterval) {
      clearInterval(this.generationInterval);
      this.generationInterval = null;
      console.log('[PreGenKline] 停止定时生成任务');
    }
  }

  /**
   * 获取统计信息
   */
  getStats() {
    const stats = {
      totalSymbols: this.storage.size,
      totalKlines: 0,
      storage: Array.from(this.storage.values()).map(s => ({
        symbol: s.symbol,
        interval: s.interval,
        count: s.data.length,
        lastUpdated: new Date(s.lastUpdated).toISOString(),
      })),
    };

    stats.totalKlines = stats.storage.reduce((sum, s) => sum + s.count, 0);

    return stats;
  }
}

// 导出单例
export const preGeneratedKlineService = new PreGeneratedKlineService();

// 开发环境自动启动
if (process.env.NODE_ENV === 'development') {
  preGeneratedKlineService.startGeneration();
}
