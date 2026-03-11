import { NextResponse } from 'next/server'
import { getBasePrice } from '@/lib/kline-data-source'

/**
 * 测试基准价格获取
 * GET /api/test-base-price?symbol=XAUUSD
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol') || 'XAUUSD'

  try {
    console.log(`[Test Base Price] 测试获取 ${symbol} 基准价格...`)

    const basePrice = await getBasePrice(symbol)

    console.log(`[Test Base Price] 结果: ${basePrice}`)

    return NextResponse.json({
      success: true,
      symbol,
      basePrice,
      description: `用于生成模拟数据的基准价格`
    })
  } catch (error) {
    console.error('[Test Base Price] 错误:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
