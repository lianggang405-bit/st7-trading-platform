/**
 * K线（K-Line）数据服务模块
 *
 * 功能：
 * - 获取外汇历史K线数据（FastForex）
 * - 获取加密货币历史K线数据（CoinGecko）
 * - 数据格式化
 * - 缓存机制
 */

import { fetchHistoricalRates } from './fastforex';

// K线数据类型
export interface KlineData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

// K线周期
export type KlineInterval = '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w' | '1M';

// 资产类型
export type AssetType = 'forex' | 'crypto' | 'metal';

// K线请求参数
export interface KlineRequest {
  symbol: string;      // 交易对，如 EURUSD, BTCUSDT
  interval: KlineInterval;
  limit?: number;      // 数量限制，默认 100
  startTime?: number;  // 开始时间戳
  endTime?: number;    // 结束时间戳
}

// 缓存接口
interface CacheEntry {
  data: KlineData[];
  timestamp: number;
}

// 缓存配置
const CACHE_DURATION = 60000; // 1分钟缓存
const cache = new Map<string, CacheEntry>();

/**
 * 获取缓存数据
 */
function getCached(key: string): KlineData[] | null {
  const entry = cache.get(key);
  if (!entry) return null;

  const age = Date.now() - entry.timestamp;
  if (age > CACHE_DURATION) {
    cache.delete(key);
    return null;
  }

  return entry.data;
}

/**
 * 设置缓存数据
 */
function setCached(key: string, data: KlineData[]): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

/**
 * 清除缓存
 */
export function clearKlineCache(key?: string): void {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}

/**
 * 解析交易对
 */
function parseSymbol(symbol: string): { type: AssetType; from: string; to: string } | null {
  // 外汇交易对：EURUSD, GBPUSD, USDJPY 等
  const forexPattern = /^([A-Z]{3})([A-Z]{3})$/;
  const forexMatch = symbol.match(forexPattern);
  if (forexMatch) {
    return {
      type: 'forex',
      from: forexMatch[1],
      to: forexMatch[2],
    };
  }

  // 加密货币交易对：BTCUSDT, ETHUSDT 等
  const cryptoPattern = /^([A-Z]{3,})USDT$/;
  const cryptoMatch = symbol.match(cryptoPattern);
  if (cryptoMatch) {
    return {
      type: 'crypto',
      from: cryptoMatch[1],
      to: 'USD',
    };
  }

  return null;
}

/**
 * 将时间戳转换为日期字符串
 */
function timestampToDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toISOString().split('T')[0];
}

/**
 * 将日期字符串转换为时间戳
 */
function dateToTimestamp(dateStr: string): number {
  return new Date(dateStr).getTime();
}

/**
 * 从 FastForex 历史数据转换为 K线数据
 */
function fastForexToKline(
  data: Record<string, number>,
  startDate: string,
  endDate: string
): KlineData[] {
  const klines: KlineData[] = [];

  // 按日期排序
  const dates = Object.keys(data).sort();

  for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    const price = data[date];

    klines.push({
      timestamp: dateToTimestamp(date),
      open: price,
      high: price,
      low: price,
      close: price,
    });
  }

  return klines;
}

/**
 * 从 CoinGecko 历史数据转换为 K线数据
 */
