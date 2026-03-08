/**
 * Binance K线数据获取
 * 数据源：Binance 公共 API
 */

import { getBinanceSymbol, UnifiedKline } from './symbol-map';

// 使用 Binance 公共数据 API（最稳定）
const BINANCE_API_URL = 'https://data-api.binance.vision';

/**
 * 从 Binance API 获取K线数据
 */
export async function getBinanceKlines(
  symbol: string,
  interval: string,
  limit: number = 80
): Promise<UnifiedKline[]> {
  // 转换为 Binance 交易对格式
  const apiSymbol = getBinanceSymbol(symbol);

  // 构造 URL
  const url = `${BINANCE_API_URL}/api/v3/klines?symbol=${apiSymbol}&interval=${interval}&limit=${limit}`;

  console.log(`[BinanceSource] 请求: ${url}`);

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
    signal: AbortSignal.timeout(10000), // 10秒超时
  });

  if (!response.ok) {
    const errorText = await response.text();

    // 400 错误：交易对不存在
    if (response.status === 400) {
      if (errorText.includes('Invalid symbol')) {
        throw new Error(`交易对 ${symbol} 在 Binance 上不存在`);
      }
      throw new Error(`Binance API 参数错误: ${errorText}`);
    }

    throw new Error(`Binance API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  // 转换为统一格式
  const klines = data.map((k: any[]) => ({
    time: k[0] / 1000, // 转换为秒
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4]),
    volume: parseFloat(k[5]),
  }));

  console.log(`[BinanceSource] 成功获取 ${klines.length} 条K线`);

  return klines;
}
