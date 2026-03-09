import { getSupabase } from '../config/database';

export type Interval = '1m' | '5m' | '15m';

export interface Candle {
  symbol: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  openTime: number;
  closeTime: number;
  interval: Interval;
}

const candleCache: Record<string, Candle> = {};
const lastPrices: Record<string, number> = {};

function getIntervalMs(interval: Interval) {
  switch (interval) {
    case '1m':
      return 60_000;
    case '5m':
      return 300_000;
    case '15m':
      return 900_000;
  }
}

function getOpenTime(ts: number, interval: Interval) {
  const ms = getIntervalMs(interval);
  return Math.floor(ts / ms) * ms;
}

function getCacheKey(symbol: string, interval: Interval, openTime: number) {
  return `${symbol}_${interval}_${openTime}`;
}

/**
 * 更新 K线
 * 同时更新 1m、5m、15m 三个时间周期
 */
export function updateCandle(symbol: string, price: number, volume = 0) {
  const now = Date.now();

  lastPrices[symbol] = price;

  const intervals: Interval[] = ['1m', '5m', '15m'];

  intervals.forEach((interval) => {
    const openTime = getOpenTime(now, interval);
    const cacheKey = getCacheKey(symbol, interval, openTime);

    let candle = candleCache[cacheKey];

    if (!candle) {
      candle = {
        symbol,
        open: price,
        high: price,
        low: price,
        close: price,
        volume,
        openTime,
        closeTime: openTime + getIntervalMs(interval),
        interval,
      };

      candleCache[cacheKey] = candle;
    } else {
      candle.high = Math.max(candle.high, price);
      candle.low = Math.min(candle.low, price);
      candle.close = price;
      candle.volume += volume;
    }
  });
}

/**
 * 自动生成 Flat Candle（平盘K线）
 * 为所有交易对生成当前周期的平盘K线
 */
export function generateFlatCandles() {
  const now = Date.now();

  Object.keys(lastPrices).forEach((symbol) => {
    const price = lastPrices[symbol];

    const intervals: Interval[] = ['1m', '5m', '15m'];

    intervals.forEach((interval) => {
      const openTime = getOpenTime(now, interval);
      const cacheKey = getCacheKey(symbol, interval, openTime);

      if (!candleCache[cacheKey]) {
        candleCache[cacheKey] = {
          symbol,
          open: price,
          high: price,
          low: price,
          close: price,
          volume: 0,
          openTime,
          closeTime: openTime + getIntervalMs(interval),
          interval,
        };

        console.log(
          `[KlineEngine] 🟰 Flat candle ${symbol} ${interval} ${new Date(
            openTime
          ).toLocaleTimeString()}`
        );
      }
    });
  });
}

/**
 * 批量写入数据库
 */
export async function flushCandles() {
  const candles = Object.values(candleCache);

  if (!candles.length) {
    console.log(`[KlineEngine] ℹ️ No candles to flush. Cache empty.`);
    return;
  }

  const data = candles.map((c) => ({
    symbol: c.symbol,
    interval: c.interval,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
    volume: c.volume,
    open_time: new Date(c.openTime).toISOString(),
    close_time: new Date(c.closeTime).toISOString(),
  }));

  try {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('klines')
      .upsert(data, {
        onConflict: 'symbol,interval,open_time',
        ignoreDuplicates: false
      });

    if (error) {
      console.error('[KlineEngine] ❌ Flush error:', error.message);
      throw error;
    }

    console.log(`[KlineEngine] ✅ Flushed ${data.length} candles to database`);

    // 打印部分 K 线信息（最多 5 个）
    const previewCandles = candles.slice(0, 5);
    previewCandles.forEach((candle) => {
      console.log(
        `   ${candle.symbol} ${candle.interval}: ` +
        `O=${candle.open.toFixed(2)} H=${candle.high.toFixed(2)} ` +
        `L=${candle.low.toFixed(2)} C=${candle.close.toFixed(2)} ` +
        `@${new Date(candle.openTime).toLocaleTimeString()}`
      );
    });
  } catch (err) {
    console.error('[KlineEngine] ❌ Flush error:', err);
  }

  // 清空缓存
  Object.keys(candleCache).forEach((k) => delete candleCache[k]);
}

/**
 * 获取缓存的 K 线数量
 */
export function getCachedCandlesCount(): number {
  return Object.keys(candleCache).length;
}

/**
 * 获取最后成交价格
 */
export function getLastPrice(symbol: string): number | undefined {
  return lastPrices[symbol];
}

/**
 * 获取所有最后成交价格
 */
export function getAllLastPrices(): Record<string, number> {
  return { ...lastPrices };
}

/**
 * 初始化最后价格（用于重启后恢复）
 */
export function initLastPrice(symbol: string, price: number): void {
  if (!lastPrices[symbol]) {
    lastPrices[symbol] = price;
    console.log(`[KlineEngine] 📥 Initialized last price for ${symbol}: $${price}`);
  }
}

/**
 * 清空缓存（仅用于测试）
 */
export function clearCandleCache(): void {
  for (const key in candleCache) {
    delete candleCache[key];
  }
  console.log('[KlineEngine] 🧹 Candle cache cleared');
}

/**
 * 清空最后价格（仅用于测试）
 */
export function clearLastPrices(): void {
  for (const key in lastPrices) {
    delete lastPrices[key];
  }
  console.log('[KlineEngine] 🧹 Last prices cleared');
}
