/**
 * Redis 行情缓存模块
 *
 * 功能：
 * - 缓存 Ticker 数据（24h 统计）
 * - 缓存 OrderBook 数据（深度数据）
 * - 缓存 Market 数据（实时行情）
 * - 支持批量读写
 * - 自动过期
 * - 降级策略（Redis 不可用时使用内存缓存）
 */

import { getRedisClient, testRedisConnection } from '../config/redis';
import { Ticker24h } from '../engine/ticker-engine';
import { OrderBook } from '../engine/orderbook-engine';
import { Ticker } from '../cache/market-cache';

/**
 * Redis 缓存键前缀
 */
const KEY_PREFIXES = {
  TICKER: 'ticker',
  ORDERBOOK: 'orderbook',
  MARKET: 'market',
};

/**
 * 过期时间（秒）
 */
const TTL = {
  TICKER: 60,        // Ticker 数据：1 分钟
  ORDERBOOK: 5,      // OrderBook 数据：5 秒
  MARKET: 30,        // Market 数据：30 秒
};

/**
 * Redis 是否可用
 */
let redisAvailable = false;

/**
 * 初始化 Redis 缓存
 */
export async function initRedisCache(): Promise<void> {
  redisAvailable = await testRedisConnection();
  if (!redisAvailable) {
    console.warn('[RedisCache] ⚠️  Redis not available, using memory cache only');
  }
}

// ==================== K 线聚合缓存 ====================

/**
 * 缓存键前缀
 */
const KLINE_KEY_PREFIX = 'kline';

/**
 * 缓存过期时间（秒）
 */
const KLINE_CACHE_TTL = 60; // 60 秒

/**
 * 构建 K 线聚合缓存键
 * 格式：kline:{symbol}:{resolution}
 */
function buildAggregatedKlineKey(symbol: string, resolution: string): string {
  return `${KLINE_KEY_PREFIX}:${symbol.toUpperCase()}:${resolution}`;
}

/**
 * 聚合 K 线数据接口
 */
export interface AggregatedCandle {
  open_time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * 设置聚合 K 线数据到 Redis
 * @param symbol 交易对
 * @param resolution 时间周期
 * @param candles K 线数据
 */
export async function setAggregatedKlinesToRedis(
  symbol: string,
  resolution: string,
  candles: AggregatedCandle[]
): Promise<void> {
  if (!redisAvailable) return;

  try {
    const redis = getRedisClient();
    const key = buildAggregatedKlineKey(symbol, resolution);
    const value = JSON.stringify(candles);

    await redis.setex(key, KLINE_CACHE_TTL, value);
    console.log(
      `[RedisCache] ✅ Cached ${candles.length} aggregated klines: ${symbol} ${resolution}`
    );
  } catch (error) {
    console.error(
      `[RedisCache] ❌ Error setting aggregated klines ${symbol} ${resolution}:`,
      error
    );
    redisAvailable = false;
  }
}

/**
 * 从 Redis 获取聚合 K 线数据
 * @param symbol 交易对
 * @param resolution 时间周期
 * @returns K 线数据或 null
 */
export async function getAggregatedKlinesFromRedis(
  symbol: string,
  resolution: string
): Promise<AggregatedCandle[] | null> {
  if (!redisAvailable) return null;

  try {
    const redis = getRedisClient();
    const key = buildAggregatedKlineKey(symbol, resolution);
    const value = await redis.get(key);

    if (!value) {
      return null;
    }

    const candles = JSON.parse(value) as AggregatedCandle[];
    console.log(
      `[RedisCache] 📦 Retrieved ${candles.length} cached klines: ${symbol} ${resolution}`
    );

    return candles;
  } catch (error) {
    console.error(
      `[RedisCache] ❌ Error getting cached klines ${symbol} ${resolution}:`,
      error
    );
    return null;
  }
}

/**
 * 使指定交易对的所有聚合缓存失效
 * @param symbol 交易对
 */
export async function invalidateAggregatedCache(symbol: string): Promise<void> {
  if (!redisAvailable) return;

  try {
    const redis = getRedisClient();
    const pattern = `${KLINE_KEY_PREFIX}:${symbol.toUpperCase()}:*`;
    const keys = await redis.keys(pattern);

    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(
        `[RedisCache] 🗑️  Invalidated ${keys.length} cache entries for ${symbol}`
      );
    }
  } catch (error) {
    console.error(`[RedisCache] ❌ Error invalidating cache for ${symbol}:`, error);
  }
}

