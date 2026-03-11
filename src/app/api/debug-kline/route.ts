import { NextResponse } from 'next/server'
import { fetchKlines } from '@/lib/kline-data-source'

/**
 * 调试K线数据API
 * GET /api/debug-kline?symbol=XAUUSD
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol') || 'XAUUSD'

  try {
    console.log(`[Debug Kline] 测试获取 ${symbol} K线数据...`)

    // 强制刷新，避免缓存
    const klines = await fetchKlines(symbol, '1h', 10, true)

    console.log(`[Debug Kline] 获取到 ${klines.length} 条K线数据`)

    if (klines.length > 0) {
      const first = klines[0]
      const last = klines[klines.length - 1]

      // 检查数据有效性
      const issues: string[] = []

      klines.forEach((k, i) => {
        if (k.high < Math.max(k.open, k.close)) {
          issues.push(`第${i+1}条K线: high(${k.high}) < max(open,close)(${Math.max(k.open, k.close)})`)
        }
        if (k.low > Math.min(k.open, k.close)) {
          issues.push(`第${i+1}条K线: low(${k.low}) > min(open,close)(${Math.min(k.open, k.close)})`)
        }
        if (k.open < 0 || k.close < 0 || k.high < 0 || k.low < 0) {
          issues.push(`第${i+1}条K线: 价格为负数`)
        }
        if (k.open === 0 || k.close === 0) {
          issues.push(`第${i+1}条K线: 价格为零`)
        }
      })

      // 计算价格范围
      const allPrices = klines.flatMap(k => [k.open, k.close, k.high, k.low])
      const minPrice = Math.min(...allPrices)
      const maxPrice = Math.max(...allPrices)
      const priceRange = maxPrice - minPrice
      const avgPrice = allPrices.reduce((a, b) => a + b, 0) / allPrices.length

      // 检查是否是 "墙一样铺满"
      const avgHighLowRange = klines.reduce((sum, k) => sum + (k.high - k.low), 0) / klines.length
      const avgBodySize = klines.reduce((sum, k) => sum + Math.abs(k.close - k.open), 0) / klines.length
      const bodyToRangeRatio = avgBodySize / avgHighLowRange

      return NextResponse.json({
        success: true,
        symbol,
        count: klines.length,
        statistics: {
          priceRange: {
            min: minPrice,
            max: maxPrice,
            average: avgPrice,
            range: priceRange,
            rangePercent: (priceRange / avgPrice * 100).toFixed(2) + '%'
          },
          klineMetrics: {
            avgHighLowRange: avgHighLowRange.toFixed(2),
            avgBodySize: avgBodySize.toFixed(2),
            bodyToRangeRatio: bodyToRangeRatio.toFixed(4),
            isWallLike: bodyToRangeRatio > 0.95  // 如果身体占大部分，可能是 "墙"
          }
        },
        samples: {
          first,
          last,
          random: klines[Math.floor(klines.length / 2)]
        },
        issues: issues.length > 0 ? issues : null
      })
    }

    return NextResponse.json({
      success: false,
      error: '没有K线数据'
    })
  } catch (error) {
    console.error('[Debug Kline] 错误:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
