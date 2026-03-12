/**
 * FastForex API 服务模块
 *
 * 功能：
 * - 获取所有货币汇率
 * - 获取单个货币汇率
 * - 货币转换
 * - 历史汇率数据
 * - 缓存机制
 * - 降级处理
 */

const API_KEY = '2436830d15-eb1e17f63d-tbszt6';
const BASE_URL = 'https://api.fastforex.io';

// FastForex API 响应类型
export interface ForexResponse {
  base: string;
  results: Record<string, number>;
  updated: string;
  ms: number;
}

export interface ForexSingleResponse {
  base: string;
  result: Record<string, number>;
  updated: string;
  ms: number;
}

export interface ConvertResponse {
  base: string;
  amount: number;
  result: { [key: string]: number };
  rate: number;
  ms: number;
}

export interface TimeSeriesResponse {
  start: string;
  end: string;
  interval: string;
  base: string;
  results: Record<string, Record<string, number>>;
  ms: number;
}

// 缓存接口
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// 缓存配置
const CACHE_DURATION = 30000; // 30秒缓存

// 缓存存储
const cache = new Map<string, CacheEntry<any>>();

/**
 * 获取缓存数据
 */
function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;

  const age = Date.now() - entry.timestamp;
  if (age > CACHE_DURATION) {
    cache.delete(key);
    return null;
  }

  return entry.data as T;
}

/**
 * 设置缓存数据
 */
function setCached<T>(key: string, data: T): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

/**
 * 清除缓存
 */
export function clearCache(key?: string): void {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}

/**
 * 获取所有货币汇率
 */