/**
 * 批量设置多个交易对的聚合 K 线数据
 * @param entries K 线数据数组
 */
export async function setAggregatedKlinesBatch(
  entries: Array<{ symbol: string; resolution: string; candles: AggregatedCandle[] }>
): Promise<void> {
  if (!redisAvailable || entries.length === 0) return;

  try {
    const redis = getRedisClient();
    const pipeline = redis.pipeline();

    for (const entry of entries) {
      const key = buildAggregatedKlineKey(entry.symbol, entry.resolution);
      const value = JSON.stringify(entry.candles);
      pipeline.setex(key, KLINE_CACHE_TTL, value);
    }

    await pipeline.exec();
    console.log(
      `[RedisCache] ✅ Batch cached ${entries.length} aggregated kline entries`
    );
  } catch (error) {
    console.error('[RedisCache] ❌ Error batch caching aggregated klines:', error);
    redisAvailable = false;
  }
}

/**
 * 构建 Ticker 缓存键
 */
function buildTickerKey(symbol: string): string {
  return `${KEY_PREFIXES.TICKER}:${symbol.toUpperCase()}`;
}

/**
 * 构建 OrderBook 缓存键
 */
function buildOrderBookKey(symbol: string): string {
  return `${KEY_PREFIXES.ORDERBOOK}:${symbol.toUpperCase()}`;
}

/**
 * 构建 Market 缓存键
 */
function buildMarketKey(symbol: string): string {
  return `${KEY_PREFIXES.MARKET}:${symbol.toUpperCase()}`;
}

// ==================== Ticker 缓存 ====================

/**
 * 设置 Ticker 数据
 */
export async function setTickerToRedis(symbol: string, ticker: Ticker24h): Promise<void> {
  if (!redisAvailable) return;

  try {
    const redis = getRedisClient();
    const key = buildTickerKey(symbol);
    const value = JSON.stringify(ticker);

    await redis.setex(key, TTL.TICKER, value);
    // console.log(`[RedisCache] ✅ Set ticker: ${symbol}`);
  } catch (error) {
    console.error(`[RedisCache] ❌ Error setting ticker ${symbol}:`, error);
    redisAvailable = false;
  }
}

/**
 * 获取 Ticker 数据
 */
export async function getTickerFromRedis(symbol: string): Promise<Ticker24h | null> {
  if (!redisAvailable) return null;

  try {
    const redis = getRedisClient();
    const key = buildTickerKey(symbol);
    const value = await redis.get(key);

    if (!value) {
      return null;
    }

    return JSON.parse(value) as Ticker24h;
  } catch (error) {
    console.error(`[RedisCache] ❌ Error getting ticker ${symbol}:`, error);
    return null;
  }
}

/**
 * 批量设置 Ticker 数据
 */
export async function setTickersToRedis(tickers: Ticker24h[]): Promise<void> {
  if (!redisAvailable || tickers.length === 0) return;

  try {
    const redis = getRedisClient();
    const pipeline = redis.pipeline();

    for (const ticker of tickers) {
      const key = buildTickerKey(ticker.symbol);
      const value = JSON.stringify(ticker);
      pipeline.setex(key, TTL.TICKER, value);
    }

    await pipeline.exec();
    console.log(`[RedisCache] ✅ Set ${tickers.length} tickers`);
  } catch (error) {
    console.error('[RedisCache] ❌ Error setting tickers:', error);
    redisAvailable = false;
  }
}

/**
 * 批量获取 Ticker 数据
 */
export async function getTickersFromRedis(symbols: string[]): Promise<Map<string, Ticker24h>> {
  if (!redisAvailable || symbols.length === 0) return new Map();

  try {
    const redis = getRedisClient();
    const keys = symbols.map(s => buildTickerKey(s));
    const values = await redis.mget(...keys);

    const result = new Map<string, Ticker24h>();

    for (let i = 0; i < keys.length; i++) {
      const symbol = symbols[i];
      const value = values[i];

      if (value) {
        try {
          result.set(symbol, JSON.parse(value) as Ticker24h);
        } catch (error) {
          console.error(`[RedisCache] ❌ Error parsing ticker ${symbol}:`, error);
        }
      }
    }

    return result;
  } catch (error) {
    console.error('[RedisCache] ❌ Error getting tickers:', error);
    return new Map();
  }
}

