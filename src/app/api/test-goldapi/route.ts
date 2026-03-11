import { NextResponse } from 'next/server'
import { getRealPreciousMetalPrice, fetchGoldAPIKlines } from '@/lib/real-precious-metals'

export async function GET() {
  const results = {
    currentPrice: null as any,
    historicalKlines: null as any,
    parsing: {
      timestamp: '毫秒 -> 秒转换',
      fields: {
        currentPrice: '直接使用 price 字段 (Troy Ounce 价格)',
        historical: '尝试 open, high, low, close 或 price 字段'
      }
    }
  }

  // 测试 1: 获取当前价格
  console.log('🧪 测试 GoldAPI 当前价格...')
  results.currentPrice = await getRealPreciousMetalPrice('XAUUSD')

  // 测试 2: 获取历史K线数据
  console.log('🧪 测试 GoldAPI 历史K线数据...')
  results.historicalKlines = await fetchGoldAPIKlines('XAUUSD', '1h', 10)

  // 输出解析后的数据格式
  console.log('✅ 测试结果:')
  console.log('- 当前价格:', results.currentPrice)
  console.log('- 历史K线数量:', results.historicalKlines?.length || 0)

  if (results.historicalKlines && results.historicalKlines.length > 0) {
    console.log('- 第一根K线:', results.historicalKlines[0])
    console.log('- 最后一根K线:', results.historicalKlines[results.historicalKlines.length - 1])

    // 验证数据有效性
    const lastKline = results.historicalKlines[results.historicalKlines.length - 1]
    const isValid = lastKline.high >= Math.max(lastKline.open, lastKline.close) &&
                   lastKline.low <= Math.min(lastKline.open, lastKline.close)
    console.log('- 数据有效性检查:', isValid ? '✅ 通过' : '❌ 失败')
  }

  return NextResponse.json({
    success: true,
    results,
    timestamp: Date.now()
  })
}
