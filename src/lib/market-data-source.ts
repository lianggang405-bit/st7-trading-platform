/**
 * 真实行情数据源
 *
 * 从外部 API 获取实时市场价格
 * 支持多个数据源（Binance 等）
 */

// Binance API 配置
const BINANCE_API_URL = 'https://api.binance.com';

// ✅ 价格缓存（有效期 30 秒）
const priceCache = new Map<string, { price: number; timestamp: number }>();
const CACHE_TTL = 30000; // 30 秒

/**
 * 从缓存获取价格（如果未过期）
 */
function getCachedPrice(symbol: string): number | null {
  const cached = priceCache.get(symbol);
  if (!cached) return null;

  const now = Date.now();
  if (now - cached.timestamp < CACHE_TTL) {
    return cached.price;
  }

  // 缓存过期，删除
  priceCache.delete(symbol);
  return null;
}

/**
 * 更新价格缓存
 */
function updatePriceCache(symbol: string, price: number): void {
  priceCache.set(symbol, {
    price,
    timestamp: Date.now(),
  });
}

/**
 * 获取交易对的实时价格（从 Binance）
 *
 * @param symbol 交易对符号（如 BTCUSD）
 * @returns 价格
 */
export async function getPriceFromBinance(symbol: string): Promise<number | null> {
  // ✅ 先尝试从缓存获取
  const cachedPrice = getCachedPrice(symbol);
  if (cachedPrice !== null) {
    console.log(`[MarketDataSource] Using cached price for ${symbol}: ${cachedPrice}`);
    return cachedPrice;
  }

  // ✅ 增加重试机制（最多重试 3 次）
  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // 将交易对转换为 Binance 格式
      // BTCUSD -> BTCUSDT
      const binanceSymbol = symbol.replace('USD', 'USDT');

      const response = await fetch(
        `${BINANCE_API_URL}/api/v3/ticker/price?symbol=${binanceSymbol}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          // ✅ 增加超时时间到 10 秒
          signal: AbortSignal.timeout(10000),
        }
      );

      if (!response.ok) {
        console.warn(`[MarketDataSource] Failed to fetch price for ${symbol} from Binance (attempt ${attempt}/${maxRetries})`);
        if (attempt < maxRetries) {
          // 等待 1 秒后重试
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        return null;
      }

      const data = await response.json();
      const price = parseFloat(data.price);

      if (isNaN(price)) {
        console.warn(`[MarketDataSource] Invalid price for ${symbol}: ${data.price}`);
        return null;
      }

      // ✅ 更新缓存
      updatePriceCache(symbol, price);

      return price;
    } catch (error) {
      console.warn(`[MarketDataSource] Error fetching price for ${symbol} (attempt ${attempt}/${maxRetries}):`, error);
      if (attempt < maxRetries) {
        // 等待 1 秒后重试
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
      return null;
    }
  }

  return null;
}

/**
 * 获取交易对的价格变化（从 Binance）
 *
 * @param symbol 交易对符号（如 BTCUSD）
 * @returns 价格和涨跌幅
 */
export async function getPriceChangeFromBinance(symbol: string): Promise<{
  price: number;
  change: number;
} | null> {
  try {
    // 将交易对转换为 Binance 格式
    const binanceSymbol = symbol.replace('USD', 'USDT');

    const response = await fetch(
      `${BINANCE_API_URL}/api/v3/ticker/24hr?symbol=${binanceSymbol}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!response.ok) {
      console.warn(`[MarketDataSource] Failed to fetch 24hr ticker for ${symbol} from Binance`);
      return null;
    }

    const data = await response.json();
    const price = parseFloat(data.lastPrice);
    const change = parseFloat(data.priceChangePercent);

    if (isNaN(price) || isNaN(change)) {
      console.warn(`[MarketDataSource] Invalid ticker data for ${symbol}:`, data);
      return null;
    }

    return { price, change };
  } catch (error) {
    console.warn(`[MarketDataSource] Error fetching ticker for ${symbol}:`, error);
    return null;
  }
}

/**
 * 批量获取多个交易对的价格
 *
 * @param symbols 交易对符号数组
 * @returns 价格映射表
 */
