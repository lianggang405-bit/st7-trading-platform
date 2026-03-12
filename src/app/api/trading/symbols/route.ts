import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { mockSymbols } from '@/lib/market-mock-data';
import { realTimePrices, getPriceMap } from '@/lib/real-time-prices';

// ✅ 禁用 Next.js API 缓存，确保实时价格更新
export const dynamic = 'force-dynamic';

// ✅ 获取价格映射（从 real-time-prices.ts）- 用于默认价格
const defaultPriceMap = getPriceMap();

/**
 * 转换交易对格式：将带斜杠的格式转换为不带斜杠的格式
 * 例如：BTC/USDT -> BTCUSDT, XAU/USD -> XAUUSD
 */
function normalizeSymbol(symbol: string): string {
  return symbol.replace('/', '').replace('-', '').toUpperCase();
}

/**
 * 获取交易对的默认价格（从 real-time-prices.ts）
 * 添加基于时间的动态波动，模拟实时价格变化
 */
function getDefaultPrice(symbol: string): { price: number; change: number } {
  const basePrice = defaultPriceMap[symbol];
  if (basePrice === undefined) {
    // 如果找不到，返回 0
    return { price: 0, change: 0 };
  }

  // 从 realTimePrices 中查找对应的涨跌幅
  const realTimePrice = realTimePrices.find(p => p.symbol === symbol);
  const baseChange = realTimePrice ? realTimePrice.change : 0;

  // 基于当前时间生成动态波动（每秒变化）
  const now = Date.now();
  const timeFactor = Math.floor(now / 1000); // 每秒变化一次

  // 根据价格范围设置波动幅度
  let volatility: number;
  if (basePrice > 10000) {
    volatility = basePrice * 0.0005; // 高价格：0.05% 波动
  } else if (basePrice > 100) {
    volatility = basePrice * 0.001; // 中等价格：0.1% 波动
  } else if (basePrice > 1) {
    volatility = basePrice * 0.002; // 低价格：0.2% 波动
  } else {
    volatility = basePrice * 0.005; // 极低价格：0.5% 波动
  }

  // 使用时间因子生成伪随机波动
  const randomFactor = Math.sin(timeFactor + symbol.length) * volatility;
  const dynamicPrice = basePrice + randomFactor;

  // 动态涨跌幅
  const dynamicChange = baseChange + (Math.cos(timeFactor / 10) * 0.5);

  return {
    price: dynamicPrice,
    change: dynamicChange,
  };
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

    // 创建价格映射（从 market-service 获取的实时价格）
    const marketPriceMap = new Map<string, { price: number; change: number }>();
    tickers.forEach((ticker) => {
      if (ticker && ticker.originalSymbol) {
        marketPriceMap.set(ticker.originalSymbol, {
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

      // 加密货币
      if (symbol.includes('BTC') || symbol.includes('ETH') || symbol.includes('LTC') ||
          symbol.includes('SOL') || symbol.includes('XRP') || symbol.includes('DOGE')) {
        category = 'crypto';
      }
      // 贵金属（黄金、白银）
      else if (symbol.includes('XAU') || symbol.includes('GOLD') || symbol.includes('XAG') || symbol.includes('SILVER')) {
        category = 'gold';
      }
      // 能源（原油、天然气）
      else if (symbol.includes('USOIL') || symbol.includes('UKOIL') || symbol.includes('NGAS')) {
        category = 'energy';
      }
      // 指数（CFD）
      else if (symbol.includes('US500') || symbol.includes('ND25') || symbol.includes('AUS200')) {
        category = 'cfd';
      }
      // 其他为外汇
      else {
        category = 'forex';
      }

      // ✅ 从 market-service 获取实时价格，如果失败则使用默认价格
      const priceData = marketPriceMap.get(symbol);
      const price = priceData ? priceData.price : getDefaultPrice(symbol).price;
      const change = priceData ? priceData.change : getDefaultPrice(symbol).change;

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
