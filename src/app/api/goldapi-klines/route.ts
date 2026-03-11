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

    // 如果获取到数据，返回成功
    return NextResponse.json({
      success: true,
      symbol,
      interval,
      count: klines.length,
      klines
    })
  } catch (error) {
    // 即使发生错误也返回成功，但 klines 为空
    // 这样调用方可以根据 klines.length === 0 判断是否需要降级
    console.error('[GoldAPI Proxy] 请求失败（将降级到模拟数据）:', error)

    return NextResponse.json({
      success: true,  // 返回 true，但 klines 为空
      symbol,
      interval,
      count: 0,
      klines: [],
      fallback: 'simulated'  // 标记需要降级
    })
  }
}
