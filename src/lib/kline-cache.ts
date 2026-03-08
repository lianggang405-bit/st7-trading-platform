/**
 * K线数据缓存模块
 * 用于缓存K线数据，减少API请求次数
 */

interface CacheItem {
  data: any[];
  timestamp: number;
}

class KlineCache {
  private cache: Map<string, CacheItem> = new Map();
  private readonly CACHE_TTL = 30000; // 30秒缓存

  /**
   * 生成缓存键
   */
  private generateKey(symbol: string, interval: string, limit: number): string {
    return `${symbol}_${interval}_${limit}`;
  }

  /**
   * 获取缓存数据
   */
  get(symbol: string, interval: string, limit: number): any[] | null {
    const key = this.generateKey(symbol, interval, limit);
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    // 检查是否过期
    const now = Date.now();
    if (now - item.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      console.log(`[KlineCache] 缓存过期: ${key}`);
      return null;
    }

    console.log(`[KlineCache] 缓存命中: ${key}`);
    return item.data;
  }

  /**
   * 设置缓存数据
   */
  set(symbol: string, interval: string, limit: number, data: any[]): void {
    const key = this.generateKey(symbol, interval, limit);
    const item = {
      data,
      timestamp: Date.now(),
    };

    this.cache.set(key, item);

    // 设置自动清理
    setTimeout(() => {
      this.cache.delete(key);
      console.log(`[KlineCache] 缓存已清理: ${key}`);
    }, this.CACHE_TTL);

    console.log(`[KlineCache] 缓存已设置: ${key}, 数据量: ${data.length}`);
  }

  /**
   * 清除指定缓存
   */
  clear(symbol?: string, interval?: string, limit?: number): void {
    if (symbol && interval && limit) {
      const key = this.generateKey(symbol, interval, limit);
      this.cache.delete(key);
      console.log(`[KlineCache] 清除指定缓存: ${key}`);
    } else {
      this.cache.clear();
      console.log(`[KlineCache] 清除所有缓存`);
    }
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// 导出单例
export const klineCache = new KlineCache();
