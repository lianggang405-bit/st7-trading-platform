import { NextRequest, NextResponse } from 'next/server';
import { getRandomTrend, getRandomChange, getRandomPrice } from '@/lib/market-generator';
import { getPriceFromBinance, getBatchPricesFromBinance, getPriceChangeFromBinance } from '@/lib/market-data-source';

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
            result[item.symbol] = item.data;
          } else {
            // 降级到随机生成
            const fallbackSymbol = symbols[i];
            result[fallbackSymbol] = {
              price: getRandomPrice(getBasePrice(fallbackSymbol)),
              change: getRandomChange(),
            };
          }
        }
      } else {
        // 只获取价格
        const priceMap = await getBatchPricesFromBinance(symbols);

        for (const symbol of symbols) {
          if (priceMap[symbol] !== undefined) {
            result[symbol] = { price: priceMap[symbol] };
          } else {
            // 降级到随机生成
            result[symbol] = { price: getRandomPrice(getBasePrice(symbol)) };
          }
        }
      }
    } else {
      // ✅ 使用模拟数据
      console.log(`[MarketData] Generating mock data for ${symbols.length} symbols...`);

      for (const symbol of symbols) {
        result[symbol] = {
          price: getRandomPrice(getBasePrice(symbol)),
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