/**
 * 删除 Ticker 数据
 */
export async function deleteTickerFromRedis(symbol: string): Promise<void> {
  if (!redisAvailable) return;

  try {
    const redis = getRedisClient();
    const key = buildTickerKey(symbol);
    await redis.del(key);
  } catch (error) {
    console.error(`[RedisCache] ❌ Error deleting ticker ${symbol}:`, error);
  }
}

// ==================== OrderBook 缓存 ====================

/**
 * 设置 OrderBook 数据
 */
export async function setOrderBookToRedis(symbol: string, orderBook: OrderBook): Promise<void> {
  if (!redisAvailable) return;

  try {
    const redis = getRedisClient();
    const key = buildOrderBookKey(symbol);
    const value = JSON.stringify(orderBook);

    await redis.setex(key, TTL.ORDERBOOK, value);
    // console.log(`[RedisCache] ✅ Set orderbook: ${symbol}`);
  } catch (error) {
    console.error(`[RedisCache] ❌ Error setting orderbook ${symbol}:`, error);
    redisAvailable = false;
  }
}

/**
 * 获取 OrderBook 数据
 */
export async function getOrderBookFromRedis(symbol: string): Promise<OrderBook | null> {
  if (!redisAvailable) return null;

  try {
    const redis = getRedisClient();
    const key = buildOrderBookKey(symbol);
    const value = await redis.get(key);

    if (!value) {
      return null;
    }

    return JSON.parse(value) as OrderBook;
  } catch (error) {
    console.error(`[RedisCache] ❌ Error getting orderbook ${symbol}:`, error);
    return null;
  }
}

/**
 * 批量设置 OrderBook 数据
 */
export async function setOrderBooksToRedis(orderBooks: OrderBook[]): Promise<void> {
  if (!redisAvailable || orderBooks.length === 0) return;

  try {
    const redis = getRedisClient();
    const pipeline = redis.pipeline();

    for (const ob of orderBooks) {
      const key = buildOrderBookKey(ob.symbol);
      const value = JSON.stringify(ob);
      pipeline.setex(key, TTL.ORDERBOOK, value);
    }

    await pipeline.exec();
    console.log(`[RedisCache] ✅ Set ${orderBooks.length} orderbooks`);
  } catch (error) {
    console.error('[RedisCache] ❌ Error setting orderbooks:', error);
    redisAvailable = false;
  }
}

/**
 * 批量获取 OrderBook 数据
 */
export async function getOrderBooksFromRedis(symbols: string[]): Promise<Map<string, OrderBook>> {
  if (!redisAvailable || symbols.length === 0) return new Map();

  try {
    const redis = getRedisClient();
    const keys = symbols.map(s => buildOrderBookKey(s));
    const values = await redis.mget(...keys);

    const result = new Map<string, OrderBook>();

    for (let i = 0; i < keys.length; i++) {
      const symbol = symbols[i];
      const value = values[i];

      if (value) {
        try {
          result.set(symbol, JSON.parse(value) as OrderBook);
        } catch (error) {
          console.error(`[RedisCache] ❌ Error parsing orderbook ${symbol}:`, error);
        }
      }
    }

    return result;
  } catch (error) {
    console.error('[RedisCache] ❌ Error getting orderbooks:', error);
    return new Map();
  }
}

/**
 * 删除 OrderBook 数据
 */
export async function deleteOrderBookFromRedis(symbol: string): Promise<void> {
  if (!redisAvailable) return;

  try {
    const redis = getRedisClient();
    const key = buildOrderBookKey(symbol);
    await redis.del(key);
  } catch (error) {
    console.error(`[RedisCache] ❌ Error deleting orderbook ${symbol}:`, error);
  }
}

// ==================== Market 缓存 ====================

/**
 * 设置 Market 数据
 */
