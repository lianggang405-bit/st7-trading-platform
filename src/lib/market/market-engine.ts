/**
 * Market Engine - 统一行情引擎（支持多端点代理）
 *
 * 数据源策略：
 * - Crypto → CoinGecko API（多端点尝试）
 * - Metal → Gold API（真实数据）
 * - 其他 → 模拟数据
 *
 * 设计原则：
 * - 简单：代码量少，逻辑清晰
 * - 稳定：自动降级，失败不影响
 * - 统一：全站只有一个价格源
 * - 缓存：降级时使用最后一次真实价格
 * - 代理：支持多端点自动切换
 */

type SymbolInfo = {
  symbol: string
  type: "crypto" | "metal" | "forex" | "energy" | "cfd"
  basePrice?: number
  category: "crypto" | "metal" | "forex" | "energy" | "cfd"
  coingeckoId?: string
  goldSymbol?: string
}

// 价格缓存：保存最后一次成功获取的真实价格
const priceCache = new Map<string, { price: number; timestamp: number; basePrice: number }>();

// CoinGecko API 多端点配置（按优先级排序）
const COINGECKO_ENDPOINTS = [
  // 主端点
  'https://api.coingecko.com/api/v3',
  // 备用端点（如果有的话）
  // 'https://api.coingecko.com/api/v3',
];

// 交易对配置
const symbols: SymbolInfo[] = [
  // Crypto - 使用 CoinGecko API
  { symbol: "BTCUSDT", type: "crypto", category: "crypto", coingeckoId: "bitcoin", basePrice: 100000 },
  { symbol: "ETHUSDT", type: "crypto", category: "crypto", coingeckoId: "ethereum", basePrice: 4000 },
  { symbol: "LTCUSDT", type: "crypto", category: "crypto", coingeckoId: "litecoin", basePrice: 150 },
  { symbol: "SOLUSDT", type: "crypto", category: "crypto", coingeckoId: "solana", basePrice: 200 },
  { symbol: "XRPUSDT", type: "crypto", category: "crypto", coingeckoId: "ripple", basePrice: 0.6 },
  { symbol: "DOGEUSDT", type: "crypto", category: "crypto", coingeckoId: "dogecoin", basePrice: 0.2 },
  { symbol: "ADAUSDT", type: "crypto", category: "crypto", coingeckoId: "cardano", basePrice: 1.2 },
  { symbol: "DOTUSDT", type: "crypto", category: "crypto", coingeckoId: "polkadot", basePrice: 8 },

  // Metal - 使用 Gold API
  { symbol: "XAUUSD", type: "metal", category: "metal", goldSymbol: "XAU" },
  { symbol: "XAGUSD", type: "metal", category: "metal", goldSymbol: "XAG" },

  // Forex - 模拟数据
  { symbol: "EURUSD", type: "forex", category: "forex", basePrice: 1.085 },
  { symbol: "GBPUSD", type: "forex", category: "forex", basePrice: 1.265 },
  { symbol: "USDJPY", type: "forex", category: "forex", basePrice: 149.8 },
  { symbol: "USDCHF", type: "forex", category: "forex", basePrice: 0.884 },
  { symbol: "AUDUSD", type: "forex", category: "forex", basePrice: 0.654 },
  { symbol: "NZDUSD", type: "forex", category: "forex", basePrice: 0.608 },
  { symbol: "USDCAD", type: "forex", category: "forex", basePrice: 1.365 },
  { symbol: "EURGBP", type: "forex", category: "forex", basePrice: 0.858 },
  { symbol: "EURJPY", type: "forex", category: "forex", basePrice: 162.5 },
  { symbol: "GBPJPY", type: "forex", category: "forex", basePrice: 189.5 },
  { symbol: "AUDJPY", type: "forex", category: "forex", basePrice: 98.12 },
  { symbol: "CADJPY", type: "forex", category: "forex", basePrice: 110.45 },
  { symbol: "CHFJPY", type: "forex", category: "forex", basePrice: 169.54 },

  // Energy - 模拟数据
  { symbol: "USOIL", type: "energy", category: "energy", basePrice: 85.0 },
  { symbol: "UKOIL", type: "energy", category: "energy", basePrice: 88.0 },
  { symbol: "NGAS", type: "energy", category: "energy", basePrice: 2.8 },

  // CFD (Indices) - 模拟数据
  { symbol: "US500", type: "cfd", category: "cfd", basePrice: 5200 },
  { symbol: "ND100", type: "cfd", category: "cfd", basePrice: 18500 },
  { symbol: "AUS200", type: "cfd", category: "cfd", basePrice: 7800 },
  { symbol: "UK100", type: "cfd", category: "cfd", basePrice: 8100 },
  { symbol: "GER40", type: "cfd", category: "cfd", basePrice: 17800 },
  { symbol: "JPN225", type: "cfd", category: "cfd", basePrice: 40000 },
];

