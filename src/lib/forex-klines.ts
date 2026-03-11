/**
 * 外汇K线数据获取
 * 数据源：Twelve Data API
 * 降级方案：使用模拟数据
 */

import { UnifiedKline } from './symbol-map';

// Twelve Data API Key
const API_KEY = '8a33d2d6b0af4c8f8daea220399ee3fb';
const TWELVE_DATA_API_URL = 'https://api.twelvedata.com/time_series';

/**
 * 从 Twelve Data API 获取外汇K线数据
 */
async function getForexKlinesFromAPI(
  symbol: string,
  interval: string,
  limit: number
): Promise<UnifiedKline[]> {
  // 转换交易对格式为 Twelve Data API 格式
  // Twelve Data 格式：BASE/QUOTE，例如 EUR/USD, USD/JPY
  let twelveDataSymbol: string;

  if (symbol.startsWith('USD')) {
    // USD 开头：USDJPY -> USD/JPY
    twelveDataSymbol = `USD/${symbol.substring(3)}`;
  } else if (symbol.endsWith('USD')) {
    // USD 结尾：EURUSD -> EUR/USD
    twelveDataSymbol = `${symbol.substring(0, 3)}/USD`;
  } else {
    // 其他情况：直接返回（可能不是 USD 相关的交易对）
    twelveDataSymbol = symbol;
  }

  // 转换时间周期
  const twelveDataInterval = interval === '1m' ? '1min' :
                             interval === '5m' ? '5min' :
                             interval === '15M' ? '15min' :
                             interval === '1H' ? '1h' :
                             interval === '1D' ? '1day' : interval;

  const url = `${TWELVE_DATA_API_URL}?symbol=${twelveDataSymbol}&interval=${twelveDataInterval}&outputsize=${limit}&apikey=${API_KEY}`;

  console.log(`[ForexKlines] 请求 Twelve Data: ${url}`);

  const response = await fetch(url, {
    signal: AbortSignal.timeout(10000), // 10秒超时
  });

  if (!response.ok) {
    throw new Error(`Twelve Data API error: ${response.status}`);
  }

  const data = await response.json();

  if (data.status === 'error') {
    throw new Error(`Twelve Data API error: ${data.message}`);
  }

  // 转换为统一格式
  return data.values.map((k: any) => ({
    time: Math.floor(new Date(k.datetime).getTime() / 1000), // 转换为秒
    open: parseFloat(k.open),
    high: parseFloat(k.high),
    low: parseFloat(k.low),
    close: parseFloat(k.close),
    volume: parseFloat(k.volume) || 0,
  }));
}

/**
 * 生成外汇模拟K线数据
 */
function generateForexMockKlines(
  symbol: string,
  basePrice: number,
  count: number
): UnifiedKline[] {
  const now = Date.now();
  const intervalMs = 60 * 1000; // 1分钟

  const klines: UnifiedKline[] = [];
  let price = basePrice;

  // 根据交易对设置波动率
  let volatility = 0.001; // 默认 0.1%
  if (symbol.includes('JPY')) {
    volatility = 0.0015; // JPY 对波动率稍大
  }

  // 价格精度
  const precision = symbol.includes('JPY') ? 3 : 5;

  for (let i = count - 1; i >= 0; i--) {
    const time = Math.floor((now - i * intervalMs) / 1000);

    // 生成随机波动
    const change = (Math.random() - 0.5) * 2 * volatility * price;

    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * volatility * price * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * price * 0.5;

    klines.push({
      time,
      open: Number(open.toFixed(precision)),
      high: Number(high.toFixed(precision)),
      low: Number(low.toFixed(precision)),
      close: Number(close.toFixed(precision)),
      volume: Math.random() * 10000,
    });

    price = close;
  }

  return klines;
}

/**
 * 获取基础价格
 */
function getBasePrice(symbol: string): number {
  const priceMap: Record<string, number> = {
    'EURUSD': 1.08,
    'GBPUSD': 1.26,
    'USDJPY': 149.5,
    'USDCHF': 0.88,
    'EURAUD': 1.65,
    'EURGBP': 0.86,
    'EURJPY': 161.5,
    'GBPAUD': 1.92,
    'GBPNZD': 2.13,
    'GBPJPY': 188.5,
    'AUDUSD': 0.65,
    'AUDJPY': 97.5,
    'NZDUSD': 0.60,
    'NZDJPY': 90.0,
    'CADJPY': 110.0,
    'CHFJPY': 169.5,
  };

  return priceMap[symbol] || 1.0;
}

/**
 * 获取外汇K线数据（带降级）
 */
export async function getForexKlines(
  symbol: string,
  interval: string,
  limit: number = 80
): Promise<UnifiedKline[]> {
  console.log(`[ForexKlines] 获取 ${symbol} K线数据，interval=${interval}, limit=${limit}`);

  try {
    // 尝试从 API 获取数据
    const data = await getForexKlinesFromAPI(symbol, interval, limit);
    console.log(`[ForexKlines] 从 API 获取 ${data.length} 条K线`);
    return data;
  } catch (error) {
    console.warn('[ForexKlines] API 失败，返回空数组:', error);
    // ❌ 金融系统不应该自动生成模拟行情
    // 返回空数组，让前端显示"数据加载失败"
    return [];
  }
}
