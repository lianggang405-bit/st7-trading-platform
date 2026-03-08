/**
 * 外汇、能源、指数K线数据获取
 * 数据源：OANDA API（需要 API Key）
 * 降级方案：使用模拟数据
 */

import { UnifiedKline } from './symbol-map';

/**
 * 生成模拟K线数据（通用）
 */
export function generateMockKlines(
  symbol: string,
  basePrice: number,
  count: number,
  intervalMs: number = 60 * 1000
): UnifiedKline[] {
  const now = Date.now();

  const klines: UnifiedKline[] = [];
  let price = basePrice;

  // 根据交易对类型设置波动率
  let volatility = 0.001; // 默认 0.1%

  if (symbol.includes('JPY')) {
    volatility = 0.0015; // JPY 对波动率稍大
  } else if (symbol.startsWith('XAU') || symbol.startsWith('XAG')) {
    volatility = 0.002; // 贵金属波动率更大
  } else if (symbol.includes('OIL') || symbol === 'NGAS') {
    volatility = 0.003; // 能源波动率最大
  }

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
      open: Number(open.toFixed(getPricePrecision(symbol))),
      high: Number(high.toFixed(getPricePrecision(symbol))),
      low: Number(low.toFixed(getPricePrecision(symbol))),
      close: Number(close.toFixed(getPricePrecision(symbol))),
      volume: Math.random() * 10000,
    });

    price = close;
  }

  return klines;
}

/**
 * 获取价格精度
 */
function getPricePrecision(symbol: string): number {
  if (symbol.includes('JPY')) return 3;
  if (['XAU', 'XAG', 'US500', 'ND25', 'AUS200'].some(s => symbol.includes(s))) return 2;
  if (['BTC', 'ETH', 'LTC', 'SOL', 'XRP', 'DOGE'].some(s => symbol.includes(s))) return 2;
  return 5;
}

/**
 * 获取基础价格
 */
function getBasePrice(symbol: string): number {
  const priceMap: Record<string, number> = {
    // 外汇
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

    // 能源
    'UKOIL': 80.0,
    'USOIL': 75.0,
    'NGAS': 2.5,

    // 指数
    'US500': 5100.0,
    'ND25': 18500.0,
    'AUS200': 7800.0,
  };

  return priceMap[symbol] || 100.0;
}

/**
 * 获取外汇K线数据
 */
export async function getForexKlines(
  symbol: string,
  interval: string,
  limit: number = 80
): Promise<UnifiedKline[]> {
  console.log(`[ForexKlines] 获取 ${symbol} K线数据`);

  const basePrice = getBasePrice(symbol);
  const mockData = generateMockKlines(symbol, basePrice, limit);

  console.log(`[ForexKlines] 生成 ${mockData.length} 条模拟K线`);
  return mockData;
}

/**
 * 获取能源K线数据
 */
export async function getEnergyKlines(
  symbol: string,
  interval: string,
  limit: number = 80
): Promise<UnifiedKline[]> {
  console.log(`[EnergyKlines] 获取 ${symbol} K线数据`);

  const basePrice = getBasePrice(symbol);
  const mockData = generateMockKlines(symbol, basePrice, limit);

  console.log(`[EnergyKlines] 生成 ${mockData.length} 条模拟K线`);
  return mockData;
}

/**
 * 获取指数K线数据
 */
export async function getCfdKlines(
  symbol: string,
  interval: string,
  limit: number = 80
): Promise<UnifiedKline[]> {
  console.log(`[CfdKlines] 获取 ${symbol} K线数据`);

  const basePrice = getBasePrice(symbol);
  const mockData = generateMockKlines(symbol, basePrice, limit);

  console.log(`[CfdKlines] 生成 ${mockData.length} 条模拟K线`);
  return mockData;
}