export async function setMarketToRedis(symbol: string, market: Ticker): Promise<void> {
  if (!redisAvailable) return;

  try {
    const redis = getRedisClient();
    const key = buildMarketKey(symbol);
    const value = JSON.stringify(market);

    await redis.setex(key, TTL.MARKET, value);
    // console.log(`[RedisCache] ✅ Set market: ${symbol}`);
  } catch (error) {
    console.error(`[RedisCache] ❌ Error setting market ${symbol}:`, error);
    redisAvailable = false;
  }
}

/**
 * 获取 Market 数据
 */
export async function getMarketFromRedis(symbol: string): Promise<Ticker | null> {
  if (!redisAvailable) return null;

  try {
    const redis = getRedisClient();
    const key = buildMarketKey(symbol);
    const value = await redis.get(key);

    if (!value) {
      return null;
    }

    return JSON.parse(value) as Ticker;
  } catch (error) {
    console.error(`[RedisCache] ❌ Error getting market ${symbol}:`, error);
    return null;
  }
}

/**
 * 批量设置 Market 数据
 */
export async function setMarketsToRedis(markets: Ticker[]): Promise<void> {
  if (!redisAvailable || markets.length === 0) return;

  try {
    const redis = getRedisClient();
    const pipeline = redis.pipeline();

    for (const market of markets) {
      const key = buildMarketKey(market.symbol);
      const value = JSON.stringify(market);
      pipeline.setex(key, TTL.MARKET, value);
    }

    await pipeline.exec();
    console.log(`[RedisCache] ✅ Set ${markets.length} markets`);
  } catch (error) {
    console.error('[RedisCache] ❌ Error setting markets:', error);
    redisAvailable = false;
  }
}

/**
 * 批量获取 Market 数据
 */
export async function getMarketsFromRedis(symbols: string[]): Promise<Map<string, Ticker>> {
  if (!redisAvailable || symbols.length === 0) return new Map();

  try {
    const redis = getRedisClient();
    const keys = symbols.map(s => buildMarketKey(s));
    const values = await redis.mget(...keys);

    const result = new Map<string, Ticker>();

    for (let i = 0; i < keys.length; i++) {
      const symbol = symbols[i];
      const value = values[i];

      if (value) {
        try {
          result.set(symbol, JSON.parse(value) as Ticker);
        } catch (error) {
          console.error(`[RedisCache] ❌ Error parsing market ${symbol}:`, error);
        }
      }
    }

    return result;
  } catch (error) {
    console.error('[RedisCache] ❌ Error getting markets:', error);
    return new Map();
  }
}

/**
 * 删除 Market 数据
 */
export async function deleteMarketFromRedis(symbol: string): Promise<void> {
  if (!redisAvailable) return;

  try {
    const redis = getRedisClient();
    const key = buildMarketKey(symbol);
    await redis.del(key);
  } catch (error) {
    console.error(`[RedisCache] ❌ Error deleting market ${symbol}:`, error);
  }
}

// ==================== 通用方法 ====================

/**
 * 清空所有缓存
 */
export async function clearAllCache(): Promise<void> {
  if (!redisAvailable) return;

  try {
    const redis = getRedisClient();
    const keys = await redis.keys(`${KEY_PREFIXES.TICKER}:*`);

    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`[RedisCache] ✅ Cleared ${keys.length} cache entries`);
    }
  } catch (error) {
    console.error('[RedisCache] ❌ Error clearing cache:', error);
  }
}

/**
 * 获取缓存统计信息
 */
export async function getCacheStats(): Promise<{
  ticker: number;
  orderbook: number;
  market: number;
  total: number;
}> {
  if (!redisAvailable) {
    return { ticker: 0, orderbook: 0, market: 0, total: 0 };
  }

  try {
    const redis = getRedisClient();

    const [tickerKeys, orderbookKeys, marketKeys] = await Promise.all([
      redis.keys(`${KEY_PREFIXES.TICKER}:*`),
      redis.keys(`${KEY_PREFIXES.ORDERBOOK}:*`),
      redis.keys(`${KEY_PREFIXES.MARKET}:*`),
    ]);

    return {
      ticker: tickerKeys.length,
      orderbook: orderbookKeys.length,
      market: marketKeys.length,
      total: tickerKeys.length + orderbookKeys.length + marketKeys.length,
    };
  } catch (error) {
    console.error('[RedisCache] ❌ Error getting cache stats:', error);
    return { ticker: 0, orderbook: 0, market: 0, total: 0 };
  }
}
