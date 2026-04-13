/**
 * 两层价格系统
 *
 * 真实行情层（每6-12小时更新一次）
 *         ↓
 * 模拟行情层（每秒更新）
 *         ↓
 * Tick Stream（实时价格流）
 *         ↓
 * Kline Aggregator（K线聚合器）
 */

import { klineAggregator, Tick } from './kline-aggregator'

export type SymbolData = {
  symbol: string
  basePrice: number      // 真实基准价格（定期从API更新）
  price: number          // 当前模拟价格（围绕 basePrice 波动）
  volatility: number     // 波动率（每个交易对独立）
  trend: 'up' | 'down' | 'neutral'  // 随机趋势（上涨/下跌/横盘）
  trendStrength: number  // 趋势强度（0-1）
  lastBaseUpdate: number // 上次更新 basePrice 的时间戳
  updateInterval: number // 更新间隔（毫秒）
  category: 'crypto' | 'metal' | 'forex' | 'energy' | 'cfd'
}

// 所有交易对的初始数据
// 注意：这些是默认价格，系统会定期从外部 API 更新为真实价格
const symbols: Record<string, SymbolData> = {
  // 加密货币（大波动，3小时更新）
  BTCUSDT: { symbol: "BTCUSDT", basePrice: 97000, price: 97000, volatility: 0.002, trend: 'neutral', trendStrength: 0.5, lastBaseUpdate: 0, updateInterval: 3 * 60 * 60 * 1000, category: 'crypto' },
  ETHUSDT: { symbol: "ETHUSDT", basePrice: 3500, price: 3500, volatility: 0.002, trend: 'neutral', trendStrength: 0.5, lastBaseUpdate: 0, updateInterval: 3 * 60 * 60 * 1000, category: 'crypto' },
  LTCUSDT: { symbol: "LTCUSDT", basePrice: 150, price: 150, volatility: 0.0025, trend: 'neutral', trendStrength: 0.5, lastBaseUpdate: 0, updateInterval: 3 * 60 * 60 * 1000, category: 'crypto' },
  SOLUSDT: { symbol: "SOLUSDT", basePrice: 200, price: 200, volatility: 0.003, trend: 'neutral', trendStrength: 0.5, lastBaseUpdate: 0, updateInterval: 3 * 60 * 60 * 1000, category: 'crypto' },
  XRPUSDT: { symbol: "XRPUSDT", basePrice: 0.6, price: 0.6, volatility: 0.003, trend: 'neutral', trendStrength: 0.5, lastBaseUpdate: 0, updateInterval: 3 * 60 * 60 * 1000, category: 'crypto' },
  DOGEUSDT: { symbol: "DOGEUSDT", basePrice: 0.2, price: 0.2, volatility: 0.004, trend: 'neutral', trendStrength: 0.5, lastBaseUpdate: 0, updateInterval: 3 * 60 * 60 * 1000, category: 'crypto' },
  ADAUSDT: { symbol: "ADAUSDT", basePrice: 1.2, price: 1.2, volatility: 0.003, trend: 'neutral', trendStrength: 0.5, lastBaseUpdate: 0, updateInterval: 3 * 60 * 60 * 1000, category: 'crypto' },
  DOTUSDT: { symbol: "DOTUSDT", basePrice: 8, price: 8, volatility: 0.003, trend: 'neutral', trendStrength: 0.5, lastBaseUpdate: 0, updateInterval: 3 * 60 * 60 * 1000, category: 'crypto' },

  // 贵金属（中等波动，6小时更新）- 使用 GoldAPI.io 获取真实价格
  XAUUSD: { symbol: "XAUUSD", basePrice: 4749, price: 4749, volatility: 0.0008, trend: 'neutral', trendStrength: 0.5, lastBaseUpdate: 0, updateInterval: 6 * 60 * 60 * 1000, category: 'metal' },
  XAGUSD: { symbol: "XAGUSD", basePrice: 29.5, price: 29.5, volatility: 0.0015, trend: 'neutral', trendStrength: 0.5, lastBaseUpdate: 0, updateInterval: 6 * 60 * 60 * 1000, category: 'metal' },

  // 外汇（小波动，12小时更新）
  EURUSD: { symbol: "EURUSD", basePrice: 1.085, price: 1.085, volatility: 0.0002, trend: 'neutral', trendStrength: 0.5, lastBaseUpdate: 0, updateInterval: 12 * 60 * 60 * 1000, category: 'forex' },
  GBPUSD: { symbol: "GBPUSD", basePrice: 1.265, price: 1.265, volatility: 0.0003, trend: 'neutral', trendStrength: 0.5, lastBaseUpdate: 0, updateInterval: 12 * 60 * 60 * 1000, category: 'forex' },
  USDJPY: { symbol: "USDJPY", basePrice: 149.8, price: 149.8, volatility: 0.0003, trend: 'neutral', trendStrength: 0.5, lastBaseUpdate: 0, updateInterval: 12 * 60 * 60 * 1000, category: 'forex' },
  USDCHF: { symbol: "USDCHF", basePrice: 0.884, price: 0.884, volatility: 0.00025, trend: 'neutral', trendStrength: 0.5, lastBaseUpdate: 0, updateInterval: 12 * 60 * 60 * 1000, category: 'forex' },
  AUDUSD: { symbol: "AUDUSD", basePrice: 0.655, price: 0.655, volatility: 0.00025, trend: 'neutral', trendStrength: 0.5, lastBaseUpdate: 0, updateInterval: 12 * 60 * 60 * 1000, category: 'forex' },
  NZDUSD: { symbol: "NZDUSD", basePrice: 0.609, price: 0.609, volatility: 0.00025, trend: 'neutral', trendStrength: 0.5, lastBaseUpdate: 0, updateInterval: 12 * 60 * 60 * 1000, category: 'forex' },
  USDCAD: { symbol: "USDCAD", basePrice: 1.366, price: 1.366, volatility: 0.00025, trend: 'neutral', trendStrength: 0.5, lastBaseUpdate: 0, updateInterval: 12 * 60 * 60 * 1000, category: 'forex' },
  EURGBP: { symbol: "EURGBP", basePrice: 0.859, price: 0.859, volatility: 0.0002, trend: 'neutral', trendStrength: 0.5, lastBaseUpdate: 0, updateInterval: 12 * 60 * 60 * 1000, category: 'forex' },
  EURJPY: { symbol: "EURJPY", basePrice: 162.5, price: 162.5, volatility: 0.00025, trend: 'neutral', trendStrength: 0.5, lastBaseUpdate: 0, updateInterval: 12 * 60 * 60 * 1000, category: 'forex' },
  GBPJPY: { symbol: "GBPJPY", basePrice: 189.5, price: 189.5, volatility: 0.0003, trend: 'neutral', trendStrength: 0.5, lastBaseUpdate: 0, updateInterval: 12 * 60 * 60 * 1000, category: 'forex' },
  AUDJPY: { symbol: "AUDJPY", basePrice: 98.2, price: 98.2, volatility: 0.0003, trend: 'neutral', trendStrength: 0.5, lastBaseUpdate: 0, updateInterval: 12 * 60 * 60 * 1000, category: 'forex' },
  CADJPY: { symbol: "CADJPY", basePrice: 110.5, price: 110.5, volatility: 0.0003, trend: 'neutral', trendStrength: 0.5, lastBaseUpdate: 0, updateInterval: 12 * 60 * 60 * 1000, category: 'forex' },
  CHFJPY: { symbol: "CHFJPY", basePrice: 169.5, price: 169.5, volatility: 0.0003, trend: 'neutral', trendStrength: 0.5, lastBaseUpdate: 0, updateInterval: 12 * 60 * 60 * 1000, category: 'forex' },

  // 能源（中等波动，6小时更新）
  USOIL: { symbol: "USOIL", basePrice: 85, price: 85, volatility: 0.001, trend: 'neutral', trendStrength: 0.5, lastBaseUpdate: 0, updateInterval: 6 * 60 * 60 * 1000, category: 'energy' },
  UKOIL: { symbol: "UKOIL", basePrice: 87.8, price: 87.8, volatility: 0.001, trend: 'neutral', trendStrength: 0.5, lastBaseUpdate: 0, updateInterval: 6 * 60 * 60 * 1000, category: 'energy' },
  NGAS: { symbol: "NGAS", basePrice: 2.8, price: 2.8, volatility: 0.002, trend: 'neutral', trendStrength: 0.5, lastBaseUpdate: 0, updateInterval: 6 * 60 * 60 * 1000, category: 'energy' },

  // 指数（小波动，12小时更新）
  US500: { symbol: "US500", basePrice: 5200, price: 5200, volatility: 0.0003, trend: 'neutral', trendStrength: 0.5, lastBaseUpdate: 0, updateInterval: 12 * 60 * 60 * 1000, category: 'cfd' },
  ND100: { symbol: "ND100", basePrice: 18500, price: 18500, volatility: 0.0004, trend: 'neutral', trendStrength: 0.5, lastBaseUpdate: 0, updateInterval: 12 * 60 * 60 * 1000, category: 'cfd' },
  AUS200: { symbol: "AUS200", basePrice: 7807, price: 7807, volatility: 0.0004, trend: 'neutral', trendStrength: 0.5, lastBaseUpdate: 0, updateInterval: 12 * 60 * 60 * 1000, category: 'cfd' },
  UK100: { symbol: "UK100", basePrice: 8098, price: 8098, volatility: 0.0004, trend: 'neutral', trendStrength: 0.5, lastBaseUpdate: 0, updateInterval: 12 * 60 * 60 * 1000, category: 'cfd' },
  GER40: { symbol: "GER40", basePrice: 17814, price: 17814, volatility: 0.0004, trend: 'neutral', trendStrength: 0.5, lastBaseUpdate: 0, updateInterval: 12 * 60 * 60 * 1000, category: 'cfd' },
  JPN225: { symbol: "JPN225", basePrice: 40034, price: 40034, volatility: 0.0005, trend: 'neutral', trendStrength: 0.5, lastBaseUpdate: 0, updateInterval: 12 * 60 * 60 * 1000, category: 'cfd' },
}

