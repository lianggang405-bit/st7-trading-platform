import { getSupabase } from '../config/database';
import { klineAggregator } from './kline-aggregator';

/**
 * K线数据类型
 */
export interface Candle {
  symbol: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  openTime: number;
  closeTime: number;
  interval: string;
}

/**
 * K线缓存
 * key: symbol_interval, value: Candle
 */
const candleCache: Record<string, Candle> = {};

/**
 * 最后成交价格（用于生成平盘K线）
 * key: symbol, value: lastPrice
 */
const lastPrices: Record<string, number> = {};

/**
 * 更新 K线
 * @param symbol 交易对
 * @param price 当前价格
 * @param interval 时间周期（默认 1m）
 * @param volume 成交量（可选）
 */
export function updateCandle(
  symbol: string,
  price: number,
  interval: string = '1m',
  volume: number = 0
): void {
  const now = Date.now();
  const intervalMs = getIntervalMs(interval);
  const openTime = Math.floor(now / intervalMs) * intervalMs;

  const cacheKey = `${symbol}_${interval}`;
  let candle = candleCache[cacheKey];

  // 如果没有缓存或当前 K 线已结束，创建新的 K 线
  if (!candle || candle.openTime !== openTime) {
    candle = {
      symbol,
      open: price,
      high: price,
      low: price,
      close: price,
      volume,
      openTime,
      closeTime: openTime + intervalMs,
      interval,
    };

    candleCache[cacheKey] = candle;
    console.log(
      `[KlineEngine] 🆕 New ${interval} candle for ${symbol}: ` +
      `Open=$${price.toFixed(2)}, Time=${new Date(openTime).toLocaleTimeString()}`
    );
  } else {
    // 更新现有 K 线
    candle.high = Math.max(candle.high, price);
    candle.low = Math.min(candle.low, price);
    candle.close = price;
    candle.volume += volume;

    // 保存最后价格（用于生成平盘K线）
    lastPrices[symbol] = price;

    console.log(
      `[KlineEngine] 📊 Updated ${interval} candle for ${symbol}: ` +
      `O=$${candle.open.toFixed(2)} H=$${candle.high.toFixed(2)} ` +
      `L=$${candle.low.toFixed(2)} C=$${candle.close.toFixed(2)}`
    );
  }
}

/**
 * 刷新已完成的 K 线到数据库
 */
export async function flushCandles(): Promise<void> {
  const now = Date.now();
  const completedCandles: Candle[] = [];

  // 检查所有缓存的 K 线
  for (const cacheKey in candleCache) {
    const candle = candleCache[cacheKey];

    // 如果 K 线已结束（当前时间 >= 关闭时间）
    if (now >= candle.closeTime) {
      completedCandles.push(candle);
      delete candleCache[cacheKey];
    }
  }

  // 如果没有完成的 K 线，直接返回
  if (completedCandles.length === 0) {
    // 打印一些示例 K 线的时间信息，用于调试
    const sampleCandles = Object.entries(candleCache).slice(0, 3);
    console.log(`[KlineEngine] ℹ️ No completed candles to flush. ${Object.keys(candleCache).length} candles still pending.`);
    console.log(`[KlineEngine] Current time: ${new Date(now).toISOString()}, now=${now}`);
    sampleCandles.forEach(([key, candle]) => {
      console.log(`[KlineEngine] Sample candle: ${key}, openTime=${candle.openTime}, closeTime=${candle.closeTime}, diff=${candle.closeTime - now}ms`);
    });
    return;
  }

  // 批量写入数据库（使用 ON CONFLICT 处理重复）
  console.log(`[KlineEngine] 💾 Flushing ${completedCandles.length} candles to database...`);

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('klines')
      .upsert(
        completedCandles.map((candle) => ({
          symbol: candle.symbol,
          interval: candle.interval,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume,
          open_time: candle.openTime,
          close_time: candle.closeTime,
        })),
        {
          onConflict: 'symbol,interval,open_time',
          ignoreDuplicates: false
        }
      )
      .select();

    if (error) {
      console.error('[KlineEngine] ❌ Failed to upsert candles:', error.message);
      throw error;
    }

    console.log(
      `[KlineEngine] ✅ Successfully inserted ${completedCandles.length} candles:`
    );

    // 检查是否有 1m K线写入，如果有则触发聚合
    const has1mCandles = completedCandles.some(c => c.interval === '1m');
    if (has1mCandles) {
      console.log('[KlineEngine] 🔔 Triggering K-line aggregation...');
      // 异步触发聚合，不阻塞主流程
      klineAggregator.aggregateOnce().catch(err => {
        console.error('[KlineEngine] Aggregation error:', err);
      });
    }

    // 打印插入的 K 线信息
    completedCandles.forEach((candle) => {
      console.log(
        `   ${candle.symbol} ${candle.interval}: ` +
        `O=${candle.open.toFixed(2)} H=${candle.high.toFixed(2)} ` +
        `L=${candle.low.toFixed(2)} C=${candle.close.toFixed(2)} ` +
        `@${new Date(candle.openTime).toLocaleTimeString()}`
      );
    });

  } catch (error) {
    console.error('[KlineEngine] Error flushing candles:', error);
  }
}

