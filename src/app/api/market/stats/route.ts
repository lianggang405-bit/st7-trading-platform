/**
 * 行情数据源监控指标
 * 用于运维监控实时数据源健康状态
 */

import { NextResponse } from 'next/server'
import { getMarket, getMarketStats, updaterStarted } from '@/lib/marketEngine'

export async function GET() {
  try {
    const market = getMarket()
    const stats = getMarketStats()

    // 构建详细状态
    const symbols: Record<string, {
      basePrice: number
      currentPrice: number
      deviation: number
      updateInterval: string
      lastUpdate: string
      dataSource: 'real' | 'simulated'
    }> = {}

    Object.values(market).forEach((s) => {
      const deviation = ((s.price - s.basePrice) / s.basePrice) * 100
      const intervalMs = s.updateInterval
      const intervalStr = intervalMs < 60000 
        ? `${intervalMs / 1000}s` 
        : `${intervalMs / 60000}min`

      symbols[s.symbol] = {
        basePrice: s.basePrice,
        currentPrice: s.price,
        deviation: Number(deviation.toFixed(4)),
        updateInterval: intervalStr,
        lastUpdate: s.lastBaseUpdate > 0 
          ? new Date(s.lastBaseUpdate).toISOString() 
          : 'never',
        dataSource: s.lastBaseUpdate > 0 ? 'real' : 'simulated',
      }
    })

    return NextResponse.json({
      success: true,
      timestamp: Date.now(),
      updaterStarted,
      summary: {
        totalSymbols: Object.keys(symbols).length,
        realSourceCount: stats.realSourceCount,
        simulatedCount: stats.simulatedCount,
        lowVolCount: stats.lowVolCount,
        realSourcePercent: stats.realSourcePercent,
      },
      missCount: stats.missCount,
      symbols,
    })
  } catch (error) {
    console.error('[API] market-stats error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch market stats' },
      { status: 500 }
    )
  }
}
