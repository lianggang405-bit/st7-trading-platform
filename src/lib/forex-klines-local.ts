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

  // 使用当前价格作为起点
  let currentPrice = symbolData.price
  let basePrice = symbolData.basePrice
  const volatility = symbolData.volatility
  const trend = symbolData.trend
  const trendStrength = symbolData.trendStrength

  for (let i = 0; i < limit; i++) {
    const time = endTime - ((limit - 1 - i) * intervalSeconds)

    // 计算价格变化（包含随机波动和趋势）
    const randomChange = (Math.random() - 0.5) * volatility * 2
    const trendChange = trend === 'up' 
      ? volatility * trendStrength * 0.5 
      : trend === 'down' 
        ? -volatility * trendStrength * 0.5 
        : 0

    // 均值回归（防止偏离 basePrice 太远）
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

    // 确定小数位数
    const decimals = basePrice < 1 ? 5 : 2

    klines.push({
      time,
      open: Number(open.toFixed(decimals)),
      high: Number(high.toFixed(decimals)),
      low: Number(low.toFixed(decimals)),
      close: Number(close.toFixed(decimals)),
      volume: Math.floor(Math.random() * 100000 + 50000),
    })

    currentPrice = close
  }

  console.log(`[ForexKlines] 生成 ${klines.length} 条K线数据，${symbol} basePrice: ${basePrice}, volatility: ${volatility}`)

  return klines
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
