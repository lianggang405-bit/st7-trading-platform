import { NextResponse } from 'next/server'
import { getRealPreciousMetalPrice, fetchGoldAPIKlines } from '@/lib/real-precious-metals'

/**
 * 服务端测试贵金属数据 API
 * GET /api/real-precious-metals?symbol=XAUUSD
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol') || 'XAUUSD'

  try {
    console.log(`[RealPreciousMetals API] 测试获取 ${symbol} 数据...`)

    // 测试 1: 获取当前价格
    const priceData = await getRealPreciousMetalPrice(symbol)

    // 测试 2: 获取K线数据
    const klines = await fetchGoldAPIKlines(symbol, '1h', 10)

    console.log(`[RealPreciousMetals API] 结果:`)
    console.log(`- 价格: ${priceData?.price || null}`)
    console.log(`- K线数量: ${klines.length}`)

    return NextResponse.json({
      success: true,
      symbol,
      price: priceData?.price || null,
      priceTimestamp: priceData?.timestamp || null,
      klinesCount: klines.length,
      firstKline: klines[0] || null,
      lastKline: klines[klines.length - 1] || null
    })
  } catch (error) {
    console.error('[RealPreciousMetals API] 错误:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
