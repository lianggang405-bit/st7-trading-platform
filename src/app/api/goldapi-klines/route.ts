import { NextResponse } from 'next/server'
import { fetchGoldAPIKlines } from '@/lib/real-precious-metals'

/**
 * 服务端代理 GoldAPI K线数据
 * GET /api/goldapi-klines?symbol=XAUUSD&interval=1h&limit=200
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol') || 'XAUUSD'
  const interval = searchParams.get('interval') || '1h'
  const limit = parseInt(searchParams.get('limit') || '200', 10)

  try {
    console.log(`[GoldAPI Proxy] 获取 ${symbol} ${interval} K线数据（${limit}条）...`)

    // 在服务端调用 GoldAPI
    const klines = await fetchGoldAPIKlines(symbol, interval, limit)

    console.log(`[GoldAPI Proxy] 获取到 ${klines.length} 条K线数据`)

    return NextResponse.json({
      success: true,
      symbol,
      interval,
      count: klines.length,
      klines
    })
  } catch (error) {
    console.error('[GoldAPI Proxy] 错误:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
