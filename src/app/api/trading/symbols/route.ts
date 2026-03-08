import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { mockSymbols } from '@/lib/market-mock-data';
import { realTimePrices } from '@/lib/real-time-prices';

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

    // 将数据库数据转换为前端需要的格式
    const symbols = tradingPairs?.map(pair => {
      // 根据交易对确定分类
      let category = 'forex';
      const symbol = pair.symbol.toUpperCase();

      if (symbol.includes('BTC') || symbol.includes('ETH') || symbol.includes('LTC') ||
          symbol.includes('SOL') || symbol.includes('XRP') || symbol.includes('DOGE')) {
        category = 'crypto';
      } else if (symbol.includes('XAU') || symbol.includes('GOLD')) {
        category = 'gold';
      } else if (symbol.includes('USOIL') || symbol.includes('UKOIL') || symbol.includes('NGAS')) {
        category = 'forex'; // 能源类归为外汇
      } else if (symbol.includes('US500') || symbol.includes('ND25') || symbol.includes('AUS200')) {
        category = 'forex'; // 指数类归为外汇
      }

      // 从真实价格数据获取价格
      const realPrice = realTimePrices.find(p => p.symbol === symbol);
      const price = realPrice ? realPrice.price : 100;

      return {
        symbol: pair.symbol,
        price: price,
        change: realPrice ? realPrice.change : 0,
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
