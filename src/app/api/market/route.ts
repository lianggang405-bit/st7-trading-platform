import { NextResponse } from 'next/server';
import { fetchMarketData, MarketSymbol } from '@/lib/market/market-aggregator';

// ✅ 禁用 Next.js API 缓存，确保实时价格更新
export const dynamic = 'force-dynamic';

/**
 * 统一行情 API
 * 
 * 数据流：
 * - Crypto → Binance API（真实数据）
 * - Metal → Gold API（真实数据）
 * - Forex/Energy/Index → 模拟数据
 * 
 * 所有数据统一从此 API 获取，确保价格一致性
 */
export async function GET() {
  try {
    const symbols = await fetchMarketData();

    return NextResponse.json({
      success: true,
      symbols,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('[Market API] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch market data',
      symbols: [],
      timestamp: Date.now(),
    }, { status: 500 });
  }
}
