/**
 * 黄金价格实时数据 API
 * 数据源优先级：
 * 1. FreeGoldAPI.com - 免费，无需API Key，每日更新
 * 2. Yahoo Finance - 黄金期货 GC=F
 * 3. 备用参考价格
 */

import { NextResponse } from 'next/server'

interface GoldPriceResponse {
  success: boolean
  symbol: string
  price: number
  change: number
  changePercent: number
  timestamp: number
  source: string
  unit: string
}

// FreeGoldAPI 缓存（避免频繁请求）
let cachedGoldPrice: GoldPriceResponse | null = null
let lastFetchTime = 0
const CACHE_DURATION = 60 * 60 * 1000 // 1小时缓存

// 参考价格（备用）
const REFERENCE_PRICE = 4800

/**
 * 从 FreeGoldAPI 获取黄金价格
 */
async function fetchFromFreeGoldAPI(): Promise<GoldPriceResponse | null> {
  try {
    const response = await fetch('https://freegoldapi.com/data/latest.csv', {
      cache: 'no-store',
      signal: AbortSignal.timeout(10000)
    })

    if (!response.ok) {
      console.error('[GoldPrice] FreeGoldAPI CSV failed:', response.status)
      return null
    }

    const text = await response.text()
    const lines = text.trim().split('\n')
    
    if (lines.length < 2) {
      console.error('[GoldPrice] FreeGoldAPI: No data lines')
      return null
    }

    // 获取最后一行（最新数据）
    const lastLine = lines[lines.length - 1]
    const [date, priceStr, source] = lastLine.split(',')

    const price = parseFloat(priceStr)
    if (isNaN(price) || price <= 0) {
      console.error('[GoldPrice] FreeGoldAPI: Invalid price', priceStr)
      return null
    }

    // 计算与参考价格的对比
    const change = price - REFERENCE_PRICE
    const changePercent = (change / REFERENCE_PRICE) * 100

    console.log(`[GoldPrice] FreeGoldAPI: $${price} on ${date}`)

    return {
      success: true,
      symbol: 'XAUUSD',
      price,
      change,
      changePercent,
      timestamp: new Date(date).getTime(),
      source: source || 'freegoldapi',
      unit: 'USD/oz'
    }
  } catch (error) {
    console.error('[GoldPrice] FreeGoldAPI error:', error)
    return null
  }
}

/**
 * 从 Yahoo Finance 获取黄金期货价格
 */
async function fetchFromYahooFinance(): Promise<GoldPriceResponse | null> {
  try {
    const response = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/GC%3DF?interval=1d&range=2d',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        cache: 'no-store',
        signal: AbortSignal.timeout(10000)
      }
    )

    if (!response.ok) {
      console.error('[GoldPrice] Yahoo Finance failed:', response.status)
      return null
    }

    const data = await response.json()
    const result = data?.chart?.result?.[0]

    if (!result) {
      console.error('[GoldPrice] Yahoo Finance: No result data')
      return null
    }

    const meta = result.meta
    const price = meta?.regularMarketPrice

    if (!price || price <= 0) {
      console.error('[GoldPrice] Yahoo Finance: Invalid price', price)
      return null
    }

    const prevClose = meta?.previousClose || meta?.chartPreviousClose || price
    const change = price - prevClose
    const changePercent = (change / prevClose) * 100

    console.log(`[GoldPrice] Yahoo Finance: $${price}`)

    return {
      success: true,
      symbol: 'XAUUSD',
      price,
      change,
      changePercent,
      timestamp: meta?.regularMarketTime ? new Date(meta.regularMarketTime * 1000).getTime() : Date.now(),
      source: 'yahoo_finance',
      unit: 'USD/oz'
    }
  } catch (error) {
    console.error('[GoldPrice] Yahoo Finance error:', error)
    return null
  }
}

/**
 * 获取模拟黄金价格（基于时间的小幅波动）
 */
function getSimulatedPrice(): GoldPriceResponse {
  const basePrice = 4800
  // 基于当前小时的小幅随机波动
  const hour = new Date().getHours()
  const variation = Math.sin(hour * 0.5) * 50 + (Math.random() - 0.5) * 20
  const price = basePrice + variation
  const change = price - REFERENCE_PRICE
  const changePercent = (change / REFERENCE_PRICE) * 100

  return {
    success: true,
    symbol: 'XAUUSD',
    price: Math.round(price * 100) / 100,
    change: Math.round(change * 100) / 100,
    changePercent: Math.round(changePercent * 100) / 100,
    timestamp: Date.now(),
    source: 'simulated',
    unit: 'USD/oz'
  }
}

/**
 * GET /api/gold-price-realtime
 * 获取实时黄金价格
 */
export async function GET() {
  // 检查缓存
  const now = Date.now()
  if (cachedGoldPrice && (now - lastFetchTime) < CACHE_DURATION) {
    console.log('[GoldPrice] 返回缓存价格: $' + cachedGoldPrice.price)
    return NextResponse.json(cachedGoldPrice)
  }

  // 尝试 FreeGoldAPI（免费，无需 API Key）
  let result = await fetchFromFreeGoldAPI()

  // 如果失败，尝试 Yahoo Finance
  if (!result) {
    console.log('[GoldPrice] FreeGoldAPI 失败，尝试 Yahoo Finance...')
    result = await fetchFromYahooFinance()
  }

  // 如果都失败，使用模拟价格
  if (!result) {
    console.log('[GoldPrice] 使用模拟价格')
    result = getSimulatedPrice()
  }

  // 更新缓存
  cachedGoldPrice = result
  lastFetchTime = now

  return NextResponse.json(result)
}