export async function getBatchPricesFromBinance(symbols: string[]): Promise<{ [symbol: string]: number }> {
  const result: { [symbol: string]: number } = {};
  const uncachedSymbols: string[] = [];

  // ✅ 第一步：检查缓存
  for (const symbol of symbols) {
    const cachedPrice = getCachedPrice(symbol);
    if (cachedPrice !== null) {
      result[symbol] = cachedPrice;
    } else {
      uncachedSymbols.push(symbol);
    }
  }

  // 如果全部命中缓存，直接返回
  if (uncachedSymbols.length === 0) {
    console.log('[MarketDataSource] All prices from cache');
    return result;
  }

  // ✅ 第二步：只请求未命中的价格
  console.log(`[MarketDataSource] Fetching ${uncachedSymbols.length} uncached prices from Binance`);

  // 将交易对转换为 Binance 格式
  const binanceSymbols = uncachedSymbols.map(s => s.replace('USD', 'USDT'));

  try {
    const response = await fetch(
      `${BINANCE_API_URL}/api/v3/ticker/price?symbols=${JSON.stringify(binanceSymbols)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!response.ok) {
      console.warn('[MarketDataSource] Failed to fetch batch prices from Binance');
      // 降级到单个请求
      for (const symbol of uncachedSymbols) {
        const price = await getPriceFromBinance(symbol);
        if (price !== null) {
          result[symbol] = price;
        }
      }
      return result;
    }

    const data = await response.json();

    for (const item of data) {
      // 将 Binance 格式转换回来
      const originalSymbol = item.symbol.replace('USDT', 'USD');
      const price = parseFloat(item.price);

      if (!isNaN(price)) {
        result[originalSymbol] = price;
        // ✅ 更新缓存
        updatePriceCache(originalSymbol, price);
      }
    }
  } catch (error) {
    console.warn('[MarketDataSource] Error fetching batch prices:', error);
    // 降级到单个请求
    for (const symbol of uncachedSymbols) {
      const price = await getPriceFromBinance(symbol);
      if (price !== null) {
        result[symbol] = price;
      }
    }
  }

  return result;
}

/**
 * 批量获取多个交易对的价格和涨跌幅
 *
 * @param symbols 交易对符号数组
 * @returns 价格和涨跌幅映射表
 */
export async function getBatchPriceChangesFromBinance(symbols: string[]): Promise<{ [symbol: string]: { price: number; change: number } }> {
  const result: { [symbol: string]: { price: number; change: number } } = {};

  // 将交易对转换为 Binance 格式
  const binanceSymbols = symbols.map(s => s.replace('USD', 'USDT'));

  try {
    const response = await fetch(
      `${BINANCE_API_URL}/api/v3/ticker/24hr?symbols=${JSON.stringify(binanceSymbols)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!response.ok) {
      console.warn('[MarketDataSource] Failed to fetch batch tickers from Binance');
      // 降级到单个请求
      for (const symbol of symbols) {
        const data = await getPriceChangeFromBinance(symbol);
        if (data !== null) {
          result[symbol] = data;
        }
      }
      return result;
    }

    const data = await response.json();

    for (const item of data) {
      // 将 Binance 格式转换回来
      const originalSymbol = item.symbol.replace('USDT', 'USD');
      const price = parseFloat(item.lastPrice);
      const change = parseFloat(item.priceChangePercent);

      if (!isNaN(price) && !isNaN(change)) {
        result[originalSymbol] = { price, change };
      }
    }
  } catch (error) {
    console.warn('[MarketDataSource] Error fetching batch tickers:', error);
    // 降级到单个请求
    for (const symbol of symbols) {
      const data = await getPriceChangeFromBinance(symbol);
      if (data !== null) {
        result[symbol] = data;
      }
    }
  }

  return result;
}

/**
 * 获取交易对的实时价格（主函数）
 * 支持多个数据源，按优先级尝试
 *
 * @param symbol 交易对符号
 * @returns 价格
 */
export async function getRealPrice(symbol: string): Promise<number> {
  // 1. 尝试从 Binance 获取
  let price = await getPriceFromBinance(symbol);

  // 2. 如果失败，使用备用价格（基于 Mock 数据）
  if (price === null) {
    console.warn(`[MarketDataSource] Using fallback price for ${symbol}`);
    price = getFallbackPrice(symbol);
  }

  return price;
}

/**
 * 获取交易对的价格和涨跌幅（主函数）
 *
 * @param symbol 交易对符号
 * @returns 价格和涨跌幅
 */
export async function getRealPriceAndChange(symbol: string): Promise<{
  price: number;
  change: number;
}> {
  // 1. 尝试从 Binance 获取
  const data = await getPriceChangeFromBinance(symbol);

  // 2. 如果失败，使用备用价格
  if (data === null) {
    console.warn(`[MarketDataSource] Using fallback ticker for ${symbol}`);
    return getFallbackTicker(symbol);
  }

  return data;
}

/**
 * 批量获取实时价格（主函数）
 *
 * @param symbols 交易对符号数组
 * @returns 价格映射表
 */
export async function getBatchRealPrices(symbols: string[]): Promise<{ [symbol: string]: number }> {
  // 1. 尝试批量获取
  let prices = await getBatchPricesFromBinance(symbols);

  // 2. 填充缺失的价格
  for (const symbol of symbols) {
    if (prices[symbol] === undefined) {
      console.warn(`[MarketDataSource] Using fallback price for ${symbol}`);
      prices[symbol] = getFallbackPrice(symbol);
    }
  }

  return prices;
}

/**
 * 批量获取实时价格和涨跌幅（主函数）
 *
 * @param symbols 交易对符号数组
 * @returns 价格和涨跌幅映射表
 */
export async function getBatchRealPricesAndChanges(symbols: string[]): Promise<{ [symbol: string]: { price: number; change: number } }> {
  // 1. 尝试批量获取
  let tickers = await getBatchPriceChangesFromBinance(symbols);

  // 2. 填充缺失的数据
  for (const symbol of symbols) {
    if (tickers[symbol] === undefined) {
      console.warn(`[MarketDataSource] Using fallback ticker for ${symbol}`);
      tickers[symbol] = getFallbackTicker(symbol);
    }
  }

  return tickers;
}

/**
 * 备用价格（基于 Mock 数据）
 * 当外部 API 失败时使用
 */
function getFallbackPrice(symbol: string): number {
  const fallbackPrices: { [key: string]: number } = {
    // Forex
    'EURUSD': 1.0856,
    'GBPUSD': 1.2654,
    'USDJPY': 149.82,
    'USDCHF': 0.8842,
    'EURAUD': 1.6523,
    'EURGBP': 0.8574,
    'EURJPY': 162.45,
    'GBPAUD': 1.9234,
    'GBPNZD': 2.0856,
    'GBPJPY': 189.67,
    'AUDUSD': 0.6543,
    'AUDJPY': 98.12,
    'NZDUSD': 0.6089,
    'NZDJPY': 91.23,
    'CADJPY': 110.45,
    'CHFJPY': 169.54,
    // Gold - 更新为 2026 年 3 月真实价格
    'XAUUSD': 5200.00,
    'XAGUSD': 29.50,
    // Crypto
    'BTCUSD': 98500.00,
    'ETHUSD': 3250.00,
    'LTCUSD': 95.00,
    'SOLUSD': 145.00,
    'XRPUSD': 2.15,
    'DOGEUSD': 0.18,
    // Energy
    'NGAS': 3.15,
    'UKOIL': 82.50,
    'USOIL': 80.25,
    // Indices
    'US500': 5250.00,
    'ND25': 18500.00,
    'AUS200': 8125.00,
  };

  return fallbackPrices[symbol] || 100;
}

/**
 * 备用价格和涨跌幅（基于 Mock 数据）
 * 当外部 API 失败时使用
 */
function getFallbackTicker(symbol: string): { price: number; change: number } {
  const fallbackTickers: { [key: string]: { price: number; change: number } } = {
    // Forex
    'EURUSD': { price: 1.0856, change: 0.25 },
    'GBPUSD': { price: 1.2654, change: -0.18 },
    'USDJPY': { price: 149.82, change: 0.42 },
    'USDCHF': { price: 0.8842, change: -0.12 },
    'EURAUD': { price: 1.6523, change: 0.15 },
    'EURGBP': { price: 0.8574, change: -0.08 },
    'EURJPY': { price: 162.45, change: 0.32 },
    'GBPAUD': { price: 1.9234, change: -0.22 },
    'GBPNZD': { price: 2.0856, change: 0.18 },
    'GBPJPY': { price: 189.67, change: 0.25 },
    'AUDUSD': { price: 0.6543, change: -0.15 },
    'AUDJPY': { price: 98.12, change: 0.28 },
    'NZDUSD': { price: 0.6089, change: -0.12 },
    'NZDJPY': { price: 91.23, change: 0.35 },
    'CADJPY': { price: 110.45, change: 0.22 },
    'CHFJPY': { price: 169.54, change: -0.18 },
    // Gold
    'XAUUSD': { price: 2850.00, change: 0.45 },
    'XAGUSD': { price: 32.50, change: -0.25 },
    // Crypto
    'BTCUSD': { price: 98500.00, change: 1.25 },
    'ETHUSD': { price: 3250.00, change: 0.85 },
    'LTCUSD': { price: 95.00, change: -0.45 },
    'SOLUSD': { price: 145.00, change: 2.15 },
    'XRPUSD': { price: 2.15, change: -0.65 },
    'DOGEUSD': { price: 0.18, change: 1.15 },
    // Energy
    'NGAS': { price: 3.15, change: -1.85 },
    'UKOIL': { price: 82.50, change: 0.65 },
    'USOIL': { price: 80.25, change: 0.45 },
    // Indices
    'US500': { price: 5250.00, change: 0.35 },
    'ND25': { price: 18500.00, change: 0.45 },
    'AUS200': { price: 8125.00, change: -0.15 },
  };

  return fallbackTickers[symbol] || { price: 100, change: 0 };
}
