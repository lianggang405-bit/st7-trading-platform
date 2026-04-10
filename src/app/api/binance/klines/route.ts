import { NextResponse } from 'next/server'

const BINANCE_API = 'https://api.binance.com'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')
  const interval = searchParams.get('interval') || '1h'
  const limit = searchParams.get('limit') || '200'

  if (!symbol) {
    return NextResponse.json({ error: 'Missing symbol parameter' }, { status: 400 })
  }

  try {
    const url = `${BINANCE_API}/api/v3/klines?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=${limit}`
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`)
    }

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

  } catch (error) {
    console.error('[Binance Proxy] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch from Binance', details: String(error) },
      { status: 500 }
    )
  }
}