/**
 * 获取时间周期的毫秒数
 */
function getIntervalMs(interval: string): number {
  const intervals: Record<string, number> = {
    '1m': 60 * 1000,
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '30m': 30 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
  };

  return intervals[interval] || 60 * 1000; // 默认 1 分钟
}

/**
 * 自动生成平盘K线
 * 如果某交易对在当前周期没有成交，则生成flat candle
 */
export function generateFlatCandles(): void {
  const now = Date.now();
  const interval = '1m';
  const intervalMs = getIntervalMs(interval);

  const openTime = Math.floor(now / intervalMs) * intervalMs;

  Object.keys(lastPrices).forEach((symbol) => {
    const cacheKey = `${symbol}_${interval}`;

    if (candleCache[cacheKey]) {
      return;
    }

    const price = lastPrices[symbol];

    const candle: Candle = {
      symbol,
      open: price,
      high: price,
      low: price,
      close: price,
      volume: 0,
      openTime,
      closeTime: openTime + intervalMs,
      interval,
    };

    candleCache[cacheKey] = candle;

    console.log(
      `[KlineEngine] 🟰 Flat candle generated for ${symbol} @ ${new Date(openTime).toLocaleTimeString()}`
    );
  });
}

/**
 * 获取缓存的 K 线数量
 */
export function getCachedCandlesCount(): number {
  return Object.keys(candleCache).length;
}

/**
 * 清空所有缓存的 K 线（仅用于测试）
 */
export function clearCandleCache(): void {
  for (const key in candleCache) {
    delete candleCache[key];
  }
  console.log('[KlineEngine] 🧹 Candle cache cleared');
}

/**
 * 生成平盘K线（无交易分钟）
 * @param symbol 交易对
 * @param interval 时间周期
 * @returns 平盘K线
 */
function generateFlatCandle(symbol: string, interval: string): Candle | null {
  const lastPrice = lastPrices[symbol];
  if (!lastPrice) {
    return null; // 没有历史价格，无法生成平盘K线
  }

  const now = Date.now();
  const intervalMs = getIntervalMs(interval);
  const openTime = Math.floor(now / intervalMs) * intervalMs;

  // 检查当前时间段是否已存在K线
  const cacheKey = `${symbol}_${interval}`;
  if (candleCache[cacheKey] && candleCache[cacheKey].openTime === openTime) {
    return null; // 已存在，不需要生成
  }

  return {
    symbol,
    open: lastPrice,
    high: lastPrice,
    low: lastPrice,
    close: lastPrice,
    volume: 0,
    openTime,
    closeTime: openTime + intervalMs,
    interval,
  };
}

/**
 * 检查并生成平盘K线（定时器调用）
 * 每秒调用一次，检查是否需要生成无交易分钟的K线
 */
export function checkAndGenerateFlatCandles(symbols: string[], intervals: string[]): void {
  const now = Date.now();

  for (const symbol of symbols) {
    for (const interval of intervals) {
      const intervalMs = getIntervalMs(interval);
      const openTime = Math.floor(now / intervalMs) * intervalMs;
      const cacheKey = `${symbol}_${interval}`;

      // 如果没有缓存且存在最后价格，生成平盘K线
      if (!candleCache[cacheKey] && lastPrices[symbol]) {
        const flatCandle = generateFlatCandle(symbol, interval);
        if (flatCandle) {
          candleCache[cacheKey] = flatCandle;
          console.log(
            `[KlineEngine] 🔄 Generated flat candle for ${symbol} ${interval} ` +
            `@ ${new Date(flatCandle.openTime).toLocaleTimeString()}`
          );
        }
      }
    }
  }
}
