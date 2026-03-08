import { NextRequest, NextResponse } from 'next/server';
import { getKlines } from '@/lib/market-klines';

/**
 * GET /api/klines
 * 行情聚合API - 自动选择数据源并返回统一K线数据
 *
 * Query参数：
 * - symbol: 交易对（如 XAUUSD, BTCUSD, EURUSD）
 * - interval: 时间周期（如 1M, 5M, 15M, 1H）
 * - limit: K线数量（默认80，最大1000）
 *
 * 返回统一格式的K线数据：
 * [
 *   {
 *     time: 1772999460,
 *     open: 2850.5,
 *     high: 2852.0,
 *     low: 2848.0,
 *     close: 2851.5,
 *     volume: 1234.5
 *   },
 *   ...
 * ]
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol');
    const interval = searchParams.get('interval');
    const limit = parseInt(searchParams.get('limit') || '80', 10);

    // 验证参数
    if (!symbol || !interval) {
      return NextResponse.json(
        { error: '缺少必要参数：symbol 和 interval' },
        { status: 400 }
      );
    }

    if (limit < 1 || limit > 1000) {
      return NextResponse.json(
        { error: 'limit 参数必须在 1-1000 之间' },
        { status: 400 }
      );
    }

    console.log(`[Klines API] 请求: symbol=${symbol}, interval=${interval}, limit=${limit}`);

    // 获取K线数据（自动选择数据源）
    const klines = await getKlines(symbol, interval, limit);

    console.log(`[Klines API] 成功返回 ${klines.length} 条K线数据`);

    // 返回数据
    return NextResponse.json({
      success: true,
      symbol,
      interval,
      data: klines,
    });
  } catch (error) {
    console.error('[Klines API] 错误:', error);

    return NextResponse.json(
      {
        error: '获取K线数据失败',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
