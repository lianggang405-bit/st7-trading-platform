/**
 * Market Engine - 统一行情引擎
 *
 * 数据源策略：
 * - Crypto → Binance API (真实数据)
 * - Metal → Gold API (真实数据)
 * - 其他 → 模拟数据
 *
 * 设计原则：
 * - 简单：代码量少，逻辑清晰
 * - 稳定：自动降级，失败不影响
 * - 统一：全站只有一个价格源
 */

type SymbolInfo = {
  symbol: string
  type: "crypto" | "metal" | "forex" | "energy" | "cfd"
  basePrice?: number
  category: "crypto" | "metal" | "forex" | "energy" | "cfd"
  binanceSymbol?: string
  goldSymbol?: string
}

// 交易对配置
const symbols: SymbolInfo[] = [
  // Crypto - 使用 Binance API
  { symbol: "BTCUSDT", type: "crypto", category: "crypto", binanceSymbol: "BTCUSDT" },
  { symbol: "ETHUSDT", type: "crypto", category: "crypto", binanceSymbol: "ETHUSDT" },
  { symbol: "LTCUSDT", type: "crypto", category: "crypto", binanceSymbol: "LTCUSDT" },
  { symbol: "SOLUSDT", type: "crypto", category: "crypto", binanceSymbol: "SOLUSDT" },
  { symbol: "XRPUSDT", type: "crypto", category: "crypto", binanceSymbol: "XRPUSDT" },
  { symbol: "DOGEUSDT", type: "crypto", category: "crypto", binanceSymbol: "DOGEUSDT" },
  { symbol: "ADAUSDT", type: "crypto", category: "crypto", binanceSymbol: "ADAUSDT" },
  { symbol: "DOTUSDT", type: "crypto", category: "crypto", binanceSymbol: "DOTUSDT" },

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
 * 从 Binance API 获取加密货币价格
 */
async function fetchCrypto(symbol: string): Promise<{ price: number; change: number }> {
  try {
    const res = await fetch(
      `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`,
      { signal: AbortSignal.timeout(5000) }
    );

    if (!res.ok) {
      throw new Error(`Binance API error: ${res.status}`);
    }

    const data = await res.json();

    return {
      price: Number(data.lastPrice),
      change: Number(data.priceChangePercent),
    };
  } catch (error) {
    console.warn(`[MarketEngine] Binance failed for ${symbol}:`, error);
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
    console.warn(`[MarketEngine] Gold API failed for ${symbol}:`, error);
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

  for (const s of symbols) {
    try {
      let price: number;
      let change: number;
      let source: string;

      if (s.type === "crypto") {
        // Crypto → Binance API
        const data = await fetchCrypto(s.binanceSymbol!);
        price = data.price;
        change = data.change;
        source = "binance";
      } else if (s.type === "metal") {
        // Metal → Gold API
        const data = await fetchMetal(s.goldSymbol as "XAU" | "XAG");
        price = data.price;
        change = data.change;
        source = "gold-api";
      } else {
        // 其他 → 模拟数据
        price = mockPrice(s.basePrice!);
        change = 0;
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
      // 降级处理：使用模拟数据
      const basePrice = s.basePrice || 100;
      const price = mockPrice(basePrice);

      console.warn(`[MarketEngine] Using fallback for ${s.symbol}`);

      result.push({
        symbol: s.symbol,
        price,
        change: 0,
        source: "fallback",
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
      const data = await fetchCrypto(config.binanceSymbol!);
      return data.price;
    } else if (config.type === "metal") {
      const data = await fetchMetal(config.goldSymbol as "XAU" | "XAG");
      return data.price;
    } else {
      return mockPrice(config.basePrice!);
    }
  } catch {
    return mockPrice(config.basePrice || 100);
  }
}
