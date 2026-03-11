/**
 * 真实贵金属价格数据源
 * 使用 GoldAPI 获取黄金白银的实时价格
 */

export interface RealPriceData {
  symbol: string
  price: number
  timestamp: number
}

// 数据源配置（包含名称）
const dataSourceConfigs = [
  { name: 'GoldAPI', fn: fetchFromGoldAPI },
  { name: 'MetalsLive', fn: fetchFromMetalsLive },
  { name: 'ExchangeRatesAPI', fn: fetchFromExchangeRatesAPI }
]

/**
 * 从 GoldAPI 获取实时贵金属价格
 */
export async function getRealPreciousMetalPrice(symbol: string): Promise<RealPriceData | null> {
  for (const config of dataSourceConfigs) {
    try {
      const data = await config.fn(symbol)
      if (data) {
        console.log(`[RealPreciousMetals] 成功从 ${config.name} 获取 ${symbol} 价格: ${data.price}`)
        return data
      }
    } catch (error) {
      console.error(`[RealPreciousMetals] ${config.name} 失败:`, error)
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

    // GoldAPI 返回格式：
    // {
    //   "date": "2026-03-04T10:30:00.000Z",
    //   "timestamp": 1772620200000,
    //   "metal": "XAU",
    //   "exchange": "LBMA",
    //   "currency": "USD",
    //   "price": 5183.7,
    //   "prev_close_price": 5267.6,
    //   "ch": -83.9,
    //   "chp": -1.6185,
    //   "price_gram_24k": 166.6598,
    //   ...
    // }

    if (data.price) {
      // 转换时间戳（毫秒 -> 秒）
      const timestamp = data.timestamp ? Math.floor(data.timestamp / 1000) : Math.floor(Date.now() / 1000)

      return {
        symbol,
        price: parseFloat(data.price),
        timestamp
      }
    }

    return null
  } catch (error) {
    console.error('[GoldAPI] 请求失败:', error)
    return null
  }
}

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

  console.log(`[GoldAPI Klines] 开始请求: ${metal}/${goldapiInterval} (limit: ${limit})`)

  try {
    const url = `https://api.goldapi.io/api/${metal}/USD/${goldapiInterval}`
    console.log(`[GoldAPI Klines] 请求 URL: ${url}`)
    console.log(`[GoldAPI Klines] API 密钥: ${apiKey.substring(0, 10)}...`)

    const response = await fetch(url, {
      headers: {
        'x-access-token': apiKey,
        'Content-Type': 'application/json'
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(5000)
    })

    console.log(`[GoldAPI Klines] HTTP 状态: ${response.status} ${response.statusText}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[GoldAPI Klines] HTTP 错误响应:`, errorText)
      return []
    }

    const data = await response.json()
    console.log(`[GoldAPI Klines] 响应类型: ${Array.isArray(data) ? '数组' : typeof data}`)

    // GoldAPI 历史K线数据格式
    // 可能是数组格式，每个元素包含：
    // {
    //   "date": "2026-03-04T10:30:00.000Z",
    //   "timestamp": 1772620200000,
    //   "price": 5183.7,
    //   "open": 5190,
    //   "high": 5223,
    //   "low": 5183,
    //   ...
    // }

    if (Array.isArray(data) && data.length > 0) {
      console.log(`[GoldAPI Klines] 成功获取 ${data.length} 条K线数据`)

      const klines = data.map((k: any) => {
        // 尝试多种可能的字段名
        const open = Number(k.open || k.open_price) || Number(k.price) || 0
        const close = Number(k.price) || 0
        const high = Number(k.high || k.high_price) || Math.max(open, close)
        const low = Number(k.low || k.low_price) || Math.min(open, close)

        // 转换时间戳（毫秒 -> 秒）
        const time = k.timestamp ? Math.floor(k.timestamp / 1000) :
                    k.date ? Math.floor(new Date(k.date).getTime() / 1000) :
                    Math.floor(Date.now() / 1000)

        return {
          time,
          open,
          high: Math.max(high, open, close),
          low: Math.min(low, open, close),
          close,
          volume: Number(k.volume) || 0
        }
      })

      // 按时间排序（从旧到新）
      klines.sort((a, b) => a.time - b.time)

      // 取最近 N 条数据
      const result = klines.slice(-limit)
      console.log(`[GoldAPI Klines] 返回 ${result.length} 条K线数据`)

      return result
    }

    // 如果是单个对象（只有当前价格），返回空数组
    if (data.price && !Array.isArray(data)) {
      console.log('[GoldAPI Klines] 仅返回当前价格，无历史数据')
      console.log('[GoldAPI Klines] 当前价格:', data.price)
      return []
    }

    console.log('[GoldAPI Klines] 返回数据格式不匹配:', data)
    return []
  } catch (error) {
    console.error('[GoldAPI Klines] 请求失败:', error)
    if (error instanceof Error) {
      console.error('[GoldAPI Klines] 错误详情:', error.message)
      console.error('[GoldAPI Klines] 错误堆栈:', error.stack)
    }
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

/**
 * 从 commodity API 获取价格（备用）
 */
async function fetchFromCommodityAPI(symbol: string): Promise<RealPriceData | null> {
  // 这里可以添加其他免费API
  return null
}
