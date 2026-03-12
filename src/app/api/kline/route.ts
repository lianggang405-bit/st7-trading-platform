/**
 * K线数据 API
 *
 * 端点：/api/kline
 *
 * 参数：
 * - symbol: 交易对（必需），如 EURUSD, BTCUSDT
 * - interval: K线周期（可选），默认 1d
 * - limit: 数量限制（可选），默认 100
 * - startTime: 开始时间戳（可选）
 * - endTime: 结束时间戳（可选）
 */

import { NextRequest, NextResponse } from 'next/server';
import { getKlineData } from '@/lib/services/kline';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const symbol = searchParams.get('symbol');
    const interval = (searchParams.get('interval') || '1d') as '1d' | '1w' | '1M';
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const startTime = searchParams.get('startTime') ? parseInt(searchParams.get('startTime')!) : undefined;
    const endTime = searchParams.get('endTime') ? parseInt(searchParams.get('endTime')!) : undefined;

    // 验证参数
    if (!symbol) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameter: symbol' },
        { status: 400 }
      );
    }

    if (limit && (limit < 1 || limit > 1000)) {
      return NextResponse.json(
        { success: false, error: 'Invalid limit: must be between 1 and 1000' },
        { status: 400 }
      );
    }

    // 获取 K线数据
    const klineData = await getKlineData({
      symbol,
      interval,
      limit,
      startTime,
      endTime,
    });

    return NextResponse.json({
      success: true,
      symbol,
      interval,
      data: klineData,
    });
  } catch (error) {
    console.error('[Kline API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch kline data',
      },
      { status: 500 }
    );
  }
}
