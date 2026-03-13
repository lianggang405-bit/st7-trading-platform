import { NextRequest, NextResponse } from 'next/server';
import { getMarket } from '@/lib/marketEngine';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * GET /api/market/data
 * 获取市场行情数据
 *
 * Query 参数:
 * - symbols: 交易对列表（逗号分隔），如 BTCUSD,ETHUSD
 * - useRealData: 是否使用真实数据（可选，默认 true）
 * - withTicker: 是否包含 24 小时涨跌幅（可选，默认 false）
 */

/**
 * 调控机器人缓存
 */
const botCache = new Map<string, { floatValue: number; timestamp: number }>();
const BOT_CACHE_TTL = 60000; // 1分钟缓存

/**
 * 获取交易对的调控机器人浮点值
 */
async function getBotFloatValue(symbol: string): Promise<number> {
  // 先检查缓存
  const cached = botCache.get(symbol);
  if (cached && Date.now() - cached.timestamp < BOT_CACHE_TTL) {
    return cached.floatValue;
  }

  try {
    const supabase = getSupabaseClient();

    // 1. 先获取交易对ID
    const { data: pairData, error: pairError } = await supabase
      .from('trading_pairs')
      .select('id')
      .eq('symbol', symbol)
      .single();

    if (pairError || !pairData) {
      console.log(`[MarketData] No trading pair found for ${symbol}`);
      botCache.set(symbol, { floatValue: 0, timestamp: Date.now() });
      return 0;
    }

    // 2. 再获取该交易对的调控机器人
    const { data: botData, error: botError } = await supabase
      .from('trading_bots')
      .select('float_value')
      .eq('pair_id', pairData.id)
      .single();

    if (botError || !botData) {
      console.log(`[MarketData] No trading bot found for pair ${pairData.id} (${symbol})`);
      botCache.set(symbol, { floatValue: 0, timestamp: Date.now() });
      return 0;
    }

    const floatValue = botData.float_value || 0;
    console.log(`[MarketData] Applied bot adjustment for ${symbol}: ${floatValue}`);

    // 更新缓存
    botCache.set(symbol, { floatValue, timestamp: Date.now() });
    return floatValue;
  } catch (error) {
    console.warn(`[MarketData] Error fetching bot for ${symbol}:`, error);
    return 0;
  }
}

/**
 * 应用调控机器人浮点值到价格
 */
function applyBotAdjustment(price: number, floatValue: number): number {
  // 核心公式：调控后价格 = 真实价格 + 浮点值
  return price + floatValue;
}
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbolsParam = searchParams.get('symbols');
    const withTicker = searchParams.get('withTicker') === 'true';

    if (!symbolsParam) {
      return NextResponse.json(
        { error: 'Missing required parameter: symbols' },
        { status: 400 }
      );
    }

    const symbols = symbolsParam.split(',').map(s => s.trim());
    const result: { [symbol: string]: { price: number; change?: number; high?: number; low?: number } } = {};

    // 从市场引擎获取最新数据
    const marketData = getMarket();

    console.log(`[MarketData] Fetching market data for ${symbols.length} symbols...`);

    for (const symbol of symbols) {
      const data = marketData[symbol];

      if (data) {
        // ✅ 应用调控机器人浮点值
        const floatValue = await getBotFloatValue(symbol);
        const adjustedPrice = applyBotAdjustment(data.price, floatValue);

        result[symbol] = {
          price: adjustedPrice,
        };

        // 如果需要 24 小时涨跌幅，计算基于 basePrice 的百分比变化
        if (withTicker) {
          const changePercent = ((data.price - data.basePrice) / data.basePrice) * 100;
          result[symbol].change = Number(changePercent.toFixed(2));
        }
      } else {
        console.log(`[MarketData] No data found for ${symbol}, skipping...`);
      }
    }

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('[MarketData] Error fetching market data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market data' },
      { status: 500 }
    );
  }
}