/**
 * 更新价格缓存
 */
function updatePriceCache(symbol: string, price: number, basePrice?: number) {
  priceCache.set(symbol, {
    price,
    timestamp: Date.now(),
    basePrice: basePrice || price,
  });
}

/**
 * 获取缓存价格（如果存在且未过期）
 */
function getCachedPrice(symbol: string, maxAge: number = 3600000): { price: number; basePrice: number } | null {
  const cached = priceCache.get(symbol);
  if (!cached) return null;

  const age = Date.now() - cached.timestamp;
  if (age > maxAge) {
    priceCache.delete(symbol); // 删除过期缓存
    return null;
  }

  return {
    price: cached.price,
    basePrice: cached.basePrice,
  };
}

/**
 * 计算涨跌幅（相对于基准价格）
 */
function calculateChange(currentPrice: number, basePrice: number): number {
  if (basePrice === 0) return 0;
  return ((currentPrice - basePrice) / basePrice) * 100;
}

/**
 * 使用代理或镜像获取数据
 * 尝试多个端点，直到成功或全部失败
 */
async function fetchWithProxy(
  path: string,
  signal: AbortSignal
): Promise<Response> {
  const errors: Error[] = [];

  // 尝试所有配置的端点
  for (const endpoint of COINGECKO_ENDPOINTS) {
    try {
      const url = `${endpoint}${path}`;
      console.log(`[MarketEngine] Trying endpoint: ${endpoint}`);

      const response = await fetch(url, {
        signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; TradingApp/1.0)',
        },
      });

      if (response.ok) {
        console.log(`[MarketEngine] Success with endpoint: ${endpoint}`);
        return response;
      }

      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      console.warn(`[MarketEngine] Endpoint failed: ${endpoint}`, error);
      errors.push(error as Error);
    }
  }

  // 所有端点都失败
  const lastError = errors[errors.length - 1];
  throw new Error(`All endpoints failed. Last error: ${lastError?.message}`);
}

/**
 * 从 CoinGecko API 获取加密货币价格（批量获取，支持多端点）
 */
async function fetchCryptoPrices(coingeckoIds: string[]): Promise<Map<string, { price: number; change: number }>> {
  try {
    const ids = coingeckoIds.join(',');
    const path = `/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;

    const response = await fetchWithProxy(path, AbortSignal.timeout(5000));

    const data = await response.json();

    const result = new Map<string, { price: number; change: number }>();

    for (const [id, info] of Object.entries(data)) {
      result.set(id, {
        price: (info as any).usd,
        change: (info as any).usd_24h_change || 0,
      });
    }

    console.log(`[MarketEngine] Fetched ${result.size} crypto prices from CoinGecko`);
    return result;
  } catch (error) {
    console.warn('[MarketEngine] CoinGecko API failed:', error);
    throw error;
  }
}

/**
 * 从 Gold API 获取贵金属价格
 */
async function fetchMetal(symbol: "XAU" | "XAG"): Promise<{ price: number; change: number }> {
  try {
    const res = await fetch(
      `https://api.gold-api.com/price/${symbol}`,
      { signal: AbortSignal.timeout(5000) }
    );

    if (!res.ok) {
      throw new Error(`Gold API error: ${res.status}`);
    }

    const data = await res.json();

    return {
      price: data.price,
      change: 0, // Gold API 暂时不提供涨跌幅
    };
  } catch (error) {
    console.warn('[MarketEngine] Gold API failed for', symbol, ':', error);
    throw error;
  }
}

/**
 * 生成模拟价格（基于基准价格的波动）
 */
function mockPrice(base: number, volatility?: number): number {
  // 根据价格范围自动调整波动性
  const autoVolatility = base > 100 ? 0.001 : 0.002;
  const v = volatility ?? autoVolatility;

  // 使用正弦波生成平滑波动
  const wave = Math.sin(Date.now() / 1000);
  const noise = (Math.random() - 0.5) * v * 0.5;

  return base + base * (v * wave + noise);
}

/**
 * 获取市场数据（核心函数）
 */
