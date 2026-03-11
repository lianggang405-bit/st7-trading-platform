/**
 * 黄金K线数据源（本地数据 + API）
 *
 * 由于外部 API 访问受限，使用本地生成的K线数据
 * 数据基于真实价格（XAUUSD ≈ 5200 USD）
 */

export interface KlineData {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

// 黄金基准价格（2026年3月真实价格）
const GOLD_BASE_PRICE = 5200
const SILVER_BASE_PRICE = 29.5

/**
 * 生成黄金/白银K线数据
 * 基于真实价格生成模拟K线，展示系统功能
 */
export function generatePreciousMetalKlines(
  symbol: string,
  interval: string,
  limit: number = 200
): KlineData[] {
  // 获取基准价格
  const basePrice = symbol.includes('XAU') || symbol.includes('GOLD')
    ? GOLD_BASE_PRICE
    : SILVER_BASE_PRICE

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

  // 使用更真实的市场模拟
  let currentPrice = basePrice * (1 + (Math.random() - 0.5) * 0.002)
  let marketTrend = 0  // 市场趋势：-1=下跌，0=震荡，1=上涨

  // 黄金日内波动约 40-80 点（0.8%-1.5%）
  const volatility = 0.008

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
    const randomChange = (Math.random() - 0.5) * volatility * 0.5
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

    // 确保最后一个K线的价格接近当前价格
    if (i === limit - 1) {
      klines.push({
        time,
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(basePrice.toFixed(2)),
        volume: Math.floor(Math.random() * 50000 + 10000),
      })
    } else {
      klines.push({
        time,
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
        volume: Math.floor(Math.random() * 50000 + 10000),
      })
    }

    currentPrice = close
  }

  console.log(`[GoldKlines] 生成 ${klines.length} 条K线数据，基准价格: ${basePrice}`)

  return klines
}
