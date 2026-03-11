import { NextRequest, NextResponse } from 'next/server';

/**
 * K线行情代理 API
 *
 * 解决 CORS 问题，支持多个数据源：
 * - Kraken
 * - Yahoo Finance
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

// Yahoo Finance 时间间隔映射
const YAHOO_INTERVAL_MAP: { [key: string]: string } = {
  '1m': '1m',
  '5m': '5m',
  '15m': '15m',
  '1h': '1h',
  '4h': '1d',
  '1d': '1d',
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
 * 从 Yahoo Finance 获取 K线数据
 */
async function fetchFromYahoo(symbol: string, interval: string, limit: number): Promise<KlineData[]> {
  // 转换交易对格式为 Yahoo Finance 格式
  let yahooSymbol = symbol;

  // Forex: EURUSD -> EURUSD=X
  if (!symbol.includes('=')) {
    yahooSymbol = `${symbol}=X`;
  }

  // 转换时间周期为 Yahoo Finance 格式
  const intervalYahoo = YAHOO_INTERVAL_MAP[interval] || '1h';

  // 计算时间范围
  const intervalSeconds = {
    '1m': 60,
    '5m': 300,
    '15m': 900,
    '1h': 3600,
    '4h': 14400,
    '1d': 86400,
  }[interval] || 3600;

  const to = Math.floor(Date.now() / 1000);
  const from = to - (intervalSeconds * limit);

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=${intervalYahoo}&period1=${from}&period2=${to}`;

  console.log('[Klines Proxy] 从 Yahoo Finance 获取:', { yahooSymbol, intervalYahoo, from, to });

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.warn('[Klines Proxy] Yahoo Finance 请求失败:', response.status);
      return [];
    }

    const data = await response.json();

    if (!data.chart?.result?.[0]?.timestamp) {
      console.warn('[Klines Proxy] Yahoo Finance 无有效数据');
      return [];
    }

    const result = data.chart.result[0];
    const timestamps = result.timestamp;
    const indicators = result.indicators;
    const quote = indicators.quote?.[0] || {};

    const klines: KlineData[] = [];

    for (let i = 0; i < timestamps.length; i++) {
      const open = quote.open?.[i];
      const high = quote.high?.[i];
      const low = quote.low?.[i];
      const close = quote.close?.[i];
      const volume = quote.volume?.[i] || 0;

      if (open !== null && high !== null && low !== null && close !== null) {
        klines.push({
          time: timestamps[i],
          open: Number(open),
          high: Math.max(Number(high), Number(open), Number(close)),
          low: Math.min(Number(low), Number(open), Number(close)),
          close: Number(close),
          volume: Number(volume),
        });
      }
    }

    console.log(`[Klines Proxy] Yahoo Finance 获取到 ${klines.length} 条数据`);
    return klines;
  } catch (error) {
    console.error('[Klines Proxy] Yahoo Finance 错误:', error);
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
  const source = searchParams.get('source') || 'auto';

  console.log('[Klines Proxy] 请求:', { symbol, interval, limit, source });

  let klines: KlineData[] = [];

  // 根据数据源获取 K线
  if (source === 'kraken') {
    klines = await fetchFromKraken(symbol, interval);
  } else if (source === 'yahoo') {
    klines = await fetchFromYahoo(symbol, interval, limit);
  } else if (source === 'auto') {
    // 自动选择：优先 Yahoo Finance（外汇），失败则尝试 Kraken
    klines = await fetchFromYahoo(symbol, interval, limit);
    if (klines.length === 0) {
      klines = await fetchFromKraken(symbol, interval);
    }
  } else {
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
