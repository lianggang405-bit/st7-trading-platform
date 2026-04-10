import { NextRequest, NextResponse } from 'next/server';
import { getMarket } from '@/lib/marketEngine';

/**
 * GET /api/market/data
 * 获取市场行情数据（优化版：无数据库依赖，快速响应）
 *
 * Query 参数:
 * - symbols: 交易对列表（逗号分隔），如 BTCUSD,ETHUSD
 * - withTicker: 是否包含 24 小时涨跌幅（可选，默认 false）
 */

/**
 * 调控机器人缓存（已禁用，减少数据库依赖）
 */
const botCache = new Map<string, { floatValue: number; timestamp: number }>();
const BOT_CACHE_TTL = 60000; // 1分钟缓存

/**
 * 获取交易对的调控机器人浮点值（带超时保护）
 * 如果数据库不可用，返回0，不阻塞响应
 */
async function getBotFloatValue(symbol: string): Promise<number> {
  // 先检查缓存
  const cached = botCache.get(symbol);
  if (cached && Date.now() - cached.timestamp < BOT_CACHE_TTL) {
    return cached.floatValue;
  }

  try {
    // 使用 Promise.race 添加超时保护（3秒）
    const timeoutPromise = new Promise<'timeout'>((resolve) => {
      setTimeout(() => resolve('timeout'), 3000);
    });

    const supabasePromise = (async () => {
      const { getSupabaseClient } = await import('@/storage/database/supabase-client');
      const supabase = getSupabaseClient();

      // 1. 先获取交易对ID
      const { data: pairData, error: pairError } = await supabase
        .from('trading_pairs')
        .select('id')
        .eq('symbol', symbol)
        .single();

      if (pairError || !pairData) {
        return 0;
      }

      // 2. 再获取该交易对的调控机器人
      const { data: botData, error: botError } = await supabase
        .from('trading_bots')
        .select('float_value')
        .eq('pair_id', pairData.id)
        .single();

      if (botError || !botData) {
        return 0;
      }

      return botData.float_value || 0;
    })();

    const result = await Promise.race([supabasePromise, timeoutPromise]);

    if (result === 'timeout') {
      console.log(`[MarketData] Bot fetch timeout for ${symbol}, using cached value`);
      return cached?.floatValue || 0;
    }

    const floatValue = result as number;
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

    // 从市场引擎获取最新数据（同步快速）
    const marketData = getMarket();

    // 🎯 优化：并行获取所有交易对的调控值（带超时保护）
    const botPromises = symbols.map(symbol => getBotFloatValue(symbol));
    const botValues = await Promise.all(botPromises);

    for (let i = 0; i < symbols.length; i++) {
      const symbol = symbols[i];
      const data = marketData[symbol];
      const floatValue = botValues[i];

      if (data) {
        const adjustedPrice = applyBotAdjustment(data.price, floatValue);

        result[symbol] = {
          price: adjustedPrice,
        };

        if (withTicker) {
          const changePercent = ((data.price - data.basePrice) / data.basePrice) * 100;
          result[symbol].change = Number(changePercent.toFixed(2));
        }
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
