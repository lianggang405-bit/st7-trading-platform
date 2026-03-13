/**
 * 外汇K线数据源（本地数据）
 *
 * 使用市场引擎生成模拟K线数据
 */

import { getSymbolData, updateMarket } from '@/lib/marketEngine'

export interface KlineData {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

// K线缓存（防止每次重新生成导致跳崖）
const klineCache = new Map<string, { klines: KlineData[]; timestamp: number }>()
const CACHE_TTL = 5000 // 5秒缓存

/**
 * 生成外汇/原油K线数据
 * 使用市场引擎的数据生成K线
 */
export function generateForexKlines(
  symbol: string,
  interval: string,
  limit: number = 200
): KlineData[] {
  // 获取交易对数据
  const symbolData = getSymbolData(symbol)

  if (!symbolData) {
    console.warn(`[ForexKlines] No data found for ${symbol}, using default price`)
    return generateDefaultKlines(symbol, interval, limit)
  }

  // 检查缓存
  const cacheKey = `${symbol}-${interval}-${limit}`
  const cached = klineCache.get(cacheKey)
  const now = Date.now()

  if (cached && now - cached.timestamp < CACHE_TTL) {
    // 使用缓存的数据，只更新最后一根K线的 close 价格
    const klines = cached.klines.map((k, i) => {
      if (i === cached.klines.length - 1) {  // 修复：使用 cached.klines.length
        // 最后一根K线，更新 close 价格为实时价格
        return {
          ...k,
          close: symbolData.price,
          high: Math.max(k.high, symbolData.price),
          low: Math.min(k.low, symbolData.price),
        }
      }
      return k
    })
    return klines
  }

  // 缓存不存在或已过期，生成新的K线数据
  const klines = generateKlinesFromBasePrice(symbolData, interval, limit)

  // 更新缓存
  klineCache.set(cacheKey, {
    klines,
    timestamp: now,
  })

  return klines
}

/**
 * 从 basePrice 开始生成K线数据
 */
function generateKlinesFromBasePrice(
  symbolData: any,
  interval: string,
  limit: number = 200
): KlineData[] {
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

  // 从 basePrice 开始生成（而不是当前价格）
  let currentPrice = symbolData.basePrice
  let basePrice = symbolData.basePrice
  const volatility = symbolData.volatility
  const trend = symbolData.trend
  const trendStrength = symbolData.trendStrength

  // 使用固定的随机种子（基于 symbol 和 interval）
  const seed = hashCode(symbolData.symbol + interval)
  let randomIndex = 0

  for (let i = 0; i < limit; i++) {
    const time = endTime - ((limit - 1 - i) * intervalSeconds)

    // 使用伪随机数（基于种子，保证每次生成相同的历史数据）
    const randomValue = seededRandom(seed + randomIndex++)
    const randomChange = (randomValue - 0.5) * volatility * 0.8  // 减小波动幅度

    const trendChange = trend === 'up'
      ? volatility * trendStrength * 0.15  // 减小趋势影响
      : trend === 'down'
        ? -volatility * trendStrength * 0.15
        : 0

    // 均值回归（防止偏离 basePrice 太远）
    const meanReversion = (basePrice - currentPrice) / basePrice * 0.03  // 减小均值回归力度

    let priceChange = randomChange + trendChange + meanReversion

    // 限制单次价格变化幅度（更严格的限制）
    const maxChange = basePrice * volatility * 0.25  // 降低到 0.25
    if (Math.abs(priceChange * currentPrice) > maxChange) {
      priceChange = Math.sign(priceChange) * (maxChange / currentPrice)
    }

    const open = currentPrice
    const close = open * (1 + priceChange)

    // 生成高低点（使用相对较小的波动）
    const bodySize = Math.abs(close - open) / open
    const upperShadow = seededRandom(seed + randomIndex++) * bodySize * 0.8  // 减小上下影线
    const lowerShadow = seededRandom(seed + randomIndex++) * bodySize * 0.8

    const high = Math.max(open, close) * (1 + upperShadow)
    const low = Math.min(open, close) * (1 - lowerShadow)

    // 确定小数位数
    const decimals = basePrice < 1 ? 5 : 2

    klines.push({
      time,
      open: Number(open.toFixed(decimals)),
      high: Number(high.toFixed(decimals)),
      low: Number(low.toFixed(decimals)),
      close: Number(close.toFixed(decimals)),
      volume: Math.floor(seededRandom(seed + randomIndex++) * 100000 + 50000),
    })

    currentPrice = close
  }

  // 更新最后一根K线为当前实时价格
  if (klines.length > 0) {
    const lastKline = klines[klines.length - 1]
    lastKline.close = symbolData.price
    lastKline.high = Math.max(lastKline.high, symbolData.price)
    lastKline.low = Math.min(lastKline.low, symbolData.price)
  }

  console.log(`[ForexKlines] 生成 ${klines.length} 条K线数据，${symbolData.symbol} basePrice: ${basePrice}, volatility: ${volatility}`)

  return klines
}

/**
 * 字符串转哈希码（用于生成固定种子）
 */
function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

/**
 * 伪随机数生成器（基于种子，保证可复现）
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

/**
 * 生成默认K线数据（当交易对不存在时）
 */
function generateDefaultKlines(
  symbol: string,
  interval: string,
  limit: number = 200
): KlineData[] {
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

  let currentPrice = 1.0
  const volatility = 0.002

  for (let i = 0; i < limit; i++) {
    const time = endTime - ((limit - 1 - i) * intervalSeconds)

    const priceChange = (Math.random() - 0.5) * volatility * 2
    const open = currentPrice
    const close = open * (1 + priceChange)

    const bodySize = Math.abs(close - open) / open
    const upperShadow = Math.random() * bodySize * 2
    const lowerShadow = Math.random() * bodySize * 2

    const high = Math.max(open, close) * (1 + upperShadow)
    const low = Math.min(open, close) * (1 - lowerShadow)

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

  return klines
}
