import { NextResponse } from 'next/server';
import { getAllSymbols, startMarketEngine } from '@/lib/market/market-engine-simple';

// ✅ 禁用 Next.js API 缓存，确保实时价格更新
export const dynamic = 'force-dynamic';

/**
 * 统一行情 API（简化版）
 *
 * 数据流：
 * Market Engine (单一价格源)
 *      ↓
 *   marketStore
 *      ↓
 *  所有页面
 *
 * 核心原则：
 * - 只有一个价格生成器
 * - 每个交易对独立波动
 * - 1秒统一刷新
 */
export async function GET() {
  try {
    // 确保行情系统已启动
    startMarketEngine()

    // 获取所有交易对数据
    const symbols = getAllSymbols()

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
