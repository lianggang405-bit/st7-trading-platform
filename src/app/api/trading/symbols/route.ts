import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { mockSymbols } from '@/lib/market-mock-data';
import { realTimePrices } from '@/lib/real-time-prices';

// ✅ 禁用 Next.js API 缓存，确保实时价格更新
export const dynamic = 'force-dynamic';

/**
 * 转换交易对格式：将带斜杠的格式转换为不带斜杠的格式
 * 例如：BTC/USDT -> BTCUSDT, XAU/USD -> XAUUSD
 */
function normalizeSymbol(symbol: string): string {
  return symbol.replace('/', '').replace('-', '').toUpperCase();
}

export async function GET() {
  try {
    const supabase = getSupabaseClient();

    // 从数据库获取交易对数据
    const { data: tradingPairs, error } = await supabase
      .from('trading_pairs')
      .select('*')
      .eq('is_visible', true)
      .order('id', { ascending: true });

    if (error) {
      console.error('[Trading Symbols API] Error fetching from database:', error);
      // 降级到 mock 数据
      return NextResponse.json({
        success: true,
        symbols: mockSymbols,
        isMock: true,
      });
    }

    // 从 market-service 获取实时价格（批量获取）
    const marketServiceUrl = process.env.MARKET_SERVICE_URL || 'http://localhost:3000';
    const symbolsList = tradingPairs?.map(pair => pair.symbol) || [];
    
    // 构建批量查询参数（转换 symbol 格式）
    const tickerPromises = symbolsList.map(async (symbol) => {
      try {
        const normalizedSymbol = normalizeSymbol(symbol);
        const response = await fetch(`${marketServiceUrl}/ticker/24hr?symbol=${encodeURIComponent(normalizedSymbol)}`);
        if (response.ok) {
          const data = await response.json();
          // 保存原始 symbol 以便后续映射
          return { ...data, originalSymbol: symbol };
        }
        return null;
      } catch (error) {
        console.warn(`[Trading Symbols API] Failed to fetch ticker for ${symbol}:`, error);
        return null;
      }
    });

    const tickers = await Promise.all(tickerPromises);

    // 创建价格映射（使用原始 symbol 作为键）
    const priceMap = new Map<string, { price: number; change: number }>();
    tickers.forEach((ticker) => {
      if (ticker && ticker.originalSymbol) {
        priceMap.set(ticker.originalSymbol, {
          price: ticker.lastPrice,
          change: ticker.priceChangePercent,
        });
      }
    });

    // 将数据库数据转换为前端需要的格式
    const symbols = tradingPairs?.map(pair => {
      // 根据交易对确定分类
      let category = 'forex';
      const symbol = pair.symbol.toUpperCase();

      if (symbol.includes('BTC') || symbol.includes('ETH') || symbol.includes('LTC') ||
          symbol.includes('SOL') || symbol.includes('XRP') || symbol.includes('DOGE')) {
        category = 'crypto';
      } else if (symbol.includes('XAU') || symbol.includes('GOLD') || symbol.includes('XAG') || symbol.includes('SILVER')) {
        category = 'gold';
      } else if (symbol.includes('USOIL') || symbol.includes('UKOIL') || symbol.includes('NGAS')) {
        category = 'forex'; // 能源类归为外汇
      } else if (symbol.includes('US500') || symbol.includes('ND25') || symbol.includes('AUS200')) {
        category = 'forex'; // 指数类归为外汇
      }

      // ✅ 从 market-service 获取实时价格（使用原始 symbol 作为键）
      const priceData = priceMap.get(symbol);
      const price = priceData ? priceData.price : 100;
      const change = priceData ? priceData.change : 0;

      return {
        symbol: pair.symbol,
        price: price,
        change: change,
        category: category,
        id: pair.id,
      };
    }) || mockSymbols;

    return NextResponse.json({
      success: true,
      symbols: symbols,
      isMock: false,
    });
  } catch (error) {
    console.error('[Trading Symbols API] Error:', error);
    return NextResponse.json({
      success: true,
      symbols: mockSymbols,
      isMock: true,
    });
  }
}
