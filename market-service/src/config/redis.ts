import Redis from 'ioredis';

/**
 * Redis 客户端
 * 用于 K 线数据缓存，减少数据库查询压力
 */
let redisClient: Redis | null = null;
let redisEnabled: boolean = false;

/**
 * 初始化 Redis 连接
 */
export function initRedis(): void {
  const redisUrl = process.env.REDIS_URL;
  const redisHost = process.env.REDIS_HOST || 'localhost';
  const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);

  if (redisUrl) {
    // 使用 REDIS_URL（完整连接字符串）
    try {
      redisClient = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
      });

      redisClient.on('connect', () => {
        console.log('[Redis] ✅ Connected');
        redisEnabled = true;
      });

      redisClient.on('error', (err) => {
        console.error('[Redis] ❌ Connection error:', err.message);
        redisEnabled = false;
      });

      redisClient.on('close', () => {
        console.warn('[Redis] ⚠️ Connection closed');
        redisEnabled = false;
      });

      // 测试连接
      redisClient.ping().then(() => {
        console.log('[Redis] ✅ Ping successful');
      }).catch((err) => {
        console.error('[Redis] ❌ Ping failed:', err.message);
        redisEnabled = false;
      });

    } catch (error) {
      console.error('[Redis] ❌ Failed to create client:', error);
      redisEnabled = false;
    }
  } else {
    // 使用 REDIS_HOST 和 REDIS_PORT
    try {
      redisClient = new Redis({
        host: redisHost,
        port: redisPort,
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
      });

      redisClient.on('connect', () => {
        console.log('[Redis] ✅ Connected');
        redisEnabled = true;
      });

      redisClient.on('error', (err) => {
        console.error('[Redis] ❌ Connection error:', err.message);
        redisEnabled = false;
      });

      redisClient.on('close', () => {
        console.warn('[Redis] ⚠️ Connection closed');
        redisEnabled = false;
      });

      // 测试连接
      redisClient.ping().then(() => {
        console.log('[Redis] ✅ Ping successful');
      }).catch((err) => {
        console.error('[Redis] ❌ Ping failed:', err.message);
        redisEnabled = false;
      });

    } catch (error) {
      console.error('[Redis] ❌ Failed to create client:', error);
      redisEnabled = false;
    }
  }
}

/**
 * 获取 Redis 客户端
 */
export function getRedis(): Redis | null {
  return redisClient;
}

/**
 * 检查 Redis 是否可用
 */
export function isRedisEnabled(): boolean {
  return redisEnabled && redisClient !== null;
}

/**
 * 缓存 K 线数据
 * @param symbol 交易对
 * @param interval 时间周期
 * @param openTime K线开始时间
 * @param candle K线数据
 * @param expireSeconds 过期时间（秒），默认 1 小时
 */
export async function cacheKline(
  symbol: string,
  interval: string,
  openTime: number,
  candle: any,
  expireSeconds: number = 3600
): Promise<void> {
  if (!isRedisEnabled()) {
    return;
  }

  try {
    const key = `kline:${symbol}:${interval}:${openTime}`;
    const value = JSON.stringify(candle);

    await redisClient!.setex(key, expireSeconds, value);
  } catch (error) {
    console.error('[Redis] ❌ Error caching kline:', error);
  }
}

/**
 * 批量缓存 K 线数据
 * @param candles K线数组
 * @param expireSeconds 过期时间（秒），默认 1 小时
 */
export async function cacheKlines(
  candles: any[],
  expireSeconds: number = 3600
): Promise<void> {
  if (!isRedisEnabled() || candles.length === 0) {
    return;
  }

  try {
    const pipeline = redisClient!.pipeline();

    candles.forEach((candle) => {
      const key = `kline:${candle.symbol}:${candle.interval}:${candle.openTime}`;
      const value = JSON.stringify(candle);
      pipeline.setex(key, expireSeconds, value);
    });

    await pipeline.exec();
  } catch (error) {
    console.error('[Redis] ❌ Error caching klines:', error);
  }
}

/**
 * 获取缓存的 K 线数据
 * @param symbol 交易对
 * @param interval 时间周期
 * @param openTime K线开始时间
 */
export async function getCachedKline(
  symbol: string,
  interval: string,
  openTime: number
): Promise<any | null> {
  if (!isRedisEnabled()) {
    return null;
  }

  try {
    const key = `kline:${symbol}:${interval}:${openTime}`;
    const value = await redisClient!.get(key);

    if (value) {
      return JSON.parse(value);
    }

    return null;
  } catch (error) {
    console.error('[Redis] ❌ Error getting cached kline:', error);
    return null;
  }
}

/**
 * 获取缓存的 K 线列表
 * @param symbol 交易对
 * @param interval 时间周期
 * @param limit 数量限制
 */
export async function getCachedKlines(
  symbol: string,
  interval: string,
  limit: number = 100
): Promise<any[]> {
  if (!isRedisEnabled()) {
    return [];
  }

  try {
    const pattern = `kline:${symbol}:${interval}:*`;
    const keys = await redisClient!.keys(pattern);

    if (keys.length === 0) {
      return [];
    }

    // 按 openTime 排序（从 key 中提取 openTime）
    const sortedKeys = keys.sort((a, b) => {
      const openTimeA = parseInt(a.split(':').pop() || '0', 10);
      const openTimeB = parseInt(b.split(':').pop() || '0', 10);
      return openTimeB - openTimeA; // 降序（最新的在前）
    });

    // 限制数量
    const limitedKeys = sortedKeys.slice(0, limit);

    // 批量获取
    const pipeline = redisClient!.pipeline();
    limitedKeys.forEach((key) => {
      pipeline.get(key);
    });

    const results = await pipeline.exec();

    if (!results) {
      return [];
    }

    const klines: any[] = [];
    results.forEach(([err, value]) => {
      if (!err && value) {
        klines.push(JSON.parse(value as string));
      }
    });

    // 按 openTime 升序排序（TradingView 要求）
    return klines.sort((a, b) => a.openTime - b.openTime);
  } catch (error) {
    console.error('[Redis] ❌ Error getting cached klines:', error);
    return [];
  }
}

/**
 * 删除缓存的 K 线数据
 * @param symbol 交易对
 * @param interval 时间周期
 * @param openTime K线开始时间
 */
export async function deleteCachedKline(
  symbol: string,
  interval: string,
  openTime: number
): Promise<void> {
  if (!isRedisEnabled()) {
    return;
  }

  try {
    const key = `kline:${symbol}:${interval}:${openTime}`;
    await redisClient!.del(key);
  } catch (error) {
    console.error('[Redis] ❌ Error deleting cached kline:', error);
  }
}

/**
 * 清空所有 K 线缓存
 */
export async function clearKlineCache(): Promise<void> {
  if (!isRedisEnabled()) {
    return;
  }

  try {
    const pattern = 'kline:*';
    const keys = await redisClient!.keys(pattern);

    if (keys.length > 0) {
      await redisClient!.del(keys);
      console.log(`[Redis] 🧹 Cleared ${keys.length} kline cache entries`);
    }
  } catch (error) {
    console.error('[Redis] ❌ Error clearing kline cache:', error);
  }
}

/**
 * 关闭 Redis 连接
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    redisEnabled = false;
    console.log('[Redis] 🔌 Connection closed');
  }
}

// 初始化 Redis
initRedis();
