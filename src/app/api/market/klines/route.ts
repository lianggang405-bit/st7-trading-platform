import { NextRequest, NextResponse } from 'next/server';
import { generateForexKlines } from '@/lib/forex-klines-local';

/**
 * K线行情代理 API
 *
 * 解决 CORS 问题，支持多个数据源：
 * - Kraken（暂不可用）
 * - Yahoo Finance（暂不可用）
 * - 本地生成数据（当前默认）
 *
 * GET /api/market/klines?symbol=XAUUSD&interval=1h&source=local
 */

interface KlineData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * GET - 获取 K线数据
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'XAUUSD';
  const interval = searchParams.get('interval') || '1h';
  const limit = parseInt(searchParams.get('limit') || '200', 10);
  const source = searchParams.get('source') || 'local';

  console.log('[Klines Proxy] 请求:', { symbol, interval, limit, source });

  let klines: KlineData[] = [];

  // 使用本地生成数据
  if (source === 'local' || source === 'auto') {
    klines = generateForexKlines(symbol, interval, limit);
  } else {
    klines = generateForexKlines(symbol, interval, limit);
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
      source: 'local',
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
