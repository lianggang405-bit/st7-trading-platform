import { getSupabase } from '../config/database';
import { broadcastKline } from '../ws/market-server';
import { isRedisEnabled, getRedisClient } from '../config/redis';
import {
  getAggregatedKlinesFromRedis,
  setAggregatedKlinesToRedis,
  invalidateAggregatedCache
} from '../cache/redis-cache';

export type Interval = '1m' | '5m' | '15m';

/**
 * 聚合周期类型（用于增量聚合）
 */
export type AggregationInterval = '5m' | '15m' | '1h' | '1d';

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

/**
 * 增量聚合状态
 */
interface AggregationState {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  openTime: number;
  closeTime: number;
}

const candleCache: Record<string, Candle> = {};
const lastPrices: Record<string, number> = {};

/**
 * 增量聚合状态缓存
 * key: symbol_resolution (例如: XAUUSD_5m)
 */
const aggregationStateCache: Record<string, AggregationState> = {};

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
 * 并通过 WebSocket 实时推送
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

    // 实时推送 K 线更新到前端
    broadcastKline(symbol, interval, candle);

    // ✅ 如果是 1m K 线更新，触发增量聚合
    if (interval === '1m') {
      updateAggregatedCandle(symbol, candle);
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
 * 批量写入数据库和 Redis 缓存
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

    // 使聚合缓存失效（主动更新缓存策略）
    const uniqueSymbols = [...new Set(candles.map(c => c.symbol))];
    for (const symbol of uniqueSymbols) {
      await invalidateAggregatedCache(symbol);
    }

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
 * K线聚合（从 1m 聚合到其他时间周期）
 *
 * 聚合规则：
 * - open  = 第一根 1m K 线的 open
 * - close = 最后一根 1m K 线的 close
 * - high  = 所有 1m K 线的最大 high
 * - low   = 所有 1m K 线的最小 low
 * - volume = 所有 1m K 线的 volume 总和
 *
 * @param candles 1m K 线数据数组（必须按时间升序排列）
 * @param targetInterval 目标时间周期（5m, 15m, 1h, 1d）
 * @returns 聚合后的 K 线数据数组
 */
export function aggregateCandles(
  candles: Array<{ open_time: string; open: number; high: number; low: number; close: number; volume: number }>,
  targetInterval: '5m' | '15m' | '1h' | '1d'
): Array<{ time: number; open: number; high: number; low: number; close: number; volume: number }> {
  if (!candles || candles.length === 0) {
    console.log(`[KlineEngine] 📊 No candles to aggregate for ${targetInterval}`);
    return [];
  }

  // 计算需要聚合的 1m K 线数量
  const aggregationCount = getAggregationCount(targetInterval);

  console.log(`[KlineEngine] 📊 Aggregating ${candles.length} 1m candles to ${targetInterval} (${candles.length / aggregationCount} target candles expected)`);

  const result: Array<{ time: number; open: number; high: number; low: number; close: number; volume: number }> = [];

  // 按时间窗口分组聚合
  for (let i = 0; i < candles.length; i += aggregationCount) {
    // 获取当前窗口的 K 线切片
    const slice = candles.slice(i, i + aggregationCount);

    if (slice.length === 0) continue;

    // 计算聚合 K 线
    const open = slice[0].open;
    const close = slice[slice.length - 1].close;
    const high = Math.max(...slice.map(c => c.high));
    const low = Math.min(...slice.map(c => c.low));
    const volume = slice.reduce((sum, c) => sum + c.volume, 0);

    // 获取时间戳（使用第一根 K 线的时间）
    const time = Math.floor(new Date(slice[0].open_time).getTime() / 1000); // 转换为秒级

    result.push({
      time,
      open,
      high,
      low,
      close,
      volume,
    });
  }

  console.log(`[KlineEngine] ✅ Aggregated ${result.length} ${targetInterval} candles`);

  return result;
}

/**
 * 获取聚合系数
 * @param targetInterval 目标时间周期
 * @returns 需要聚合的 1m K 线数量
 */
function getAggregationCount(targetInterval: '5m' | '15m' | '1h' | '1d'): number {
  switch (targetInterval) {
    case '5m':
      return 5;
    case '15m':
      return 15;
    case '1h':
      return 60;
    case '1d':
      return 1440; // 24 * 60
    default:
      return 1;
  }
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

// ==================== 增量聚合引擎 ====================

/**
 * 获取聚合周期的毫秒数
 */
function getAggregationIntervalMs(interval: AggregationInterval): number {
  switch (interval) {
    case '5m':
      return 5 * 60_000;
    case '15m':
      return 15 * 60_000;
    case '1h':
      return 60 * 60_000;
    case '1d':
      return 24 * 60 * 60_000;
  }
}

/**
 * 获取聚合周期的开盘时间
 */
function getAggregationOpenTime(timestamp: number, interval: AggregationInterval): number {
  const ms = getAggregationIntervalMs(interval);
  return Math.floor(timestamp / ms) * ms;
}

/**
 * 构建聚合状态缓存键
 */
function getAggregationStateKey(symbol: string, interval: AggregationInterval): string {
  return `${symbol.toUpperCase()}_${interval}`;
}

/**
 * 增量更新聚合 K 线
 * 当新的 1m K 线到达时，自动更新所有聚合周期的 K 线
 *
 * @param symbol 交易对
 * @param candle 新的 1m K 线数据
 */
export function updateAggregatedCandle(symbol: string, candle: Candle): void {
  const intervals: AggregationInterval[] = ['5m', '15m', '1h', '1d'];

  intervals.forEach((interval) => {
    const stateKey = getAggregationStateKey(symbol, interval);
    const openTime = getAggregationOpenTime(candle.openTime, interval);
    const closeTime = openTime + getAggregationIntervalMs(interval);

    let state = aggregationStateCache[stateKey];

    if (!state) {
      // 初始化新的聚合周期
      state = {
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume,
        openTime,
        closeTime,
      };

      aggregationStateCache[stateKey] = state;

      console.log(
        `[Aggregation] 🆕 New ${interval} candle for ${symbol}: ` +
        `open=${state.open.toFixed(2)} @${new Date(openTime).toLocaleTimeString()}`
      );
    } else if (state.openTime !== openTime) {
      // 新的聚合周期开始，保存上一个周期并开始新周期
      saveAggregatedCandle(symbol, interval, state);

      state = {
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume,
        openTime,
        closeTime,
      };

      aggregationStateCache[stateKey] = state;

      console.log(
        `[Aggregation] 🔄 New ${interval} period for ${symbol}: ` +
        `open=${state.open.toFixed(2)} @${new Date(openTime).toLocaleTimeString()}`
      );
    } else {
      // 同一个聚合周期，更新数据
      state.high = Math.max(state.high, candle.high);
      state.low = Math.min(state.low, candle.low);
      state.close = candle.close;
      state.volume += candle.volume;

      console.log(
        `[Aggregation] 📊 Updated ${interval} candle for ${symbol}: ` +
        `O=${state.open.toFixed(2)} H=${state.high.toFixed(2)} ` +
        `L=${state.low.toFixed(2)} C=${state.close.toFixed(2)} V=${state.volume.toFixed(2)}`
      );
    }
  });
}

/**
 * 保存聚合 K 线到 Redis
 */
async function saveAggregatedCandle(
  symbol: string,
  interval: AggregationInterval,
  state: AggregationState
): Promise<void> {
  if (!isRedisEnabled()) return;

  try {
    const redis = getRedisClient();
    const key = `kline:${symbol.toUpperCase()}:${interval}`;

    // 使用 Redis List 存储聚合 K 线（最新的在前面）
    const candleData = {
      time: Math.floor(state.openTime / 1000), // 秒级时间戳
      open: state.open,
      high: state.high,
      low: state.low,
      close: state.close,
      volume: state.volume,
    };

    // LPUT - 保留最近 1000 根 K 线
    await redis.lpush(key, JSON.stringify(candleData));
    await redis.ltrim(key, 0, 999); // 保留前 1000 个元素
    await redis.expire(key, 86400); // 24 小时过期

    console.log(
      `[Aggregation] 💾 Saved ${interval} candle to Redis: ${symbol} ` +
      `@${new Date(state.openTime).toLocaleTimeString()}`
    );
  } catch (error) {
    console.error(`[Aggregation] ❌ Error saving ${interval} candle for ${symbol}:`, error);
  }
}

/**
 * 获取聚合 K 线列表（从 Redis）
 * @param symbol 交易对
 * @param interval 时间周期
 * @param limit 数量限制
 */
export async function getAggregatedKlineList(
  symbol: string,
  interval: AggregationInterval,
  limit = 1000
): Promise<Array<{ time: number; open: number; high: number; low: number; close: number; volume: number }>> {
  if (!isRedisEnabled()) return [];

  try {
    const redis = getRedisClient();
    const key = `kline:${symbol.toUpperCase()}:${interval}`;

    const data = await redis.lrange(key, 0, limit - 1);

    return data.map((item) => JSON.parse(item));
  } catch (error) {
    console.error(`[Aggregation] ❌ Error getting ${interval} candles for ${symbol}:`, error);
    return [];
  }
}

/**
 * 强制刷新所有聚合状态（用于测试或重置）
 */
export function flushAggregationStates(): void {
  for (const key in aggregationStateCache) {
    delete aggregationStateCache[key];
  }
  console.log('[Aggregation] 🧹 All aggregation states flushed');
}
