/**
 * K线数据获取工具（通过后端API代理）
 * 使用行情聚合层，自动选择数据源
 */

// 统一的K线数据格式
export interface KlineResponse {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * 从后端API获取历史K线数据
 * @param symbol 交易对（如 XAUUSD, BTCUSD）
 * @param interval 时间周期（如 1M, 5M, 15M, 1H）
 * @param limit K线数量（默认80，最大1000）
 * @returns K线数据数组
 */
export async function fetchBinanceKlines(
  symbol: string,
  interval: string,
  limit: number = 80
): Promise<KlineResponse[]> {
  try {
    const url = `/api/klines?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}&limit=${limit}`;

    console.log(`[Klines] 请求: ${url}`);

    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API error: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(`API error: ${data.error || 'Unknown error'}`);
    }

    // ✅ 如果返回空数组，抛出错误以触发模拟数据生成
    if (!data.data || data.data.length === 0) {
      console.warn(`[Klines] API 返回空数据，将使用模拟数据`);
      throw new Error(`No data available for ${symbol} ${interval}`);
    }

    console.log(`[Klines] 成功获取 ${data.data.length} 条K线数据`);

    return data.data;
  } catch (error) {
    console.error('[Klines] 获取K线数据失败:', error);
    throw error;
  }
}

/**
 * K线缓存
 * 避免频繁请求API
 */
interface KlineCache {
  [key: string]: {
    data: KlineResponse[];
    timestamp: number;
  };
}

const klineCache: KlineCache = {};
const CACHE_DURATION = 60 * 1000; // 缓存1分钟

/**
 * 获取K线数据（带缓存）
 * @param symbol 交易对
 * @param interval 时间周期
 * @param limit K线数量
 * @returns K线数据数组
 */
export async function getKlinesWithCache(
  symbol: string,
  interval: string,
  limit: number = 80
): Promise<KlineResponse[]> {
  const cacheKey = `${symbol}_${interval}_${limit}`;
  const cached = klineCache[cacheKey];

  // 检查缓存是否有效
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('[Klines] 使用缓存数据');
    return cached.data;
  }

  // 从API获取新数据
  const data = await fetchBinanceKlines(symbol, interval, limit);

  // 更新缓存
  klineCache[cacheKey] = {
    data,
    timestamp: Date.now(),
  };

  return data;
}

/**
 * 清除K线缓存
 * @param symbol 交易对（可选，不传则清除所有）
 * @param interval 时间周期（可选）
 */
export function clearKlineCache(symbol?: string, interval?: string) {
  if (!symbol) {
    // 清除所有缓存
    Object.keys(klineCache).forEach(key => {
      delete klineCache[key];
    });
    console.log('[Klines] 清除所有缓存');
  } else {
    const prefix = `${symbol}_${interval || ''}`;
    Object.keys(klineCache).forEach(key => {
      if (key.startsWith(prefix)) {
        delete klineCache[key];
      }
    });
    console.log(`[Klines] 清除缓存: ${prefix}`);
  }
}