export async function getMarketData() {
  const result = [];

  // 收集所有需要从 CoinGecko 获取的加密货币 ID
  const cryptoSymbols = symbols.filter(s => s.type === "crypto");
  const coingeckoIds = cryptoSymbols.map(s => s.coingeckoId!).filter(Boolean);

  // 批量获取加密货币价格
  let cryptoPrices = new Map<string, { price: number; change: number }>();
  try {
    if (coingeckoIds.length > 0) {
      cryptoPrices = await fetchCryptoPrices(coingeckoIds);
    }
  } catch (error) {
    console.warn('[MarketEngine] Failed to fetch crypto prices from CoinGecko, will use cache/fallback');
  }

  // 处理所有交易对
  for (const s of symbols) {
    try {
      let price: number;
      let change: number;
      let source: string;

      if (s.type === "crypto") {
        // Crypto → CoinGecko API
        if (s.coingeckoId && cryptoPrices.has(s.coingeckoId)) {
          const data = cryptoPrices.get(s.coingeckoId)!;
          price = data.price;
          change = data.change;
          source = "coingecko";
          updatePriceCache(s.symbol, price, s.basePrice); // 更新缓存
        } else {
          // 使用缓存价格或 fallback
          const cached = getCachedPrice(s.symbol);
          if (cached !== null) {
            price = mockPrice(cached.price); // 基于缓存价格波动
            change = calculateChange(price, cached.basePrice); // 计算涨跌幅
            source = "cached";
          } else {
            price = mockPrice(s.basePrice || 100); // 使用基准价格
            change = 0; // 初始无涨跌
            // 🔥 重要：首次 fallback 也要更新缓存，这样下次就能计算涨跌幅了
            updatePriceCache(s.symbol, price, s.basePrice || 100);
            source = "fallback";
          }
        }
      } else if (s.type === "metal") {
        // Metal → Gold API
        const data = await fetchMetal(s.goldSymbol as "XAU" | "XAG");
        price = data.price;
        change = data.change;
        source = "gold-api";
        updatePriceCache(s.symbol, price, s.basePrice); // 更新缓存
      } else {
        // 其他 → 模拟数据
        price = mockPrice(s.basePrice!);
        change = calculateChange(price, s.basePrice!); // 计算涨跌幅
        source = "mock";
      }

      result.push({
        symbol: s.symbol,
        price,
        change,
        source,
        category: s.category,
      });
    } catch (error) {
      // 降级处理：使用缓存或模拟数据
      const cached = getCachedPrice(s.symbol);
      let price: number;
      let change: number;

      if (cached !== null) {
        price = mockPrice(cached.price); // 基于缓存价格波动
        change = calculateChange(price, cached.basePrice); // 计算涨跌幅
        console.warn(`[MarketEngine] Using cached price for ${s.symbol}`);
      } else {
        price = mockPrice(s.basePrice || 100); // 使用基准价格
        change = 0; // 初始无涨跌
        // 🔥 重要：首次 fallback 也要更新缓存
        updatePriceCache(s.symbol, price, s.basePrice || 100);
        console.warn(`[MarketEngine] Using fallback price for ${s.symbol}`);
      }

      result.push({
        symbol: s.symbol,
        price,
        change,
        source: cached !== null ? "cached" : "fallback",
        category: s.category,
      });
    }
  }

  return result;
}

/**
 * 获取单个交易对的价格
 */
export async function getSymbolPrice(symbol: string): Promise<number> {
  const config = symbols.find(s => s.symbol === symbol);

  if (!config) {
    return 100; // 默认价格
  }

  try {
    if (config.type === "crypto") {
      // 先尝试获取缓存价格
      const cached = getCachedPrice(symbol);
      if (cached !== null) {
        return cached.price;
      }

      // 再尝试从 API 获取
      if (config.coingeckoId) {
        const prices = await fetchCryptoPrices([config.coingeckoId]);
        if (prices.has(config.coingeckoId)) {
          const price = prices.get(config.coingeckoId)!.price;
          updatePriceCache(symbol, price, config.basePrice);
          return price;
        }
      }

      // 最后使用基准价格
      return mockPrice(config.basePrice || 100);
    } else if (config.type === "metal") {
      const data = await fetchMetal(config.goldSymbol as "XAU" | "XAG");
      updatePriceCache(symbol, data.price, config.basePrice);
      return data.price;
    } else {
      return mockPrice(config.basePrice!);
    }
  } catch {
    // 降级处理
    const cached = getCachedPrice(symbol);
    if (cached !== null) {
      return cached.price;
    }
    return mockPrice(config.basePrice || 100);
  }
}
