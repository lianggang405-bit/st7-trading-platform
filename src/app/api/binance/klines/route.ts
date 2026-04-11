import { NextResponse } from 'next/server'

const BINANCE_API = 'https://api.binance.com'

// 生成模拟 K 线数据
function generateMockKlines(symbol: string, interval: string, limit: number) {
  const now = Math.floor(Date.now() / 1000)
  const intervalSeconds = interval === '1' ? 60 : interval === '5' ? 300 :
    interval === '15' ? 900 : interval === '30' ? 1800 :
    interval === '60' || interval === '1h' ? 3600 :
    interval === '240' || interval === '4h' ? 14400 :
    interval === '1d' || interval === '1D' ? 86400 : 3600
  
  const basePrice = symbol.includes('BTC') ? 65000 :
    symbol.includes('ETH') ? 3500 :
    symbol.includes('XAU') ? 2350 : 100
  
  const currentCandleTime = Math.floor(now / intervalSeconds) * intervalSeconds
  const klines = []
  
  for (let i = limit - 1; i >= 0; i--) {
    const time = currentCandleTime - i * intervalSeconds
    const volatility = basePrice * 0.02
    const trend = Math.sin(i / 20) * volatility
    const open = basePrice + trend + (Math.random() - 0.5) * volatility
    const close = open + (Math.random() - 0.5) * volatility
    const high = Math.max(open, close) + Math.random() * volatility * 0.5
    const low = Math.min(open, close) - Math.random() * volatility * 0.5
    
    klines.push({
      time,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: parseFloat((Math.random() * 1000).toFixed(2)),
    })
  }
  
  return klines
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol') || 'BTCUSDT'
  const interval = searchParams.get('interval') || '1h'
  const limit = parseInt(searchParams.get('limit') || '200', 10)

  try {
    const url = `${BINANCE_API}/api/v3/klines?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=${limit}`
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(5000), // 5秒超时
    })

    if (response.ok) {
      const data = await response.json()

      // 格式化 K 线数据
      const klines = data.map((k: any[]) => ({
        time: Math.floor(k[0] / 1000),
        open: parseFloat(k[1]),
        high: parseFloat(k[2]),
        low: parseFloat(k[3]),
        close: parseFloat(k[4]),
        volume: parseFloat(k[5]),
      }))

      return NextResponse.json({
        success: true,
        symbol: symbol.toUpperCase(),
        interval,
        data: klines,
      })
    }
    
    // API 失败，使用模拟数据
    throw new Error(`Binance API error: ${response.status}`)
    
  } catch (error) {
    console.warn('[Binance Proxy] Using mock data:', error)
    
    // 返回模拟数据
    const mockData = generateMockKlines(symbol, interval, limit)
    
    return NextResponse.json({
      success: true,
      symbol: symbol.toUpperCase(),
      interval,
      data: mockData,
      mock: true, // 标记为模拟数据
    })
  }
}