async function coinGeckoToKline(
  coinId: string,
  vsCurrency: string = 'usd',
  days: number = 30
): Promise<KlineData[]> {
  try {
    const url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=${vsCurrency}&days=${days}`;

    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    const prices = data.prices; // [[timestamp, price], ...]

    return prices.map(([timestamp, price]: [number, number]) => ({
      timestamp,
      open: price,
      high: price,
      low: price,
      close: price,
    }));
  } catch (error) {
    console.error('[KlineService] CoinGecko API failed:', error);
    throw error;
  }
}

/**
 * 获取外汇 K线数据
 */
async function fetchForexKline(request: KlineRequest): Promise<KlineData[]> {
  const parsed = parseSymbol(request.symbol);
  if (!parsed || parsed.type !== 'forex') {
    throw new Error(`Invalid forex symbol: ${request.symbol}`);
  }

  // 计算日期范围
  const endDate = new Date();
  const startDate = new Date();

  if (request.startTime) {
    startDate.setTime(request.startTime);
  } else if (request.limit) {
    startDate.setDate(endDate.getDate() - request.limit);
  } else {
    startDate.setDate(endDate.getDate() - 30); // 默认30天
  }

  if (request.endTime) {
    endDate.setTime(request.endTime);
  }

  const startDateStr = timestampToDate(startDate.getTime());
  const endDateStr = timestampToDate(endDate.getTime());

  // 调用 FastForex API
  const response = await fetchHistoricalRates(
    parsed.from,
    parsed.to,
    startDateStr,
    endDateStr
  );

  // 转换为 K线数据
  let klines = fastForexToKline(
    response.results[parsed.to],
    startDateStr,
    endDateStr
  );

  // 限制数量
  if (request.limit && klines.length > request.limit) {
    klines = klines.slice(-request.limit);
  }

  return klines;
}

/**
 * 获取加密货币 K线数据
 */
async function fetchCryptoKline(request: KlineRequest): Promise<KlineData[]> {
  const parsed = parseSymbol(request.symbol);
  if (!parsed || parsed.type !== 'crypto') {
    throw new Error(`Invalid crypto symbol: ${request.symbol}`);
  }

  // 映射交易对到 CoinGecko ID
  const coinIdMap: Record<string, string> = {
    'BTCUSDT': 'bitcoin',
    'ETHUSDT': 'ethereum',
    'LTCUSDT': 'litecoin',
    'SOLUSDT': 'solana',
    'XRPUSDT': 'ripple',
    'DOGEUSDT': 'dogecoin',
    'ADAUSDT': 'cardano',
    'DOTUSDT': 'polkadot',
  };

  const coinId = coinIdMap[request.symbol];
  if (!coinId) {
    throw new Error(`Unsupported crypto symbol: ${request.symbol}`);
  }

  // 计算天数
  let days = 30; // 默认30天
  if (request.limit) {
    days = Math.min(request.limit, 365); // 最多365天
  } else if (request.startTime) {
    const start = new Date(request.startTime);
    const now = new Date();
    days = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }

  // 调用 CoinGecko API
  const klines = await coinGeckoToKline(coinId, 'usd', days);

  // 限制数量
  if (request.limit && klines.length > request.limit) {
    return klines.slice(-request.limit);
  }

  return klines;
}

/**
 * 获取 K线数据（主函数）
 */
export async function getKlineData(request: KlineRequest): Promise<KlineData[]> {
  const cacheKey = `${request.symbol}-${request.interval}-${request.limit || 'default'}-${request.startTime || 'default'}-${request.endTime || 'default'}`;

  // 检查缓存
  const cached = getCached(cacheKey);
  if (cached) {
    console.log(`[KlineService] Using cached kline data for ${request.symbol}`);
    return cached;
  }

  try {
    console.log(`[KlineService] Fetching kline data for ${request.symbol}`);

    const parsed = parseSymbol(request.symbol);
    if (!parsed) {
      throw new Error(`Invalid symbol: ${request.symbol}`);
    }

    let klines: KlineData[];

    if (parsed.type === 'forex') {
      klines = await fetchForexKline(request);
    } else if (parsed.type === 'crypto') {
      klines = await fetchCryptoKline(request);
    } else {
      throw new Error(`Unsupported asset type: ${parsed.type}`);
    }

    // 更新缓存
    setCached(cacheKey, klines);

    console.log(`[KlineService] Fetched ${klines.length} kline data points for ${request.symbol}`);
    return klines;
  } catch (error) {
    console.error(`[KlineService] Failed to fetch kline data for ${request.symbol}:`, error);
    throw error;
  }
}

/**
 * 批量获取 K线数据
 */
export async function getMultipleKlineData(requests: KlineRequest[]): Promise<Record<string, KlineData[]>> {
  const results: Record<string, KlineData[]> = {};

  // 并行获取
  const promises = requests.map(async (request) => {
    try {
      const klines = await getKlineData(request);
      results[request.symbol] = klines;
    } catch (error) {
      console.error(`[KlineService] Failed to fetch kline data for ${request.symbol}:`, error);
      results[request.symbol] = [];
    }
  });

  await Promise.all(promises);

  return results;
}
