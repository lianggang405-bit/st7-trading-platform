/**
 * K线数据源聚合器
 * 支持多种交易对类型：Crypto, Forex, Gold, Oil 等
 */

export interface KlineData {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export type SymbolCategory = 'forex' | 'gold' | 'crypto' | 'energy' | 'cfd'

// 数据缓存
const klineCache = new Map<string, { data: KlineData[]; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 缓存 5 分钟（减少 API 请求）

/**
 * 获取缓存的 K 线数据
 */
function getCachedData(symbol: string, interval: string, limit: number): KlineData[] | null {
  const key = `${symbol}_${interval}_${limit}`
  const cached = klineCache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`[KlineDataSource] 使用缓存数据: ${symbol} ${interval} (${cached.data.length} 条)`)
    return cached.data
  }
  return null
}

/**
 * 设置缓存的 K 线数据
 */
function setCachedData(symbol: string, interval: string, limit: number, data: KlineData[]): void {
  const key = `${symbol}_${interval}_${limit}`
  klineCache.set(key, { data, timestamp: Date.now() })
  console.log(`[KlineDataSource] 缓存数据: ${symbol} ${interval} (${data.length} 条)`)
}

/**
 * 获取交易对类别
 */
export function getSymbolCategory(symbol: string): SymbolCategory {
  // 加密货币
  const cryptoSymbols = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOT', 'DOGE', 'AVAX', 'LINK']
  if (cryptoSymbols.some(crypto => symbol.startsWith(crypto))) {
    return 'crypto'
  }

  // 黄金
  if (symbol.startsWith('XAU') || symbol.startsWith('GOLD')) {
    return 'gold'
  }

  // 白银
  if (symbol.startsWith('XAG')) {
    return 'gold'
  }

  // 原油
  if (symbol.includes('OIL') || symbol.includes('WTI') || symbol.includes('BRENT')) {
    return 'energy'
  }

  // 默认为外汇
  return 'forex'
}

/**
 * 获取时间周期对应的秒数
 */
export function getIntervalSeconds(interval: string): number {
  const map: Record<string, number> = {
    '1m': 60,
    '5m': 300,
    '15m': 900,
    '1h': 3600,
    '4h': 14400,
    '1d': 86400,
  }
  return map[interval.toLowerCase()] || 60
}

/**
 * 获取交易对的基础价格（用于生成模拟数据）
 * 使用更接近真实市场的价格
 */
export function getBasePrice(symbol: string): number {
  // 加密货币
  if (symbol.includes('BTC')) return 95000
  if (symbol.includes('ETH')) return 3500
  if (symbol.includes('SOL')) return 150
  if (symbol.includes('BNB')) return 600
  if (symbol.includes('LTC')) return 95
  if (symbol.includes('XRP')) return 2.5
  if (symbol.includes('DOGE')) return 0.25

  // 黄金（XAUUSD = Gold/USD）- 接近真实市场价格
  if (symbol.startsWith('XAU') || symbol.startsWith('GOLD')) return 2900

  // 白银（XAGUSD = Silver/USD）- 接近真实市场价格
  if (symbol.startsWith('XAG')) return 32.5

  // 原油
  if (symbol.includes('OIL') || symbol.includes('WTI')) return 75
  if (symbol.includes('BRENT') || symbol.includes('UKOIL')) return 79
  if (symbol.includes('USOIL')) return 75
  if (symbol.includes('NGAS')) return 2.8

  // 外汇（更准确的价格）
  if (symbol.startsWith('EURUSD')) return 1.085
  if (symbol.startsWith('GBPUSD')) return 1.265
  if (symbol.startsWith('USDJPY')) return 149.8
  if (symbol.startsWith('USDCHF')) return 0.884
  if (symbol.startsWith('AUDUSD')) return 0.645
  if (symbol.startsWith('NZDUSD')) return 0.605
  if (symbol.startsWith('USDCAD')) return 1.365
  if (symbol.startsWith('EURGBP')) return 0.858
  if (symbol.startsWith('EURJPY')) return 162.5
  if (symbol.startsWith('GBPJPY')) return 189.5
  if (symbol.startsWith('AUDJPY')) return 96.5
  if (symbol.startsWith('EURCHF')) return 0.960
  if (symbol.startsWith('GBPCHF')) return 1.120
  if (symbol.startsWith('CHFJPY')) return 169.5

  return 100
}

/**
 * 生成模拟K线数据（改进版 - 更真实的波动）
 */
export function generateMockKlines(
  symbol: string,
  interval: string,
  limit: number = 200
): KlineData[] {
  const intervalSeconds = getIntervalSeconds(interval)
  const basePrice = getBasePrice(symbol)

  const now = Math.floor(Date.now() / 1000)
  const endTime = now - (now % intervalSeconds)

  const klines: KlineData[] = []

  // 使用多个周期的正弦波组合，模拟真实市场波动
  let currentPrice = basePrice * (1 + (Math.random() - 0.5) * 0.01)

  for (let i = 0; i < limit; i++) {
    const time = endTime - ((limit - 1 - i) * intervalSeconds)

    // 模拟价格走势（多重周期组合）
    const trend = Math.sin(i / 20) * 0.02                    // 长期趋势
    const swing = Math.sin(i / 5) * 0.01                      // 中期波动
    const noise = (Math.random() - 0.5) * 0.008               // 随机噪声
    const jump = Math.random() > 0.98 ? (Math.random() - 0.5) * 0.015 : 0 // 偶尔的价格跳变

    const priceChange = trend + swing + noise + jump
    const open = currentPrice

    // 生成 close, high, low
    const close = open * (1 + priceChange)
    const volatility = Math.abs(priceChange) * 1.5 + Math.random() * 0.003
    const high = Math.max(open, close) * (1 + Math.random() * volatility)
    const low = Math.min(open, close) * (1 - Math.random() * volatility)

    // 更新当前价格
    currentPrice = close

    klines.push({
      time,
      open: Number(open.toFixed(5)),
      high: Number(high.toFixed(5)),
      low: Number(low.toFixed(5)),
      close: Number(close.toFixed(5)),
      volume: Math.floor(Math.random() * 10000 + 100),
    })
  }

  // 确保最后一个 K 线的价格接近当前市场价格
  const lastKline = klines[klines.length - 1]
  const lastPriceChange = (basePrice - lastKline.close) / lastKline.close
  klines[klines.length - 1].close = Number(basePrice.toFixed(5))
  klines[klines.length - 1].high = Number((lastKline.high * (1 + lastPriceChange * 0.5)).toFixed(5))
  klines[klines.length - 1].low = Number((lastKline.low * (1 + lastPriceChange * 0.5)).toFixed(5))

  return klines
}

