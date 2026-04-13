/**
 * 获取当前基准价
 * 用于客户端同步真实价格
 */

import { NextResponse } from 'next/server'
import { getMarket } from '@/lib/marketEngine'

export async function GET() {
  try {
    const market = getMarket()
    const basePrices: Record<string, number> = {}

    Object.values(market).forEach((s) => {
      basePrices[s.symbol] = s.basePrice
    })

    return NextResponse.json({
      success: true,
      basePrices,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('[API] base-prices error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch base prices' },
      { status: 500 }
    )
  }
}
