/**
 * Ticker Engine - 24小时统计引擎
 * 计算每个交易对的24小时统计数据
 */

import { getSupabase } from '../config/database';

/**
 * 24小时统计数据
 */
export interface Ticker24h {
  symbol: string;
  lastPrice: number;           // 最新价格
  priceChange: number;         // 24h价格变化
  priceChangePercent: number;  // 24h价格变化百分比
  high: number;                // 24h最高价
  low: number;                 // 24h最低价
  volume: number;              // 24h成交量
  quoteVolume: number;         // 24h成交额（quote asset）
  openTime: number;            // 24h起始时间
  closeTime: number;           // 当前时间
  trades: number;              // 24h交易次数
}

/**
 * 价格记录（用于24h统计）
 */
interface PriceRecord {
  price: number;
  volume: number;
  timestamp: number;
}

/**
 * Ticker Engine 类
 */
export class TickerEngine {
  private tickers: Map<string, Ticker24h> = new Map();
  private priceRecords: Map<string, PriceRecord[]> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly WINDOW_SIZE_24H = 24 * 60 * 60 * 1000; // 24小时（毫秒）

  constructor() {
    // 每 5 分钟清理一次过期数据
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * 更新交易数据
   * @param symbol 交易对
   * @param price 价格
   * @param volume 成交量
   * @param quoteVolume 成交额（可选，如为空则自动计算）
   */
  public updateTrade(symbol: string, price: number, volume: number, quoteVolume?: number): void {
    const now = Date.now();
    const upperSymbol = symbol.toUpperCase();

    // 初始化数据
    if (!this.tickers.has(upperSymbol)) {
      this.tickers.set(upperSymbol, {
        symbol: upperSymbol,
        lastPrice: price,
        priceChange: 0,
        priceChangePercent: 0,
        high: price,
        low: price,
        volume: 0,
        quoteVolume: quoteVolume || (price * volume),
        openTime: now,
        closeTime: now,
        trades: 0,
      });
      this.priceRecords.set(upperSymbol, []);
    }

    const ticker = this.tickers.get(upperSymbol)!;
    const records = this.priceRecords.get(upperSymbol)!;

    // 添加价格记录
    const record: PriceRecord = {
      price,
      volume,
      timestamp: now,
    };
    records.push(record);

    // 更新实时统计
    ticker.lastPrice = price;
    ticker.high = Math.max(ticker.high, price);
    ticker.low = Math.min(ticker.low, price);
    ticker.volume += volume;
    ticker.quoteVolume += quoteVolume || (price * volume);
    ticker.trades += 1;
    ticker.closeTime = now;

    // 重新计算24h统计
    this.recalculate24h(upperSymbol);
  }

  /**
   * 重新计算24小时统计
   */
  private recalculate24h(symbol: string): void {
    const records = this.priceRecords.get(symbol);
    if (!records || records.length === 0) {
      return;
    }

    const now = Date.now();
    const cutoffTime = now - this.WINDOW_SIZE_24H;

    // 过滤掉24小时之前的数据
    const recentRecords = records.filter(r => r.timestamp > cutoffTime);
    this.priceRecords.set(symbol, recentRecords);

    // 如果没有有效数据，不计算
    if (recentRecords.length === 0) {
      return;
    }

    // 找到最早的价格作为开盘价
    const firstRecord = recentRecords[0];
    const openPrice = firstRecord.price;

    // 计算变化
    const lastPrice = recentRecords[recentRecords.length - 1].price;
    const priceChange = lastPrice - openPrice;
    const priceChangePercent = (priceChange / openPrice) * 100;

    // 重新计算高低
    const high = Math.max(...recentRecords.map(r => r.price));
    const low = Math.min(...recentRecords.map(r => r.price));

    // 计算总成交量和成交额
    const volume = recentRecords.reduce((sum, r) => sum + r.volume, 0);
    const quoteVolume = recentRecords.reduce((sum, r) => sum + (r.price * r.volume), 0);

    // 更新 ticker
    const ticker = this.tickers.get(symbol);
    if (ticker) {
      ticker.lastPrice = lastPrice;
      ticker.priceChange = priceChange;
      ticker.priceChangePercent = priceChangePercent;
      ticker.high = high;
      ticker.low = low;
      ticker.volume = volume;
      ticker.quoteVolume = quoteVolume;
      ticker.openTime = firstRecord.timestamp;
      ticker.closeTime = now;
      ticker.trades = recentRecords.length;
    }
  }

  /**
   * 清理过期数据
   */
  private cleanup(): void {
    const now = Date.now();
    const cutoffTime = now - this.WINDOW_SIZE_24H;

    for (const [symbol, records] of this.priceRecords.entries()) {
      const recentRecords = records.filter(r => r.timestamp > cutoffTime);
      this.priceRecords.set(symbol, recentRecords);

      // 如果没有有效数据，删除 ticker
      if (recentRecords.length === 0) {
        this.tickers.delete(symbol);
      }
    }

    console.log(`[TickerEngine] 🧹 Cleanup completed. Active tickers: ${this.tickers.size}`);
  }

  /**
   * 获取单个交易对的24h统计
   */
  public getTicker(symbol: string): Ticker24h | null {
    return this.tickers.get(symbol.toUpperCase()) || null;
  }

  /**
   * 获取所有交易对的24h统计
   */
  public getAllTickers(): Ticker24h[] {
    return Array.from(this.tickers.values());
  }

  /**
   * 批量获取多个交易对的24h统计
   */
  public getTickers(symbols: string[]): Ticker24h[] {
    return symbols
      .map(s => this.tickers.get(s.toUpperCase()))
      .filter((t): t is Ticker24h => t !== undefined);
  }

  /**
   * 从数据库加载24h统计数据（启动时）
   */
  public async loadFromDatabase(): Promise<void> {
    try {
      const supabase = getSupabase();

      // 获取最近24小时的K线数据
      const twentyFourHoursAgo = Date.now() - this.WINDOW_SIZE_24H;

      const { data: klines, error } = await supabase
        .from('klines')
        .select('*')
        .eq('interval', '1m')
        .gte('open_time', twentyFourHoursAgo)
        .order('open_time', { ascending: true })
        .limit(100000);

      if (error) {
        console.error('[TickerEngine] Error loading from database:', error);
        return;
      }

      if (!klines || klines.length === 0) {
        console.log('[TickerEngine] No data found in database');
        return;
      }

      // 按交易对分组
      const symbolMap = new Map<string, any[]>();
      for (const kline of klines) {
        const symbol = kline.symbol;
        if (!symbolMap.has(symbol)) {
          symbolMap.set(symbol, []);
        }
        symbolMap.get(symbol)!.push(kline);
      }

      // 计算每个交易对的24h统计
      for (const [symbol, symbolKlines] of symbolMap.entries()) {
        const first = symbolKlines[0];
        const last = symbolKlines[symbolKlines.length - 1];

        const high = Math.max(...symbolKlines.map(k => k.high));
        const low = Math.min(...symbolKlines.map(k => k.low));
        const volume = symbolKlines.reduce((sum, k) => sum + k.volume, 0);
        const quoteVolume = symbolKlines.reduce((sum, k) => sum + (k.close * k.volume), 0);
        const trades = symbolKlines.length;

        const openPrice = first.open;
        const closePrice = last.close;
        const priceChange = closePrice - openPrice;
        const priceChangePercent = (priceChange / openPrice) * 100;

        this.tickers.set(symbol, {
          symbol,
          lastPrice: closePrice,
          priceChange,
          priceChangePercent,
          high,
          low,
          volume,
          quoteVolume,
          openTime: first.open_time,
          closeTime: last.close_time,
          trades,
        });

        // 构建价格记录（用于实时更新）
        const records: PriceRecord[] = symbolKlines.map(k => ({
          price: k.close,
          volume: k.volume,
          timestamp: k.close_time,
        }));
        this.priceRecords.set(symbol, records);
      }

      console.log(
        `[TickerEngine] ✅ Loaded ${this.tickers.size} tickers from database`
      );
    } catch (error) {
      console.error('[TickerEngine] Error loading from database:', error);
    }
  }

  /**
   * 停止引擎
   */
  public stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    console.log('[TickerEngine] Stopped');
  }

  /**
   * 兼容方法：updatePrice -> updateTrade
   * 为了保持向后兼容性，提供 updatePrice 方法
   */
  public updatePrice(symbol: string, price: number): void {
    this.updateTrade(symbol, price, Math.random() * 10, price * Math.random() * 10);
  }
}

// 导出单例
export const tickerEngine = new TickerEngine();