/**
 * 初始化随机趋势
 * 每个交易对随机分配一个趋势（上涨/下跌/横盘）
 */
function initTrends() {
  Object.values(symbols).forEach((s) => {
    const rand = Math.random()
    if (rand < 0.33) {
      s.trend = 'up'
      s.trendStrength = 0.3 + Math.random() * 0.3  // 0.3-0.6
    } else if (rand < 0.66) {
      s.trend = 'down'
      s.trendStrength = 0.3 + Math.random() * 0.3
    } else {
      s.trend = 'neutral'
      s.trendStrength = 0.1 + Math.random() * 0.2  // 0.1-0.3
    }
  })
}

/**
 * 定期更新趋势
 * 每小时有 10% 概率改变趋势
 */
function updateTrends() {
  Object.values(symbols).forEach((s) => {
    if (Math.random() < 0.1) {  // 10% 概率改变趋势
      const rand = Math.random()
      if (rand < 0.33) {
        s.trend = 'up'
        s.trendStrength = 0.3 + Math.random() * 0.3
      } else if (rand < 0.66) {
        s.trend = 'down'
        s.trendStrength = 0.3 + Math.random() * 0.3
      } else {
        s.trend = 'neutral'
        s.trendStrength = 0.1 + Math.random() * 0.2
      }
    }
  })
}

