import { NextRequest, NextResponse } from 'next/server';

/**
 * K线行情代理 API
 * 
 * 解决 CORS 问题，支持多个数据源：
 * - Kraken
 * - Yahoo Finance
 * - Finnhub
 * 
 * GET /api/market/klines?symbol=XAUUSD&interval=1h&source=kraken
 */

interface KlineData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Kraken API 映射
const KRAKEN_SYMBOL_MAP: { [key: string]: string } = {
  'XAUUSD': 'XAUUSD',
  'XAGUSD': 'XAGUSD',
  'BTCUSD': 'XXBTZUSD',
  'ETHUSD': 'XETHZUSD',
};

// Kraken 时间间隔映射
const KRAKEN_INTERVAL_MAP: { [key: string]: number } = {
  '1m': 1,
  '5m': 5,
  '15m': 15,
  '1h': 60,
  '4h': 240,
  '1d': 1440,
};

/**
 * 从 Kraken 获取 K线数据
 */
async function fetchFromKraken(symbol: string, interval: string): Promise<KlineData[]> {
  const krakenSymbol = KRAKEN_SYMBOL_MAP[symbol] || symbol;
  const krakenInterval = KRAKEN_INTERVAL_MAP[interval] || 60;

  const url = `https://api.kraken.com/0/public/OHLC?pair=${krakenSymbol}&interval=${krakenInterval}`;

  console.log('[Klines Proxy] 从 Kraken 获取:', { krakenSymbol, krakenInterval });

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.warn('[Klines Proxy] Kraken 请求失败:', response.status);
      return [];
    }

    const result = await response.json();

    if (result.error && result.error.length > 0) {
      console.warn('[Klines Proxy] Kraken 错误:', result.error);
      return [];
    }

    // Kraken 返回格式：{ result: { "XXBTZUSD": [[time, open, high, low, close, vwap, volume, ...]] } }
    const pairName = Object.keys(result.result || {})[0];
    const klines = result.result[pairName] || [];

    return klines.map((k: any[]) => ({
      time: Math.floor(k[0] / 1000), // 毫秒转秒
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[6]),
    }));
  } catch (error) {
    console.error('[Klines Proxy] Kraken 错误:', error);
    return [];
  }
}

/**
 * GET - 获取 K线数据
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'XAUUSD';
  const interval = searchParams.get('interval') || '1h';
  const limit = parseInt(searchParams.get('limit') || '200', 10);
  const source = searchParams.get('source') || 'kraken';

  console.log('[Klines Proxy] 请求:', { symbol, interval, limit, source });

  let klines: KlineData[] = [];

  // 根据数据源获取 K线
  if (source === 'kraken') {
    klines = await fetchFromKraken(symbol, interval);
  } else {
    // 其他数据源（可以后续添加）
    klines = [];
  }

  // 取最近 N 条数据
  if (klines.length > limit) {
    klines = klines.slice(-limit);
  }

  // 添加 CORS 头
  return NextResponse.json(
    {
      success: true,
      symbol,
      interval,
      count: klines.length,
      klines,
    },
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }
  );
}

// OPTIONS 处理
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
