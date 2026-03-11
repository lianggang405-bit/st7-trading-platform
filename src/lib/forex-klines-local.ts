/**
 * 外汇K线数据源（本地数据）
 *
 * 基于真实价格生成模拟K线数据
 */

export interface KlineData {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

// 外汇基准价格（2026年3月真实价格）
const FOREX_BASE_PRICES: Record<string, number> = {
  'EURUSD': 1.085,
  'GBPUSD': 1.265,
  'USDJPY': 149.8,
  'USDCHF': 0.884,
  'AUDUSD': 0.645,
  'NZDUSD': 0.605,
  'USDCAD': 1.365,
  'EURGBP': 0.858,
  'EURJPY': 162.5,
  'GBPJPY': 189.5,
  'AUDJPY': 96.5,
  'EURCHF': 0.960,
  'GBPCHF': 1.120,
  'CHFJPY': 169.5,
}

// 原油基准价格
const OIL_BASE_PRICES: Record<string, number> = {
  'USOIL': 85,
  'WTI': 85,
  'BRENT': 88,
  'UKOIL': 88,
}

/**
 * 生成外汇/原油K线数据
 * 基于真实价格生成模拟K线
 */
export function generateForexKlines(
  symbol: string,
  interval: string,
  limit: number = 200
): KlineData[] {
  // 获取基准价格
  let basePrice = FOREX_BASE_PRICES[symbol]

  // 如果没有找到，尝试原油
  if (!basePrice) {
    basePrice = OIL_BASE_PRICES[symbol]
  }

  // 如果还是没有，使用默认价格
  if (!basePrice) {
    basePrice = 1.0
  }

  // 转换时间周期为秒数
  const intervalSeconds = {
    '1m': 60,
    '5m': 300,
    '15m': 900,
    '1h': 3600,
    '4h': 14400,
    '1d': 86400,
  }[interval] || 3600

  const now = Math.floor(Date.now() / 1000)
  const endTime = now - (now % intervalSeconds)

  const klines: KlineData[] = []

  // 外汇波动率（相对较低）
  const volatility = 0.002

  let currentPrice = basePrice * (1 + (Math.random() - 0.5) * 0.001)
  let marketTrend = 0

  for (let i = 0; i < limit; i++) {
    const time = endTime - ((limit - 1 - i) * intervalSeconds)

    // 每20根K线切换一次趋势
    if (i % 20 === 0) {
      const rand = Math.random()
      if (rand < 0.33) marketTrend = -1
      else if (rand < 0.66) marketTrend = 0
      else marketTrend = 1
    }

    // 计算价格变化
    const randomChange = (Math.random() - 0.5) * volatility
    const trendChange = marketTrend * volatility * 0.3
    const meanReversion = (basePrice - currentPrice) / basePrice * 0.05

    const priceChange = randomChange + trendChange + meanReversion

    const open = currentPrice
    const close = open * (1 + priceChange)

    // 生成高低点
    const bodySize = Math.abs(close - open) / open
    const upperShadow = Math.random() * bodySize * 2
    const lowerShadow = Math.random() * bodySize * 2

    const high = Math.max(open, close) * (1 + upperShadow)
    const low = Math.min(open, close) * (1 - lowerShadow)

    // 生成K线数据（不强制固定价格）
    klines.push({
      time,
      open: Number(open.toFixed(5)),
      high: Number(high.toFixed(5)),
      low: Number(low.toFixed(5)),
      close: Number(close.toFixed(5)),
      volume: Math.floor(Math.random() * 100000 + 50000),
    })

    currentPrice = close
  }

  console.log(`[ForexKlines] 生成 ${klines.length} 条K线数据，${symbol} 基准价格: ${basePrice}`)

  return klines
}
