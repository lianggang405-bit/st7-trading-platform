/**
 * Redis 配置
 */

import Redis from 'ioredis';

let redisClient: Redis | null = null;

/**
 * 获取 Redis 客户端（延迟初始化）
 */
export function getRedisClient(): Redis {
  if (!redisClient) {
    // 从环境变量读取配置
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    redisClient = new Redis(redisUrl, {
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        console.log(`[Redis] ⚠️  Reconnecting in ${delay}ms...`);
        return delay;
      },
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      keepAlive: 30000,
    });

    // 连接事件
    redisClient.on('connect', () => {
      console.log('[Redis] ✅ Connected');
    });

    redisClient.on('error', (error) => {
      console.error('[Redis] ❌ Connection error:', error.message);
    });

    redisClient.on('close', () => {
      console.log('[Redis] ⚠️  Connection closed');
    });

    redisClient.on('reconnecting', () => {
      console.log('[Redis] 🔄 Reconnecting...');
    });
  }

  return redisClient;
}

/**
 * 测试 Redis 连接
 */
export async function testRedisConnection(): Promise<boolean> {
  try {
    const redis = getRedisClient();
    await redis.ping();
    console.log('[Redis] ✅ Connection test successful');
    return true;
  } catch (error) {
    console.error('[Redis] ❌ Connection test failed:', error);
    return false;
  }
}

/**
 * 检查 Redis 是否可用
 */
export function isRedisEnabled(): boolean {
  return redisClient !== null && redisClient.status === 'ready';
}

/**
 * 关闭 Redis 连接
 */
export async function closeRedisConnection(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log('[Redis] 🔌 Connection closed');
  }
}
