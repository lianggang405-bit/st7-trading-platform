import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { mockSymbols } from '@/lib/market-mock-data';

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

      return {
        symbol: pair.symbol,
        price: getBasePrice(symbol),
        change: 0, // 价格变化由市场数据API提供
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

// 获取基准价格（2024年3月市场价）
function getBasePrice(symbol: string): number {
  const basePrices: { [key: string]: number } = {
    // Crypto（基于 Binance 实时价格）
    BTCUSD: 66150.00,
    ETHUSD: 3450.00,
    SOLUSD: 178.00,
    XRPUSD: 2.34,
    LTCUSD: 89.00,
    DOGEUSD: 0.45,
    // Forex
    EURUSD: 1.0856,
    GBPUSD: 1.2654,
    USDJPY: 149.82,
    USDCHF: 0.8842,
    EURAUD: 1.6523,
    EURGBP: 0.8574,
    EURJPY: 162.45,
    GBPAUD: 1.9234,
    GBPNZD: 2.0856,
    GBPJPY: 189.67,
    AUDUSD: 0.6543,
    AUDJPY: 98.12,
    NZDUSD: 0.6089,
    NZDJPY: 91.23,
    CADJPY: 110.45,
    CHFJPY: 169.54,
    // Gold & Silver
    XAUUSD: 2850.00,
    XAGUSD: 32.50,
    // Energy
    NGAS: 3.15,
    UKOIL: 82.50,
    USOIL: 80.25,
    // Indices
    US500: 5250.00,
    ND25: 18500.00,
    AUS200: 8125.00,
  };

  return basePrices[symbol] || 100;
}
