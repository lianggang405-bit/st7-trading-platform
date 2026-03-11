/**
 * 黄金K线数据源（基于实时价格）
 *
 * 使用 https://api.gold-api.com/price/XAU 获取实时价格
 * 然后生成模拟K线数据
 */

export interface KlineData {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

// 黄金基准价格（从实时 API 获取）
const GOLD_BASE_PRICE = 5200
const SILVER_BASE_PRICE = 29.5

/**
 * 获取实时黄金/白银价格
 */
async function getRealTimePrice(symbol: string): Promise<number> {
  try {
    // XAU -> XAU, XAG -> XAG
    const metal = symbol.includes('XAU') || symbol.includes('GOLD') ? 'XAU' : 'XAG'

    const response = await fetch(`/api/gold-price?symbol=${metal}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    })

    if (response.ok) {
      const data = await response.json()
      if (data.success && data.price) {
        console.log(`[GoldKlines] 获取实时价格: ${metal} = ${data.price}`)
        return data.price
      }
    }
  } catch (error) {
    console.log('[GoldKlines] 获取实时价格失败，使用基准价格:', error)
  }

  // 返回基准价格
  return symbol.includes('XAU') || symbol.includes('GOLD') ? GOLD_BASE_PRICE : SILVER_BASE_PRICE
}

/**
 * 生成黄金/白银K线数据
 * 基于实时价格生成模拟K线
 */
export async function generatePreciousMetalKlines(
  symbol: string,
  interval: string,
  limit: number = 200
): Promise<KlineData[]> {
  // 获取实时价格
  const basePrice = await getRealTimePrice(symbol)

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

    // 生成K线数据（不强制固定价格）
    klines.push({
      time,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume: Math.floor(Math.random() * 50000 + 10000),
    })

    currentPrice = close
  }

  console.log(`[GoldKlines] 生成 ${klines.length} 条K线数据，基准价格: ${basePrice}`)

  return klines
}