/**
 * 获取真实价格（带超时保护）
 * 从外部 API 获取最新真实价格
 * 优先级：
 * 1. GoldAPI.io - 贵金属（XAUUSD, XAGUSD）
 * 2. Binance - 加密货币
 * 3. Yahoo Finance - 备用
 */

// GoldAPI.io API Key
const GOLDAPI_KEY = 'goldapi-445bbsmmle9lsi-io'

/**
 * 从 GoldAPI.io 获取贵金属价格
 */
async function fetchFromGoldAPI(symbol: string): Promise<number | null> {
  try {
    // 符号映射：XAUUSD -> XAU, XAGUSD -> XAG
    const metalSymbol = symbol.replace('USD', '')
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    try {
      const res = await fetch(`https://www.goldapi.io/api/${metalSymbol}/USD`, {
        headers: {
          'x-access-token': GOLDAPI_KEY,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      })

      if (!res.ok) {
        console.warn(`[GoldAPI] ${symbol} failed: ${res.status}`)
        return null
      }

      const data = await res.json()
      return data.price
    } finally {
      clearTimeout(timeoutId)
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.warn(`[GoldAPI] ${symbol} timeout`)
    } else {
      console.warn(`[GoldAPI] ${symbol} failed:`, error.message)
    }
    return null
  }
}

/**
 * 从 Binance 获取加密货币价格
 */
async function fetchFromBinance(symbol: string): Promise<number | null> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    try {
      const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`, {
        signal: controller.signal
      })

      if (!res.ok) {
        return null
      }

      const data = await res.json()
      return parseFloat(data.price)
    } finally {
      clearTimeout(timeoutId)
    }
  } catch (error) {
    return null
  }
}

/**
 * 获取真实价格
 */
async function fetchRealPrice(symbol: string): Promise<number | null> {
  // 贵金属 - 使用 GoldAPI.io
  if (symbol === 'XAUUSD' || symbol === 'XAGUSD') {
    return await fetchFromGoldAPI(symbol)
  }

  // 加密货币 - 使用 Binance
  const cryptoSymbols = ['BTCUSDT', 'ETHUSDT', 'LTCUSDT', 'SOLUSDT', 'XRPUSDT', 'DOGEUSDT', 'ADAUSDT', 'DOTUSDT']
  if (cryptoSymbols.includes(symbol)) {
    return await fetchFromBinance(symbol)
  }

  // 其他交易对暂时使用模拟价格
  return null
}

/**
 * 平滑调整 basePrice
 * 防止跳空，每次只调整差距的 20%
 */
function adjustBasePrice(data: SymbolData, realPrice: number) {
  const diff = realPrice - data.basePrice
  data.basePrice += diff * 0.2  // 每次调整 20%
}

/**
 * 检查并更新真实价格
 * 定期检查是否需要更新 basePrice
 */
async function checkAndUpdateRealPrice(symbol: string) {
  const data = symbols[symbol]
  if (!data) return

  const now = Date.now()
  if (now - data.lastBaseUpdate > data.updateInterval) {
    // 时间到了，获取真实价格
    const realPrice = await fetchRealPrice(symbol)
    if (realPrice !== null) {
      // 平滑调整，避免跳空
      adjustBasePrice(data, realPrice)
      data.lastBaseUpdate = now
      console.log(`Updated ${symbol} basePrice to ${data.basePrice.toFixed(2)} (real: ${realPrice.toFixed(2)})`)
    }
  }
}

/**
 * 检查并更新真实价格
 * 应该定期调用（例如每分钟）
 */
export async function updateRealPrices() {
  const promises = Object.keys(symbols).map(symbol => checkAndUpdateRealPrice(symbol))
  await Promise.allSettled(promises)
}

/**
 * 获取当前市场数据
 */
export function getMarket(): Record<string, SymbolData> {
  return symbols
}

/**
 * 获取单个交易对价格
 */
export function getSymbolPrice(symbol: string): number | undefined {
  return symbols[symbol]?.price
}

/**
 * 获取单个交易对数据
 */
export function getSymbolData(symbol: string): SymbolData | undefined {
  return symbols[symbol]
}

// 初始化趋势
initTrends()

// 启动定时更新真实价格（每分钟检查一次）
let updateInterval: NodeJS.Timeout | null = null

export function startRealPriceUpdater() {
  if (updateInterval) {
    console.log('Real price updater already running')
    return
  }

  console.log('Starting real price updater...')

  // 立即执行一次
  updateRealPrices()

  // 每分钟检查一次是否需要更新
  updateInterval = setInterval(() => {
    updateRealPrices()
  }, 60 * 1000)  // 1 分钟

  console.log('Real price updater started (checking every minute)')
}

export function stopRealPriceUpdater() {
  if (updateInterval) {
    clearInterval(updateInterval)
    updateInterval = null
    console.log('Real price updater stopped')
  }
}

// 自动启动
if (typeof window === 'undefined') {
  // 只在服务端启动
  startRealPriceUpdater()
}

// 🎯 Tick回调系统（交易所级）
// 当价格更新时，触发所有注册的回调函数
type TickCallback = (tick: Tick) => void
const tickCallbacks: Set<TickCallback> = new Set()

/**
 * 注册tick回调
 * @param callback 回调函数
 */
export function onTick(callback: TickCallback): () => void {
  tickCallbacks.add(callback)

  // 返回取消订阅函数
  return () => {
    tickCallbacks.delete(callback)
  }
}

/**
 * 触发tick回调（内部使用）
 */
function emitTick(symbol: string, price: number, timestamp: number): void {
  const tick: Tick = { symbol, price, timestamp }

  // 触发所有回调
  tickCallbacks.forEach(callback => {
    try {
      callback(tick)
    } catch (error) {
      console.error('Error in tick callback:', error)
    }
  })

  // 🎯 自动更新K线聚合器
  klineAggregator.processTick(symbol, price, timestamp)
}

/**
 * 更新所有交易对价格（增强版）
 * 每秒调用一次，同时触发tick回调
 */
export function updateMarket(): Record<string, SymbolData> {
  // 更新趋势（每小时有概率改变）
  if (Math.random() < 0.0003) {  // 每秒有 0.03% 概率（约每小时）
    updateTrends()
  }

  // 更新所有价格
  const timestamp = Date.now()
  Object.values(symbols).forEach((s) => {
    const oldPrice = s.price
    s.price = nextPrice(s)

    // 🎯 只在价格变化时触发tick（优化性能）
    if (s.price !== oldPrice) {
      emitTick(s.symbol, s.price, timestamp)
    }
  })

  return symbols
}

/**
 * 计算下一个价格（高精度版本）
 * 确保每次调用都有可见的价格变化
 */
function nextPrice(data: SymbolData): number {
  // 根据价格基准值确定显示精度
  // 外汇（如 EURUSD）：5位小数
  // 贵金属（如 XAUUSD）：2位小数
  // 加密货币（如 BTCUSD）：2位小数
  const decimals = data.basePrice >= 1 ? 5 : 4

  // 基础波动
  const baseVolatility = data.basePrice * data.volatility
  const randomChange = (Math.random() - 0.5) * baseVolatility * 2  // 扩大波动范围

  // 趋势影响
  let trendChange = 0
  if (data.trend === 'up') {
    trendChange = baseVolatility * data.trendStrength * 0.3
  } else if (data.trend === 'down') {
    trendChange = -baseVolatility * data.trendStrength * 0.3
  }

  // 计算新价格
  let newPrice = data.price + randomChange + trendChange

  // 最大跳动限制
  const maxStep = baseVolatility * 0.5
  const priceDiff = newPrice - data.price
  if (Math.abs(priceDiff) > maxStep) {
    newPrice = data.price + Math.sign(priceDiff) * maxStep
  }

  // 限制范围（basePrice 的 97%-103%）
  const maxPrice = data.basePrice * 1.03
  const minPrice = data.basePrice * 0.97

  if (newPrice > maxPrice) {
    newPrice = maxPrice
  } else if (newPrice < minPrice) {
    newPrice = minPrice
  }

  // 高精度返回，确保价格变化可见
  return Number(newPrice.toFixed(decimals))
}
