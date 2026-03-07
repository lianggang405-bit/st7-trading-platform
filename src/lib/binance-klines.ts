/**
 * Binance K线数据获取工具
 * 从Binance API获取真实的历史K线数据
 */

// Binance API 基础URL
const BINANCE_API_URL = 'https://api.binance.com';

// K线数据接口
interface BinanceKlineResponse {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closeTime: number;
  quoteVolume: number;
  trades: number;
  takerBuyBase: number;
  takerBuyQuote: number;
  ignore: number;
}

/**
 * 将Binance交易对转换为API格式
 * BTCUSD -> BTCUSDT
 */
function convertSymbol(symbol: string): string {
  return symbol.replace('USD', 'USDT');
}

/**
 * 将时间周期转换为Binance格式
 * 1M -> 1m
 * 5M -> 5m
 * 15M -> 15m
 * 1H -> 1h
 */
function convertInterval(interval: string): string {
  return interval.toLowerCase();
}

/**
 * 从Binance API获取历史K线数据
 * @param symbol 交易对（如 BTCUSD）
 * @param interval 时间周期（如 1M, 5M, 15M, 1H）
 * @param limit K线数量（默认80，最大1000）
 * @returns K线数据数组
 */
export async function fetchBinanceKlines(
  symbol: string,
  interval: string,
  limit: number = 80
): Promise<BinanceKlineResponse[]> {
  try {
    const binanceSymbol = convertSymbol(symbol);
    const binanceInterval = convertInterval(interval);

    const url = `${BINANCE_API_URL}/api/v3/klines?symbol=${binanceSymbol}&interval=${binanceInterval}&limit=${limit}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }

    const data = await response.json();

    // 转换Binance格式为我们的格式
    return data.map((k: any[]) => ({
      time: k[0] / 1000, // 转换为秒
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5]),
      closeTime: k[6] / 1000,
      quoteVolume: parseFloat(k[7]),
      trades: k[8],
      takerBuyBase: parseFloat(k[9]),
      takerBuyQuote: parseFloat(k[10]),
      ignore: k[11],
    }));
  } catch (error) {
    console.error('[BinanceKlines] 获取K线数据失败:', error);
    throw error;
  }
}

/**
 * K线缓存
 * 避免频繁请求API
 */
interface KlineCache {
  [key: string]: {
    data: BinanceKlineResponse[];
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
): Promise<BinanceKlineResponse[]> {
  const cacheKey = `${symbol}_${interval}_${limit}`;
  const cached = klineCache[cacheKey];

  // 检查缓存是否有效
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('[BinanceKlines] 使用缓存数据');
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
    console.log('[BinanceKlines] 清除所有缓存');
  } else {
    const prefix = `${symbol}_${interval || ''}`;
    Object.keys(klineCache).forEach(key => {
      if (key.startsWith(prefix)) {
        delete klineCache[key];
      }
    });
    console.log(`[BinanceKlines] 清除缓存: ${prefix}`);
  }
}
