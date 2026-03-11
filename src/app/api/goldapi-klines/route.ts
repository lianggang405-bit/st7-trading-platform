import { NextResponse } from 'next/server'
import { fetchGoldAPIKlines } from '@/lib/real-precious-metals'
import { generatePreciousMetalKlines } from '@/lib/gold-klines-local'

/**
 * 服务端代理黄金K线数据
 * GET /api/goldapi-klines?symbol=XAUUSD&interval=1h&limit=200
 *
 * 数据源优先级：
 * 1. GoldAPI（如果 API key 可用）
 * 2. 本地生成数据（基于实时价格）
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol') || 'XAUUSD'
  const interval = searchParams.get('interval') || '1h'
  const limit = parseInt(searchParams.get('limit') || '200', 10)

  console.log(`[GoldAPI Proxy] 获取 ${symbol} ${interval} K线数据（${limit}条）...`)

  try {
    // 尝试从 GoldAPI 获取数据
    const klines = await fetchGoldAPIKlines(symbol, interval, limit)

    if (klines.length > 0) {
      console.log(`[GoldAPI Proxy] 从 GoldAPI 获取到 ${klines.length} 条K线数据`)
      return NextResponse.json({
        success: true,
        symbol,
        interval,
        count: klines.length,
        klines,
        source: 'goldapi'
      })
    }
  } catch (error) {
    console.log('[GoldAPI Proxy] GoldAPI 调用失败，使用本地数据:', error)
  }

  // 如果 GoldAPI 失败，使用本地生成的数据（基于实时价格）
  console.log(`[GoldAPI Proxy] 使用本地生成的数据（基于实时价格）`)
  const localKlines = await generatePreciousMetalKlines(symbol, interval, limit)

  return NextResponse.json({
    success: true,
    symbol,
    interval,
    count: localKlines.length,
    klines: localKlines,
    source: 'local'
  })
}
