/**
 * 真实贵金属价格数据源
 * 尝试从多个免费API获取黄金白银的实时价格
 */

export interface RealPriceData {
  symbol: string
  price: number
  timestamp: number
}

/**
 * 尝试从多个API获取实时贵金属价格
 */
export async function getRealPreciousMetalPrice(symbol: string): Promise<RealPriceData | null> {
  const sources = [
    fetchFromMetalsLive,
    fetchFromExchangeRatesAPI,
    fetchFromCommodityAPI
  ]

  for (const source of sources) {
    try {
      const data = await source(symbol)
      if (data) {
        console.log(`[RealPreciousMetals] 成功从 ${source.name} 获取 ${symbol} 价格: ${data.price}`)
        return data
      }
    } catch (error) {
      console.error(`[RealPreciousMetals] ${source.name} 失败:`, error)
      continue
    }
  }

  return null
}

/**
 * 从 metals.live API 获取价格
 */
async function fetchFromMetalsLive(symbol: string): Promise<RealPriceData | null> {
  const symbolMap: Record<string, string> = {
    'XAUUSD': 'gold',
    'XAGUSD': 'silver',
    'GOLD': 'gold',
    'SILVER': 'silver'
  }

  const metal = symbolMap[symbol.toUpperCase()]
  if (!metal) return null

  try {
    const url = `https://api.metals.live/v1/spot/${metal}`
    const response = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000)  // 5秒超时
    })

    if (!response.ok) return null

    const data = await response.json()

    // metals.live 返回格式：{ price: 5200.99, ... }
    if (data.price) {
      return {
        symbol,
        price: parseFloat(data.price),
        timestamp: Math.floor(Date.now() / 1000)
      }
    }

    return null
  } catch (error) {
    return null
  }
}

fetchFromMetalsLive.name = 'Metals Live API'

/**
 * 从 exchange-rates API 获取价格
 */
async function fetchFromExchangeRatesAPI(symbol: string): Promise<RealPriceData | null> {
  const symbolMap: Record<string, string> = {
    'XAUUSD': 'XAU',
    'XAGUSD': 'XAG',
    'GOLD': 'XAU',
    'SILVER': 'XAG'
  }

  const metal = symbolMap[symbol.toUpperCase()]
  if (!metal) return null

  try {
    const url = `https://api.exchangerate-api.com/v4/latest/USD`
    const response = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000)
    })

    if (!response.ok) return null

    const data = await response.json()

    // exchange-rates API 返回格式：{ rates: { XAU: 0.00019, ... } }
    // 注意：这里返回的是1美元能买多少黄金，需要转换
    if (data.rates && data.rates[metal]) {
      const goldPerUSD = data.rates[metal]
      const price = 1 / goldPerUSD  // 转换为美元/盎司

      return {
        symbol,
        price: Number(price.toFixed(2)),
        timestamp: Math.floor(Date.now() / 1000)
      }
    }

    return null
  } catch (error) {
    return null
  }
}

fetchFromExchangeRatesAPI.name = 'Exchange Rates API'

/**
 * 从 commodity API 获取价格（备用）
 */
async function fetchFromCommodityAPI(symbol: string): Promise<RealPriceData | null> {
  // 这里可以添加其他免费API
  return null
}

fetchFromCommodityAPI.name = 'Commodity API'
