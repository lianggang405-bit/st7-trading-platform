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
const CACHE_DURATION = 10 * 1000 // 缓存 10 秒（确保价格实时更新）

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
 * 清除所有缓存（用于模拟数据算法更新后强制刷新）
 */
export function clearKlineCache(): void {
  klineCache.clear()
  console.log('[KlineDataSource] 已清除所有 K 线数据缓存')
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
 * 优先从 /api/market 获取真实价格
 */
export async function getBasePrice(symbol: string): Promise<number> {
  try {
    // 从统一的市场数据源获取价格
    const response = await fetch('/api/market', {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000)  // 5秒超时
    })

    if (response.ok) {
      const data = await response.json()
      if (data.success && data.symbols) {
        const symbolData = data.symbols.find((s: any) => s.symbol === symbol)
        if (symbolData && symbolData.price > 0) {
          console.log(`[KlineDataSource] 使用统一市场数据源价格: ${symbol} = ${symbolData.price}`)
          return symbolData.price
        }
      }
    }
  } catch (error) {
    console.log('[KlineDataSource] 获取统一市场数据源价格失败，使用静态价格:', error)
  }

  // 失败则使用基准价格
  return getBasePriceStatic(symbol)
}

/**
 * 获取静态基准价格（备用）
 */
export function getBasePriceStatic(symbol: string): number {
  // 加密货币（2026年3月实时价格）
  if (symbol.includes('BTC')) return 68000
  if (symbol.includes('ETH')) return 1900
  if (symbol.includes('SOL')) return 95
  if (symbol.includes('BNB')) return 520
  if (symbol.includes('LTC')) return 88
  if (symbol.includes('XRP')) return 1.38
  if (symbol.includes('DOGE')) return 0.15

  // 黄金（XAUUSD = Gold/USD）- 基于GoldAPI真实数据（2026年3月11日）
  if (symbol.startsWith('XAU') || symbol.startsWith('GOLD')) return 5200

  // 白银（XAGUSD = Silver/USD）- 基于市场真实价格
  if (symbol.startsWith('XAG')) return 29.5

  // 原油（2026年3月11日：WTI原油85美元左右）
  if (symbol.includes('OIL') || symbol.includes('WTI')) return 85
  if (symbol.includes('BRENT') || symbol.includes('UKOIL')) return 88
  if (symbol.includes('USOIL')) return 85
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
 * 
 * 重要逻辑：
 * - 最后一根K线的收盘价必须等于当前的交易对价格
 * - 从最后一根K线往回推算历史价格
 * - 这样可以确保K线图与交易对价格一致
 */
export async function generateMockKlines(
  symbol: string,
  interval: string,
  limit: number = 200
): Promise<KlineData[]> {
  const intervalSeconds = getIntervalSeconds(interval)
  const currentPrice = await getBasePrice(symbol)  // 获取当前交易对价格
  const category = getSymbolCategory(symbol)

  const now = Math.floor(Date.now() / 1000)
  const endTime = now - (now % intervalSeconds)

  const klines: KlineData[] = []

  // 根据交易对类别设置波动率参数
  // 基于GoldAPI真实数据：黄金日内波动约40点（0.8%）
  const isPreciousMetal = category === 'gold'
  const volatilityScale = isPreciousMetal ? 0.4 : 1.0  // 贵金属波动率0.4倍
  const maxPriceDeviation = isPreciousMetal ? 0.015 : 0.05  // 贵金属最大偏离1.5%（约40点）

  // 使用更真实的市场模拟模型
  // 从最后一根K线往回推算（确保最后一根K线的收盘价等于当前价格）
  let lastClosePrice = currentPrice
  const priceChanges: number[] = []  // 保存价格变化（用于反向生成）

  // 市场状态（模拟真实市场的多空转换）
  let marketPhase = 'consolidation'  // consolidation, trend_up, trend_down
  let phaseDuration = 0
  const phaseLength = 10 + Math.floor(Math.random() * 20)

  // 正向生成价格变化（从第一个K线到最后一个）
  for (let i = 0; i < limit; i++) {
    // 市场相位转换
    phaseDuration++
    if (phaseDuration > phaseLength) {
      const rand = Math.random()
      if (rand < 0.33) {
        marketPhase = 'consolidation'
      } else if (rand < 0.66) {
        marketPhase = 'trend_up'
      } else {
        marketPhase = 'trend_down'
      }
      phaseDuration = 0
    }

    // 基础价格变化（微小的随机波动）
    const randomShock = (Math.random() - 0.5) * 0.002 * volatilityScale

    // 根据市场相位调整趋势
    let trendBias = 0
    if (marketPhase === 'trend_up') {
      trendBias = 0.001 * volatilityScale  // 温和上涨
    } else if (marketPhase === 'trend_down') {
      trendBias = -0.001 * volatilityScale  // 温和下跌
    }

    // 综合价格变化（相对于前一K线的收盘价）
    const priceChange = randomShock + trendBias
    priceChanges.push(priceChange)
  }

  // 反向生成K线（确保最后一根K线的收盘价等于当前价格）
  let currentPriceForGeneration = currentPrice

  for (let i = limit - 1; i >= 0; i--) {
    // 计算时间（从现在往前推）
    const time = endTime - (limit - i - 1) * intervalSeconds

    // 反向应用价格变化（当前K线的收盘价 = 下一K线的开盘价）
    const priceChange = priceChanges[i]

    // 当前K线的开盘价（从下一根K线的收盘价反推）
    const open = currentPriceForGeneration

    // 当前K线的收盘价
    const close = open * (1 + priceChange)

    // 上下影线（基于真实市场的上下影线比例）
    const bodySize = Math.abs(close - open) / open
    const upperShadowRatio = Math.random() * 2 + 0.5  // 0.5-2.5倍实体
    const lowerShadowRatio = Math.random() * 2 + 0.5

    const high = Math.max(open, close) * (1 + bodySize * upperShadowRatio)
    const low = Math.min(open, close) * (1 - bodySize * lowerShadowRatio)

    // 保存K线数据（注意：由于是反向生成，需要反转顺序）
    klines.unshift({
      time,
      open: Number(open.toFixed(5)),
      high: Number(high.toFixed(5)),
      low: Number(low.toFixed(5)),
      close: Number(close.toFixed(5)),
      volume: Math.floor(Math.random() * 10000 + 100),
    })

    // 更新当前价格（用于反向生成前一根K线）
    currentPriceForGeneration = close
  }

  // ✅ 安全验证：确保 high >= max(open, close) 且 low <= min(open, close)
  for (const kline of klines) {
    const maxOC = Math.max(kline.open, kline.close)
    const minOC = Math.min(kline.open, kline.close)

    if (kline.high < maxOC) {
      kline.high = maxOC
    }
    if (kline.low > minOC) {
      kline.low = minOC
    }
  }

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

    return data.map((k: any) => {
      const open = parseFloat(k[1]) || 0
      const high = parseFloat(k[2]) || 0
      const low = parseFloat(k[3]) || 0
      const close = parseFloat(k[4]) || 0
      const volume = parseFloat(k[5]) || 0

      return {
        time: Math.floor(k[0] / 1000),
        open,
        high: Math.max(high, open, close),  // 确保 high >= max(open, close)
        low: Math.min(low, open, close),    // 确保 low <= min(open, close)
        close,
        volume
      }
    })
  } catch (error) {
    return []
  }
}

