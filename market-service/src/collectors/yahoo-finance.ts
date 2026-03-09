/**
 * Yahoo Finance 数据收集器
 * 用于获取免费的黄金、白银等贵金属价格
 *
 * 参考资料:
 * - https://finance.yahoo.com/quote/GC=F (黄金期货)
 * - https://finance.yahoo.com/quote/SI=F (白银期货)
 */

/**
 * Yahoo Finance 股票代码映射
 */
const YAHOO_SYMBOLS: Record<string, string> = {
  'XAUUSD': 'GC=F', // 黄金期货
  'XAGUSD': 'SI=F', // 白银期货
  'XPTUSD': 'PL=F', // 铂金期货
  'XPDUSD': 'PA=F', // 钯金期货
};

/**
 * Yahoo Finance 股票代码转换为系统符号
 */
export function yahooSymbolToSystemSymbol(yahooSymbol: string): string {
  const symbolMap: Record<string, string> = {
    'GC=F': 'XAUUSD',
    'SI=F': 'XAGUSD',
    'PL=F': 'XPTUSD',
    'PA=F': 'XPDUSD',
  };

  return symbolMap[yahooSymbol] || yahooSymbol.replace('=', '');
}

/**
 * 系统符号转换为 Yahoo Finance 股票代码
 */
export function systemSymbolToYahooSymbol(symbol: string): string {
  return YAHOO_SYMBOLS[symbol] || symbol;
}

/**
 * 从 Yahoo Finance 获取价格（使用免费的公开 API）
 *
 * Yahoo Finance 提供免费的股票和期货数据
 * 不需要 API Key，可以直接使用
 */
export async function getYahooFinancePrice(symbol: string): Promise<number | null> {
  try {
    const yahooSymbol = systemSymbolToYahooSymbol(symbol);

    // 使用 Yahoo Finance 的免费 API
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: any = await response.json();

    // 提取最新价格
    const result = data.chart?.result?.[0];
    if (!result) {
      console.warn(`[YahooFinance] No data found for ${symbol} (${yahooSymbol})`);
      return null;
    }

    const meta = result.meta;
    const price = meta?.regularMarketPrice;

    if (price === undefined || price === null) {
      console.warn(`[YahooFinance] No price found for ${symbol} (${yahooSymbol})`);
      return null;
    }

    console.log(`[YahooFinance] ✅ ${symbol} (${yahooSymbol}): $${price.toFixed(2)}`);

    return price;

  } catch (error) {
    console.error(`[YahooFinance] ❌ Error fetching ${symbol} price:`, error);
    return null;
  }
}

/**
 * 批量获取多个交易对的价格
 */
export async function getYahooFinancePrices(symbols: string[]): Promise<Map<string, number>> {
  const prices = new Map<string, number>();

  // 并发获取所有价格
  const promises = symbols.map(async (symbol) => {
    const price = await getYahooFinancePrice(symbol);
    if (price !== null) {
      prices.set(symbol, price);
    }
  });

  await Promise.all(promises);

  return prices;
}

/**
 * 获取所有支持的贵金属价格
 */
export async function getAllMetalsPrices(): Promise<Map<string, number>> {
  const symbols = Object.keys(YAHOO_SYMBOLS);
  return await getYahooFinancePrices(symbols);
}