export async function fetchAllForexRates(): Promise<ForexResponse> {
  const cacheKey = 'forex:all';

  // 检查缓存
  const cached = getCached<ForexResponse>(cacheKey);
  if (cached) {
    console.log('[FastForex] Using cached data for all rates');
    return cached;
  }

  try {
    console.log('[FastForex] Fetching all rates from API');
    const response = await fetch(`${BASE_URL}/fetch-all`, {
      headers: {
        'X-API-Key': API_KEY,
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`FastForex API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // 更新缓存
    setCached(cacheKey, data);

    console.log(`[FastForex] Fetched ${Object.keys(data.results).length} rates in ${data.ms}ms`);
    return data;
  } catch (error) {
    console.error('[FastForex] Failed to fetch all rates:', error);
    throw error;
  }
}

/**
 * 获取单个货币汇率
 */
export async function fetchOneForexRate(
  from: string = 'USD',
  to: string
): Promise<ForexSingleResponse> {
  const cacheKey = `forex:${from}:${to}`;

  // 检查缓存
  const cached = getCached<ForexSingleResponse>(cacheKey);
  if (cached) {
    console.log(`[FastForex] Using cached data for ${from}/${to}`);
    return cached;
  }

  try {
    console.log(`[FastForex] Fetching ${from}/${to} from API`);
    const response = await fetch(
      `${BASE_URL}/fetch-one?from=${from}&to=${to}`,
      {
        headers: {
          'X-API-Key': API_KEY,
        },
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!response.ok) {
      throw new Error(`FastForex API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // 更新缓存
    setCached(cacheKey, data);

    console.log(`[FastForex] Fetched ${from}/${to} = ${data.result[to]} in ${data.ms}ms`);
    return data;
  } catch (error) {
    console.error(`[FastForex] Failed to fetch ${from}/${to}:`, error);
    throw error;
  }
}

/**
 * 货币转换
 */
export async function convertCurrency(
  from: string,
  to: string,
  amount: number
): Promise<ConvertResponse> {
  const cacheKey = `forex:convert:${from}:${to}:${amount}`;

  // 检查缓存
  const cached = getCached<ConvertResponse>(cacheKey);
  if (cached) {
    console.log(`[FastForex] Using cached conversion for ${amount} ${from} to ${to}`);
    return cached;
  }

  try {
    console.log(`[FastForex] Converting ${amount} ${from} to ${to}`);
    const response = await fetch(
      `${BASE_URL}/convert?from=${from}&to=${to}&amount=${amount}`,
      {
        headers: {
          'X-API-Key': API_KEY,
        },
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!response.ok) {
      throw new Error(`FastForex API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // 更新缓存
    setCached(cacheKey, data);

    console.log(`[FastForex] Converted ${amount} ${from} to ${data.result[to]} ${to} in ${data.ms}ms`);
    return data;
  } catch (error) {
    console.error(`[FastForex] Failed to convert ${from} to ${to}:`, error);
    throw error;
  }
}

/**
 * 获取历史汇率数据（时间序列）
 */
export async function fetchHistoricalRates(
  from: string,
  to: string,
  startDate: string,
  endDate: string
): Promise<TimeSeriesResponse> {
  const cacheKey = `forex:history:${from}:${to}:${startDate}:${endDate}`;

  // 检查缓存
  const cached = getCached<TimeSeriesResponse>(cacheKey);
  if (cached) {
    console.log(`[FastForex] Using cached history for ${from}/${to}`);
    return cached;
  }

  try {
    console.log(`[FastForex] Fetching historical rates for ${from}/${to} from ${startDate} to ${endDate}`);
    const response = await fetch(
      `${BASE_URL}/time-series?from=${from}&to=${to}&start=${startDate}&end=${endDate}`,
      {
        headers: {
          'X-API-Key': API_KEY,
        },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!response.ok) {
      throw new Error(`FastForex API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // 更新缓存
    setCached(cacheKey, data);

    console.log(`[FastForex] Fetched ${Object.keys(data.results[to] || {}).length} historical data points in ${data.ms}ms`);
    return data;
  } catch (error) {
    console.error(`[FastForex] Failed to fetch historical rates for ${from}/${to}:`, error);
    throw error;
  }
}

/**
 * 从 FastForex 响应中解析外汇交易对数据
 */
export interface ForexPairData {
  symbol: string;
  name: string;
  price: number;
  change: number;
}

export function parseForexPairs(
  rates: Record<string, number>,
  baseCurrency: string = 'USD'
): ForexPairData[] {
  const forexPairs: ForexPairData[] = [];

  // 常见外汇交易对配置
  const forexConfigs = [
    { symbol: 'EURUSD', name: 'EUR/USD', currency: 'EUR' },
    { symbol: 'GBPUSD', name: 'GBP/USD', currency: 'GBP' },
    { symbol: 'USDJPY', name: 'USD/JPY', currency: 'JPY' },
    { symbol: 'USDCHF', name: 'USD/CHF', currency: 'CHF' },
    { symbol: 'AUDUSD', name: 'AUD/USD', currency: 'AUD' },
    { symbol: 'USDCAD', name: 'USD/CAD', currency: 'CAD' },
    { symbol: 'NZDUSD', name: 'NZD/USD', currency: 'NZD' },
    { symbol: 'USDHKD', name: 'USD/HKD', currency: 'HKD' },
    { symbol: 'EURGBP', name: 'EUR/GBP', currency: 'EUR', to: 'GBP' },
    { symbol: 'EURJPY', name: 'EUR/JPY', currency: 'EUR', to: 'JPY' },
    { symbol: 'GBPJPY', name: 'GBP/JPY', currency: 'GBP', to: 'JPY' },
    { symbol: 'AUDJPY', name: 'AUD/JPY', currency: 'AUD', to: 'JPY' },
    { symbol: 'CADJPY', name: 'CAD/JPY', currency: 'CAD', to: 'JPY' },
    { symbol: 'CHFJPY', name: 'CHF/JPY', currency: 'CHF', to: 'JPY' },
  ];

  for (const config of forexConfigs) {
    const rate = rates[config.currency];
    if (!rate) continue;

    // 计算价格
    // FastForex /fetch-all 返回的格式：{ base: "USD", results: { EUR: 0.868542, JPY: 159.33, ... } }
    // 这意味着：1 USD = 0.868542 EUR，1 USD = 159.33 JPY，1 USD = 1.413 AUD
    let price: number;
    if (config.symbol.startsWith('USD')) {
      // USD开头的交易对，直接使用 rate
      // 例如：USD/JPY，JPY = 159.33 意味着 1 USD = 159.33 JPY
      price = rate;
    } else if (config.to) {
      // 交叉盘，需要两个汇率计算
      const toRate = rates[config.to];
      if (!toRate) continue;
      // 交叉盘计算：Currency1/Currency2
      // 例如：EUR/JPY
      // EURUSD = 1/EUR = 1/0.868542 = 1.1513
      // USDJPY = JPY = 159.33
      // EURJPY = (EURUSD) * (USDJPY) = 1.1513 * 159.33 = 183.5
      price = (1 / rate) * toRate;
    } else {
      // 非 USD 开头的，需要取倒数
      // 例如：EUR/USD，EUR = 0.868542 意味着 1 USD = 0.868542 EUR
      // 所以 1 EUR = 1/0.868542 = 1.1513 USD
      price = 1 / rate;
    }

    forexPairs.push({
      symbol: config.symbol,
      name: config.name,
      price: price,
      change: 0, // 暂时没有涨跌幅数据
    });
  }

  return forexPairs;
}