/**
 * 从 Binance API 获取加密货币K线数据
 */
export async function fetchBinanceKlines(
  symbol: string,
  interval: string,
  limit: number = 200
): Promise<KlineData[]> {
  try {
    // 转换交易对格式：BTCUSD -> BTCUSDT
    let binanceSymbol = symbol
    if (symbol.endsWith('USD')) {
      binanceSymbol = symbol.replace('USD', 'USDT')
    }

    const url = `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${interval}&limit=${limit}`

    const response = await fetch(url)
    if (!response.ok) {
      return []
    }

    const data = await response.json()
    if (!Array.isArray(data) || data.length === 0) {
      return []
    }

    return data.map((k: any) => ({
      time: Math.floor(k[0] / 1000),
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5]),
    }))
  } catch (error) {
    return []
  }
}

/**
 * 从 Yahoo Finance API 获取K线数据（支持 Forex, Gold, Oil 等）
 */
export async function fetchYahooFinanceKlines(
  symbol: string,
  interval: string,
  limit: number = 200
): Promise<KlineData[]> {
  try {
    // 转换交易对格式为 Yahoo Finance 格式
    let yahooSymbol = symbol

    // Forex: EURUSD -> EURUSD=X
    if (!symbol.includes('=')) {
      const category = getSymbolCategory(symbol)
      if (category === 'forex') {
        yahooSymbol = `${symbol}=X`
      }
    }

    // 转换时间周期为 Yahoo Finance 格式
    let intervalYahoo = '1m'
    switch (interval.toLowerCase()) {
      case '1m': intervalYahoo = '1m'; break
      case '5m': intervalYahoo = '5m'; break
      case '15m': intervalYahoo = '15m'; break
      case '1h': intervalYahoo = '1h'; break
      case '4h': intervalYahoo = '1d'; break
      case '1d': intervalYahoo = '1d'; break
    }

    // 计算时间范围
    const intervalSeconds = getIntervalSeconds(interval)
    const to = Math.floor(Date.now() / 1000)
    const from = to - (intervalSeconds * limit)

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=${intervalYahoo}&period1=${from}&period2=${to}`

    const response = await fetch(url)
    if (!response.ok) {
      return []
    }

    const data = await response.json()

    if (!data.chart?.result?.[0]?.timestamp) {
      return []
    }

    const result = data.chart.result[0]
    const timestamps = result.timestamp
    const indicators = result.indicators
    const quote = indicators.quote?.[0] || {}

    const klines: KlineData[] = []

    for (let i = 0; i < timestamps.length; i++) {
      const open = quote.open?.[i]
      const high = quote.high?.[i]
      const low = quote.low?.[i]
      const close = quote.close?.[i]
      const volume = quote.volume?.[i] || 0

      if (open !== null && high !== null && low !== null && close !== null) {
        klines.push({
          time: timestamps[i],
          open,
          high,
          low,
          close,
          volume,
        })
      }
    }

    return klines
  } catch (error) {
    return []
  }
}

/**
 * 聚合K线数据源
 * 根据交易对类型自动选择最佳数据源
 */
export async function fetchKlines(
  symbol: string,
  interval: string,
  limit: number = 200
): Promise<KlineData[]> {
  const category = getSymbolCategory(symbol)

  console.log(`[KlineDataSource] Fetching klines: ${symbol} (${category}) ${interval}`)

  // 检查缓存
  const cached = getCachedData(symbol, interval, limit)
  if (cached) {
    console.log(`[KlineDataSource] 使用缓存数据: ${cached.length} 条`)
    return cached
  }

  // 优先使用真实数据源
  let klines: KlineData[] = []

  // Crypto: 使用 Binance API
  if (category === 'crypto') {
    klines = await fetchBinanceKlines(symbol, interval, limit)
  }
  // Forex, Gold, Oil: 使用 Yahoo Finance API
  else if (category === 'forex' || category === 'gold' || category === 'energy') {
    klines = await fetchYahooFinanceKlines(symbol, interval, limit)
  }

  // 如果获取成功，缓存并返回真实数据
  if (klines.length > 0) {
    console.log(`[KlineDataSource] 成功获取 ${klines.length} 条真实数据`)
    setCachedData(symbol, interval, limit, klines)
    return klines
  }

  // 如果所有数据源都失败，返回模拟数据
  console.log(`[KlineDataSource] 所有数据源失败，生成模拟数据`)
  const mockData = generateMockKlines(symbol, interval, limit)
  setCachedData(symbol, interval, limit, mockData)
  return mockData
}
