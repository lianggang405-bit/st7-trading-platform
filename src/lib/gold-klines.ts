/**
 * 黄金K线数据获取
 * 数据源：Twelve Data API（需要 API Key）
 * 降级方案：使用模拟数据
 */

import { UnifiedKline } from './symbol-map';

/**
 * 从 Twelve Data API 获取黄金K线数据
 */
async function getGoldKlinesFromAPI(
  symbol: string,
  interval: string,
  limit: number
): Promise<UnifiedKline[]> {
  // Twelve Data API（使用真实 API key）
  const API_KEY = '8a33d2d6b0af4c8f8daea220399ee3fb';
  const TWELVE_DATA_API_URL = 'https://api.twelvedata.com/time_series';

  // 转换交易对格式：XAUUSD -> XAU/USD
  const twelveDataSymbol = symbol.replace('USD', '/USD');

  // 转换时间周期
  const twelveDataInterval = interval === '1m' ? '1min' :
                             interval === '5m' ? '5min' :
                             interval === '15M' ? '15min' :
                             interval === '1H' ? '1h' :
                             interval === '1D' ? '1day' : interval;

  const url = `${TWELVE_DATA_API_URL}?symbol=${twelveDataSymbol}&interval=${twelveDataInterval}&outputsize=${limit}&apikey=${API_KEY}`;

  console.log(`[GoldKlines] 请求 Twelve Data: ${url}`);

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
 * 生成黄金模拟K线数据
 */
function generateGoldMockKlines(
  symbol: string,
  basePrice: number,
  count: number
): UnifiedKline[] {
  const now = Date.now();
  const intervalMs = 60 * 1000; // 1分钟

  const klines: UnifiedKline[] = [];
  let price = basePrice;

  for (let i = count - 1; i >= 0; i--) {
    const time = Math.floor((now - i * intervalMs) / 1000);

    // 生成随机波动（0.1% - 0.3%）
    const volatility = 0.001 + Math.random() * 0.002;
    const change = (Math.random() - 0.5) * 2 * volatility * price;

    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * volatility * price * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * price * 0.5;

    klines.push({
      time,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume: Math.random() * 10000,
    });

    price = close;
  }

  return klines;
}

/**
 * 获取黄金K线数据（带降级）
 */
export async function getGoldKlines(
  symbol: string,
  interval: string,
  limit: number = 80
): Promise<UnifiedKline[]> {
  console.log(`[GoldKlines] 获取 ${symbol} K线数据，interval=${interval}, limit=${limit}`);

  // 基础价格（根据交易对）
  const basePrice = symbol === 'XAUUSD' ? 2850 : symbol === 'XAGUSD' ? 32 : 2000;

  try {
    // 尝试从 API 获取数据
    const data = await getGoldKlinesFromAPI(symbol, interval, limit);
    console.log(`[GoldKlines] 从 API 获取 ${data.length} 条K线`);
    return data;
  } catch (error) {
    console.warn('[GoldKlines] API 失败，使用模拟数据:', error);
    // 降级到模拟数据
    const mockData = generateGoldMockKlines(symbol, basePrice, limit);
    console.log(`[GoldKlines] 生成 ${mockData.length} 条模拟K线`);
    return mockData;
  }
}
