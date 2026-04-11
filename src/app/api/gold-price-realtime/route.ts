/**
 * 黄金价格实时数据 API
 * 数据源优先级：
 * 1. GoldAPI.io - 专业贵金属 API，需要 Key
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

// GoldAPI.io API Key
const GOLDAPI_KEY = 'goldapi-445bbsmmle9lsi-io'

// 缓存（避免频繁请求）
let cachedGoldPrice: GoldPriceResponse | null = null
let lastFetchTime = 0
const CACHE_DURATION = 60 * 1000 // 1分钟缓存（黄金价格变动较频繁）

// 参考价格（备用）
const REFERENCE_PRICE = 4800

/**
 * 从 GoldAPI.io 获取黄金价格（现货黄金）
 */
async function fetchFromGoldAPI(): Promise<GoldPriceResponse | null> {
  try {
    const response = await fetch('https://www.goldapi.io/api/XAU/USD', {
      method: 'GET',
      headers: {
        'x-access-token': GOLDAPI_KEY,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(10000)
    })

    if (!response.ok) {
      console.error('[GoldPrice] GoldAPI error:', response.status)
      return null
    }

    const data = await response.json()
    
    // GoldAPI 返回格式：
    // { "price": 5059.50, "ch": 10.5, "chp": 0.21, "timestamp": 1771545600, ... }
    const price = data.price
    const change = data.ch || 0
    const changePercent = data.chp || 0

    if (!price || price <= 0) {
      console.error('[GoldPrice] GoldAPI: Invalid price', price)
      return null
    }

    console.log(`[GoldPrice] GoldAPI: $${price}`)

    return {
      success: true,
      symbol: 'XAUUSD',
      price,
      change,
      changePercent,
      timestamp: data.timestamp ? data.timestamp * 1000 : Date.now(),
      source: 'goldapi',
      unit: 'USD/oz'
    }
  } catch (error) {
    console.error('[GoldPrice] GoldAPI error:', error)
    return null
  }
}

/**
 * 从 Yahoo Finance 获取黄金期货价格（备用）
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
  const basePrice = 5000
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
 * 获取实时黄金价格（现货黄金 XAU/USD）
 */
export async function GET() {
  // 检查缓存
  const now = Date.now()
  if (cachedGoldPrice && (now - lastFetchTime) < CACHE_DURATION) {
    console.log('[GoldPrice] 返回缓存价格: $' + cachedGoldPrice.price)
    return NextResponse.json(cachedGoldPrice)
  }

  // 尝试 GoldAPI.io（专业贵金属 API）
  let result = await fetchFromGoldAPI()

  // 如果失败，尝试 Yahoo Finance
  if (!result) {
    console.log('[GoldPrice] GoldAPI 失败，尝试 Yahoo Finance...')
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
