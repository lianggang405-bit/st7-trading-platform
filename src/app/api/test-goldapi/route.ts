import { NextResponse } from 'next/server';
import { getRealPreciousMetalPrice, fetchGoldAPIKlines } from '@/lib/real-precious-metals';

/**
 * 测试 GoldAPI 连接
 * GET /api/test-goldapi?symbol=XAUUSD
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'XAUUSD';

  try {
    // 测试获取当前价格
    const priceData = await getRealPreciousMetalPrice(symbol);

    // 测试获取K线数据
    const klines = await fetchGoldAPIKlines(symbol, '1h', 10);

    return NextResponse.json({
      success: true,
      symbol,
      price: priceData?.price || null,
      timestamp: priceData?.timestamp || null,
      klinesCount: klines.length,
      sampleKline: klines[0] || null
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
