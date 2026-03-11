import { NextResponse } from 'next/server'

/**
 * 黄金实时价格代理 API
 *
 * 通过服务器代理访问 https://api.gold-api.com
 * 避免 CORS 问题
 *
 * GET /api/gold-price?symbol=XAU
 * GET /api/gold-price?symbol=XAG
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbol = (searchParams.get('symbol') || 'XAU').toUpperCase()

  console.log(`[Gold Price Proxy] 获取 ${symbol} 实时价格...`)

  try {
    // 调用黄金 API
    const url = `https://api.gold-api.com/price/${symbol}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),  // 5秒超时
    })

    if (!response.ok) {
      console.error(`[Gold Price Proxy] API 请求失败: ${response.status}`)
      return NextResponse.json({
        success: false,
        error: 'API 请求失败',
        symbol,
      }, { status: 500 })
    }

    const data = await response.json()
    console.log(`[Gold Price Proxy] 成功获取价格: ${symbol} = ${data.price}`)

    // 返回数据
    return NextResponse.json({
      success: true,
      symbol: data.symbol,
      price: data.price,
      name: data.name,
      updatedAt: data.updatedAt,
      updatedAtReadable: data.updatedAtReadable,
    })

  } catch (error) {
    console.error('[Gold Price Proxy] 请求失败:', error)
    return NextResponse.json({
      success: false,
      error: '服务器内部错误',
      symbol,
    }, { status: 500 })
  }
}
