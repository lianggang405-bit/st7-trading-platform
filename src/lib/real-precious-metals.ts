/**
 * 真实贵金属价格数据源
 * 使用 GoldAPI 获取黄金白银的实时价格
 */

export interface RealPriceData {
  symbol: string
  price: number
  timestamp: number
}

/**
 * 从 GoldAPI 获取实时贵金属价格
 */
export async function getRealPreciousMetalPrice(symbol: string): Promise<RealPriceData | null> {
  const sources = [
    fetchFromGoldAPI,
    fetchFromMetalsLive,
    fetchFromExchangeRatesAPI
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
 * 从 GoldAPI 获取价格（优先）
 * API文档：https://www.goldapi.io/documentation
 */
async function fetchFromGoldAPI(symbol: string): Promise<RealPriceData | null> {
  const symbolMap: Record<string, string> = {
    'XAUUSD': 'XAU',
    'XAGUSD': 'XAG',
    'XPDUSD': 'XPD',
    'XPTUSD': 'XPT',
    'GOLD': 'XAU',
    'SILVER': 'XAG',
    'PALLADIUM': 'XPD',
    'PLATINUM': 'XPT'
  }

  const metal = symbolMap[symbol.toUpperCase()]
  if (!metal) return null

  const apiKey = process.env.NEXT_PUBLIC_GOLDAPI_KEY || 'goldapi-445bbsmmle9lsi-io'

  try {
    const url = `https://api.goldapi.io/api/${metal}/USD`
    const response = await fetch(url, {
      headers: {
        'x-access-token': apiKey,
        'Content-Type': 'application/json'
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(5000)  // 5秒超时
    })

    if (!response.ok) {
      console.error(`[GoldAPI] HTTP ${response.status}: ${response.statusText}`)
      return null
    }

    const data = await response.json()

    // GoldAPI 返回格式：{ price: 5200.99, high_price: 5223.085, low_price: 5183.17, ... }
    if (data.price) {
      return {
        symbol,
        price: parseFloat(data.price),
        timestamp: data.timestamp ? Math.floor(data.timestamp) : Math.floor(Date.now() / 1000)
      }
    }

    return null
  } catch (error) {
    console.error('[GoldAPI] 请求失败:', error)
    return null
  }
}

fetchFromGoldAPI.name = 'GoldAPI'

/**
 * 从 GoldAPI 获取历史K线数据
 * API文档：https://www.goldapi.io/documentation
 */
export async function fetchGoldAPIKlines(
  symbol: string,
  interval: string,
  limit: number = 200
): Promise<Array<{time: number, open: number, high: number, low: number, close: number, volume: number}>> {
  const symbolMap: Record<string, string> = {
    'XAUUSD': 'XAU',
    'XAGUSD': 'XAG',
    'XPDUSD': 'XPD',
    'XPTUSD': 'XPT',
    'GOLD': 'XAU',
    'SILVER': 'XAG'
  }

  const metal = symbolMap[symbol.toUpperCase()]
  if (!metal) return []

  // 转换时间周期为 GoldAPI 格式
  let goldapiInterval = '1h'
  switch (interval.toLowerCase()) {
    case '1m': goldapiInterval = '1m'; break
    case '5m': goldapiInterval = '5m'; break
    case '15m': goldapiInterval = '15m'; break
    case '1h': goldapiInterval = '1h'; break
    case '4h': goldapiInterval = '4h'; break
    case '1d': goldapiInterval = '1d'; break
    default: goldapiInterval = '1h'
  }

  const apiKey = process.env.NEXT_PUBLIC_GOLDAPI_KEY || 'goldapi-445bbsmmle9lsi-io'

  try {
    const url = `https://api.goldapi.io/api/${metal}/USD/${goldapiInterval}`
    const response = await fetch(url, {
      headers: {
        'x-access-token': apiKey,
        'Content-Type': 'application/json'
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(5000)
    })

    if (!response.ok) {
      console.error(`[GoldAPI Klines] HTTP ${response.status}: ${response.statusText}`)
      return []
    }

    const data = await response.json()

    // GoldAPI 返回格式：{ symbol: "XAU", currency: "USD", price: 5200.99, ts: 1678767600, ... }
    // 需要检查是否有历史数据
    if (data.price) {
      // 如果只有当前价格，返回空数组（让其他数据源处理）
      console.log('[GoldAPI Klines] 仅返回当前价格，无历史数据')
      return []
    }

    // 如果有历史数据数组
    if (Array.isArray(data)) {
      return data.map((k: any) => {
        const open = Number(k.open) || 0
        const high = Number(k.high) || 0
        const low = Number(k.low) || 0
        const close = Number(k.close) || 0

        return {
          time: Number(k.time || k.ts) || Math.floor(Date.now() / 1000),
          open,
          high: Math.max(high, open, close),
          low: Math.min(low, open, close),
          close,
          volume: Number(k.volume) || 0
        }
      })
    }

    return []
  } catch (error) {
    console.error('[GoldAPI Klines] 请求失败:', error)
    return []
  }
}
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
