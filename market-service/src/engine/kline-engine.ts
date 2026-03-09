import { supabase } from '../config/database';

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
    return;
  }

  // 批量写入数据库
  console.log(`[KlineEngine] 💾 Flushing ${completedCandles.length} candles to database...`);

  try {
    const { data, error } = await supabase
      .from('klines')
      .insert(
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
        }))
      )
      .select();

    if (error) {
      console.error('[KlineEngine] ❌ Failed to insert candles:', error.message);
      throw error;
    }

    console.log(
      `[KlineEngine] ✅ Successfully inserted ${completedCandles.length} candles:`
    );

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
