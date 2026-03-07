import { NextRequest, NextResponse } from 'next/server';
import { getRandomTrend, getRandomChange, getRandomPrice } from '@/lib/market-generator';
import { getPriceFromBinance, getBatchPricesFromBinance, getPriceChangeFromBinance } from '@/lib/market-data-source';
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
 * 获取基准价格
 */
function getBasePrice(symbol: string): number {
  const basePrices: { [key: string]: number } = {
    BTCUSD: 95000,
    ETHUSD: 3400,
    SOLUSD: 240,
    XRPUSD: 2.5,
    BNBUSD: 680,
    DOGEUSD: 0.38,
    ADAUSD: 1.1,
    EURUSD: 1.0856,
    GBPUSD: 1.2654,
    USDJPY: 149.82,
    GOLDUSD: 2600,
    SILVERUSD: 31.5,
  };

  return basePrices[symbol] || 100;
}

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
    const useRealData = searchParams.get('useRealData') !== 'false'; // 默认使用真实数据
    const withTicker = searchParams.get('withTicker') === 'true';

    if (!symbolsParam) {
      return NextResponse.json(
        { error: 'Missing required parameter: symbols' },
        { status: 400 }
      );
    }

    const symbols = symbolsParam.split(',').map(s => s.trim());
    const result: { [symbol: string]: { price: number; change?: number } } = {};

    if (useRealData) {
      // ✅ 使用真实数据
      console.log(`[MarketData] Fetching real data for ${symbols.length} symbols...`);

      if (withTicker) {
        // 获取价格和 24 小时涨跌幅
        const pricePromises = symbols.map(async (symbol, index) => {
          try {
            const ticker = await getPriceChangeFromBinance(symbol);
            if (ticker) {
              return { symbol, data: ticker };
            }
            return null;
          } catch (error) {
            console.warn(`[MarketData] Error fetching ticker for ${symbol}:`, error);
            return null;
          }
        });

        const results = await Promise.all(pricePromises);

        for (let i = 0; i < results.length; i++) {
          const item = results[i];
          if (item) {
            // ✅ 应用调控机器人浮点值
            const floatValue = await getBotFloatValue(item.symbol);
            const adjustedPrice = applyBotAdjustment(item.data.price, floatValue);
            result[item.symbol] = {
              ...item.data,
              price: adjustedPrice,
            };
          } else {
            // ✅ 获取失败时，不返回该 symbol，让前端保持当前价格
            // 不再使用随机生成
            console.log(`[MarketData] Failed to fetch ticker for ${symbols[i]}, skipping...`);
          }
        }
      } else {
        // 只获取价格
        const priceMap = await getBatchPricesFromBinance(symbols);

        for (const symbol of symbols) {
          if (priceMap[symbol] !== undefined) {
            // ✅ 应用调控机器人浮点值
            const floatValue = await getBotFloatValue(symbol);
            const adjustedPrice = applyBotAdjustment(priceMap[symbol], floatValue);
            result[symbol] = { price: adjustedPrice };
          } else {
            // ✅ 获取失败时，不返回该 symbol，让前端保持当前价格
            // 不再使用随机生成
            console.log(`[MarketData] Failed to fetch price for ${symbol}, skipping...`);
          }
        }
      }
    } else {
      // ✅ 使用模拟数据
      console.log(`[MarketData] Generating mock data for ${symbols.length} symbols...`);

      for (const symbol of symbols) {
        const floatValue = await getBotFloatValue(symbol);
        const basePrice = getRandomPrice(getBasePrice(symbol));
        const adjustedPrice = applyBotAdjustment(basePrice, floatValue);
        result[symbol] = {
          price: adjustedPrice,
          change: getRandomChange(),
        };
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