/**
 * 从 Finnhub API 获取黄金和白银的实时价格（用于生成真实K线）
 * 免费额度：60 请求/分钟
 */
export async function fetchFinnhubPrice(symbol: string): Promise<number | null> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_FINNHUB_API_KEY || ''

    if (!apiKey) {
      return null
    }

    // Finnhub 使用不同的交易对格式
    const finnhubSymbolMap: Record<string, string> = {
      'XAUUSD': 'XAUUSD',
      'XAGUSD': 'XAGUSD',
      'GOLD': 'XAUUSD',
      'SILVER': 'XAGUSD',
    }

    const finnhubSymbol = finnhubSymbolMap[symbol.toUpperCase()] || symbol.toUpperCase()

    // Finnhub Quote API
    const url = `https://finnhub.io/api/v1/quote?symbol=${finnhubSymbol}&token=${apiKey}`

    const response = await fetch(url, {
      cache: 'no-store',
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()

    // Finnhub 返回格式：{ c: current price, h: high, l: low, o: open, pc: previous close }
    const currentPrice = data.c || 0

    if (currentPrice === 0) {
      return null
    }

    return currentPrice
  } catch (error) {
    return null
  }
}

/**
 * 从 Finnhub API 获取K线数据（使用 candle API）
 */
export async function fetchFinnhubKlines(
  symbol: string,
  interval: string,
  limit: number = 200
): Promise<KlineData[]> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_FINNHUB_API_KEY || ''

    if (!apiKey) {
      return []
    }

    // Finnhub 使用不同的交易对格式
    const finnhubSymbolMap: Record<string, string> = {
      'XAUUSD': 'XAUUSD',
      'XAGUSD': 'XAGUSD',
      'GOLD': 'XAUUSD',
      'SILVER': 'XAGUSD',
    }

    const finnhubSymbol = finnhubSymbolMap[symbol.toUpperCase()] || symbol.toUpperCase()

    // 转换时间周期为 Finnhub 格式
    let finnhubInterval = '1'
    switch (interval.toLowerCase()) {
      case '1m': finnhubInterval = '1'; break
      case '5m': finnhubInterval = '5'; break
      case '15m': finnhubInterval = '15'; break
      case '1h': finnhubInterval = '60'; break
      case '4h': finnhubInterval = '240'; break
      case '1d': finnhubInterval = 'D'; break
      default: finnhubInterval = '1'
    }

    // 计算时间范围（最近 N 根K线）
    const intervalSeconds = getIntervalSeconds(interval)
    const endTime = Math.floor(Date.now() / 1000)
    const startTime = endTime - (intervalSeconds * limit)

    // Finnhub Stock Candle API
    const url = `https://finnhub.io/api/v1/stock/candle?symbol=${finnhubSymbol}&resolution=${finnhubInterval}&from=${startTime}&to=${endTime}&token=${apiKey}`

    const response = await fetch(url, {
      cache: 'no-store',
    })

    if (!response.ok) {
      return []
    }

    const data = await response.json()

    // Finnhub 返回格式：{ s: status, t: timestamps, o: opens, h: highs, l: lows, c: closes, v: volumes }
    if (data.s !== 'ok' || !data.t || !data.o) {
      return []
    }

    const klines: KlineData[] = []

    for (let i = 0; i < data.t.length; i++) {
      const open = Number(data.o[i]) || 0
      const high = Number(data.h[i]) || 0
      const low = Number(data.l[i]) || 0
      const close = Number(data.c[i]) || 0

      klines.push({
        time: data.t[i],
        open,
        high: Math.max(high, open, close),  // 确保 high >= max(open, close)
        low: Math.min(low, open, close),    // 确保 low <= min(open, close)
        close,
        volume: Number(data.v[i]) || 0,
      })
    }

    // 按时间排序
    klines.sort((a, b) => a.time - b.time)

    return klines
  } catch (error) {
    return []
  }
}

/**
 * 从 Twelve Data API 获取贵金属K线数据（支持 XAUUSD, XAGUSD 等）
 * 免费额度：800 请求/天
 */
export async function fetchTwelveDataKlines(
  symbol: string,
  interval: string,
  limit: number = 200
): Promise<KlineData[]> {
  try {
    // Twelve Data 需要特定的交易对格式
    const twelveSymbolMap: Record<string, string> = {
      'XAUUSD': 'XAU/USD',
      'XAGUSD': 'XAG/USD',
      'XPDUSD': 'XPD/USD',
      'XPTUSD': 'XPT/USD',
      'GOLD': 'XAU/USD',
      'SILVER': 'XAG/USD',
    }

    const twelveSymbol = twelveSymbolMap[symbol.toUpperCase()] || symbol.toUpperCase().replace('USD', '/USD')

    // 转换时间周期为 Twelve Data 格式
    let twelveInterval = '1min'
    switch (interval.toLowerCase()) {
      case '1m': twelveInterval = '1min'; break
      case '5m': twelveInterval = '5min'; break
      case '15m': twelveInterval = '15min'; break
      case '1h': twelveInterval = '1h'; break
      case '4h': twelveInterval = '4h'; break
      case '1d': twelveInterval = '1day'; break
      default: twelveInterval = '1min'
    }

    // 计算输出大小
    let outputSize = limit
    if (outputSize > 100) outputSize = 100 // Twelve Data 免费版限制

    // Twelve Data Time Series API 端点
    const apiKey = process.env.NEXT_PUBLIC_TWELVE_DATA_API_KEY || 'demo'
    const url = `https://api.twelvedata.com/time_series?symbol=${twelveSymbol}&interval=${twelveInterval}&outputsize=${outputSize}&apikey=${apiKey}`

    const response = await fetch(url, {
      cache: 'no-store',
    })

    if (!response.ok) {
      return []
    }

    const data = await response.json()

    // Twelve Data 返回格式：{ values: [{ datetime, open, high, low, close, volume }], status, ... }
    if (!data.values || !Array.isArray(data.values)) {
      return []
    }

    const klines: KlineData[] = data.values.map((v: any) => {
      // 转换时间格式（YYYY-MM-DD HH:MM:SS 或 YYYY-MM-DD）
      const datetime = v.datetime
      const [datePart, timePart] = datetime.split(' ')

      const [year, month, day] = datePart.split('-').map(Number)
      let hours = 0, minutes = 0, seconds = 0

      if (timePart) {
        const timeParts = timePart.split(':')
        hours = parseInt(timeParts[0]) || 0
        minutes = parseInt(timeParts[1]) || 0
        seconds = parseInt(timeParts[2]) || 0
      }

      // 转换为秒级时间戳
      const timestamp = Math.floor(new Date(year, month - 1, day, hours, minutes, seconds).getTime() / 1000)

      const open = parseFloat(v.open) || 0
      const high = parseFloat(v.high) || 0
      const low = parseFloat(v.low) || 0
      const close = parseFloat(v.close) || 0

      return {
        time: timestamp,
        open,
        high: Math.max(high, open, close),  // 确保 high >= max(open, close)
        low: Math.min(low, open, close),    // 确保 low <= min(open, close)
        close,
        volume: parseFloat(v.volume) || 0,
      }
    })

    // 按时间排序
    klines.sort((a, b) => a.time - b.time)

    return klines
  } catch (error) {
    return []
  }
}
export async function fetchKrakenKlines(
  symbol: string,
  interval: string,
  limit: number = 200
): Promise<KlineData[]> {
  try {
    // Kraken API 需要特定的交易对格式
    const krakenSymbolMap: Record<string, string> = {
      'XAUUSD': 'XAUUSD',
      'XAGUSD': 'XAGUSD',
      'XPDUSD': 'XPDUSD',
      'XPTUSD': 'XPTUSD',
      'GOLD': 'XAUUSD',
      'SILVER': 'XAGUSD',
    }

    const krakenSymbol = krakenSymbolMap[symbol.toUpperCase()] || symbol.toUpperCase()

    // 转换时间周期为 Kraken 格式（分钟）
    let intervalMinutes = 1
    switch (interval.toLowerCase()) {
      case '1m': intervalMinutes = 1; break
      case '5m': intervalMinutes = 5; break
      case '15m': intervalMinutes = 15; break
      case '1h': intervalMinutes = 60; break
      case '4h': intervalMinutes = 240; break
      case '1d': intervalMinutes = 1440; break
      default: intervalMinutes = 1
    }

    // Kraken OHLCV API 端点
    const url = `https://api.kraken.com/0/public/OHLC?pair=${krakenSymbol}&interval=${intervalMinutes}`

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      return []
    }

    const data = await response.json()

    // Kraken API 返回格式：{ error: [], result: { "XXAUZUSD": [[...]] } }
    if (data.error && data.error.length > 0) {
      return []
    }

    // 获取第一个交易对的数据
    const resultKeys = Object.keys(data.result || {})
    if (resultKeys.length === 0) {
      return []
    }

    const pairData = data.result[resultKeys[0]]

    if (!Array.isArray(pairData) || pairData.length === 0) {
      return []
    }

    // Kraken OHLCV 格式：[time, open, high, low, close, vwap, volume, count]
    const klines: KlineData[] = pairData.map((k: any) => {
      const open = parseFloat(k[1]) || 0
      const high = parseFloat(k[2]) || 0
      const low = parseFloat(k[3]) || 0
      const close = parseFloat(k[4]) || 0

      return {
        time: parseInt(k[0]), // 秒级时间戳
        open,
        high: Math.max(high, open, close),  // 确保 high >= max(open, close)
        low: Math.min(low, open, close),    // 确保 low <= min(open, close)
        close,
        volume: parseFloat(k[6]), // 成交量
      }
    })

    // 取最近的 N 条数据
    return klines.slice(-limit)
  } catch (error) {
    return []
  }
}
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
          open: Number(open),
          high: Math.max(Number(high), Number(open), Number(close)),  // 确保 high >= max(open, close)
          low: Math.min(Number(low), Number(open), Number(close)),    // 确保 low <= min(open, close)
          close: Number(close),
          volume: Number(volume),
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
  limit: number = 200,
  forceRefresh: boolean = false  // 强制刷新，跳过缓存
): Promise<KlineData[]> {
  const category = getSymbolCategory(symbol)

  console.log(`[KlineDataSource] Fetching klines: ${symbol} (${category}) ${interval} forceRefresh=${forceRefresh}`)

  // 检查缓存（除非强制刷新）
  if (!forceRefresh) {
    const cached = getCachedData(symbol, interval, limit)
    if (cached) {
      console.log(`[KlineDataSource] 使用缓存数据: ${cached.length} 条`)
      return cached
    }
  } else {
    console.log(`[KlineDataSource] 强制刷新，跳过缓存`)
  }

  // 优先使用真实数据源
  let klines: KlineData[] = []

  // Crypto: 使用 Binance API
  if (category === 'crypto') {
    klines = await fetchBinanceKlines(symbol, interval, limit)
  }
  // Gold (XAUUSD, XAGUSD): 优先使用 GoldAPI（真实数据）
  else if (category === 'gold') {
    try {
      // 通过服务端 API 代理调用 GoldAPI，避免 CORS 问题
      const response = await fetch(`/api/goldapi-klines?symbol=${symbol}&interval=${interval}&limit=${limit}`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(10000)  // 10秒超时
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.klines && data.klines.length > 0) {
          klines = data.klines
          console.log(`[KlineDataSource] 从 GoldAPI 获取 ${klines.length} 条数据`)
        }
      }
    } catch (error) {
      console.log('[KlineDataSource] GoldAPI 调用失败，尝试其他数据源:', error)
    }

    // 如果 GoldAPI 失败，尝试代理 API（支持 Kraken 和 Yahoo Finance）
    if (klines.length === 0) {
      try {
        const response = await fetch(`/api/market/klines?symbol=${symbol}&interval=${interval}&limit=${limit}&source=auto`, {
          cache: 'no-store',
          signal: AbortSignal.timeout(10000)
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.klines && data.klines.length > 0) {
            klines = data.klines
            console.log(`[KlineDataSource] 从代理 API 获取 ${klines.length} 条数据`)
          }
        }
      } catch (error) {
        console.log('[KlineDataSource] 代理 API 调用失败:', error)
      }
    }
  }
  // Forex, Oil: 使用服务端代理 API（避免 CORS）
  else if (category === 'forex' || category === 'energy') {
    try {
      // 通过服务端 API 代理调用数据源
      const response = await fetch(`/api/market/klines?symbol=${symbol}&interval=${interval}&limit=${limit}&source=auto`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(10000)  // 10秒超时
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.klines && data.klines.length > 0) {
          klines = data.klines
          console.log(`[KlineDataSource] 从代理 API 获取 ${klines.length} 条数据`)
        }
      }
    } catch (error) {
      console.log('[KlineDataSource] 代理 API 调用失败:', error)
    }
  }

  // 如果获取成功，缓存并返回真实数据
  if (klines.length > 0) {
    console.log(`[KlineDataSource] 成功获取 ${klines.length} 条真实数据`)
    setCachedData(symbol, interval, limit, klines)
    return klines
  }

  // ❌ 金融系统不应该自动生成模拟行情
  // 正确做法：尝试使用缓存数据（即使过期）
  console.log(`[KlineDataSource] 所有数据源失败，尝试使用缓存数据`)

  // 尝试获取缓存数据（不检查过期时间）
  const cacheKey = `${symbol}_${interval}_${limit}`
  const cachedData = klineCache.get(cacheKey)

  if (cachedData && cachedData.data.length > 0) {
    console.log(`[KlineDataSource] 使用过期的缓存数据（${cachedData.data.length} 条）`)
    return cachedData.data
  }

  // 如果连缓存都没有，返回空数组（前端显示"数据加载失败"）
  console.log(`[KlineDataSource] 无可用数据，返回空数组`)
  return []
}
