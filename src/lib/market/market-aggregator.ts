/**
 * Market Aggregator - 统一行情聚合器
 * 
 * 功能：
 * - 从多个数据源获取行情数据
 * - 统一数据格式
 * - 支持真实数据和模拟数据
 */

export interface MarketSymbol {
  symbol: string;
  price: number;
  change: number; // 24小时涨跌幅（%）
  source: 'binance' | 'goldapi' | 'mock';
  category: 'crypto' | 'metal' | 'forex' | 'energy' | 'cfd';
}

// 交易对配置
const SYMBOLS_CONFIG: Array<{
  symbol: string;
  type: 'crypto' | 'metal' | 'forex' | 'energy' | 'cfd';
  category: 'crypto' | 'metal' | 'forex' | 'energy' | 'cfd';
  binanceSymbol?: string;
  goldSymbol?: string;
  basePrice?: number;
}> = [
  // 加密货币 - Binance API
  { symbol: 'BTCUSD', type: 'crypto', category: 'crypto', binanceSymbol: 'BTCUSDT' },
  { symbol: 'ETHUSD', type: 'crypto', category: 'crypto', binanceSymbol: 'ETHUSDT' },
  { symbol: 'LTCUSD', type: 'crypto', category: 'crypto', binanceSymbol: 'LTCUSDT' },
  { symbol: 'SOLUSD', type: 'crypto', category: 'crypto', binanceSymbol: 'SOLUSDT' },
  { symbol: 'XRPUSD', type: 'crypto', category: 'crypto', binanceSymbol: 'XRPUSDT' },
  { symbol: 'DOGEUSD', type: 'crypto', category: 'crypto', binanceSymbol: 'DOGEUSDT' },
  { symbol: 'ADAUSD', type: 'crypto', category: 'crypto', binanceSymbol: 'ADAUSDT' },
  { symbol: 'DOTUSD', type: 'crypto', category: 'crypto', binanceSymbol: 'DOTUSDT' },
  { symbol: 'LINKUSD', type: 'crypto', category: 'crypto', binanceSymbol: 'LINKUSDT' },
  { symbol: 'AVAXUSD', type: 'crypto', category: 'crypto', binanceSymbol: 'AVAXUSDT' },

  // 贵金属 - Gold API
  { symbol: 'XAUUSD', type: 'metal', category: 'metal', goldSymbol: 'XAU' },
  { symbol: 'XAGUSD', type: 'metal', category: 'metal', goldSymbol: 'XAG' },

  // 外汇 - 模拟数据
  { symbol: 'EURUSD', type: 'forex', category: 'forex', basePrice: 1.085 },
  { symbol: 'GBPUSD', type: 'forex', category: 'forex', basePrice: 1.265 },
  { symbol: 'USDJPY', type: 'forex', category: 'forex', basePrice: 149.8 },
  { symbol: 'USDCHF', type: 'forex', category: 'forex', basePrice: 0.884 },
  { symbol: 'AUDUSD', type: 'forex', category: 'forex', basePrice: 0.654 },
  { symbol: 'NZDUSD', type: 'forex', category: 'forex', basePrice: 0.608 },
  { symbol: 'USDCAD', type: 'forex', category: 'forex', basePrice: 1.365 },
  { symbol: 'EURGBP', type: 'forex', category: 'forex', basePrice: 0.858 },
  { symbol: 'EURJPY', type: 'forex', category: 'forex', basePrice: 162.5 },
  { symbol: 'GBPJPY', type: 'forex', category: 'forex', basePrice: 189.5 },
  { symbol: 'AUDJPY', type: 'forex', category: 'forex', basePrice: 98.12 },
  { symbol: 'CADJPY', type: 'forex', category: 'forex', basePrice: 110.45 },
  { symbol: 'CHFJPY', type: 'forex', category: 'forex', basePrice: 169.54 },

  // 能源 - 模拟数据
  { symbol: 'USOIL', type: 'energy', category: 'energy', basePrice: 85.0 },
  { symbol: 'UKOIL', type: 'energy', category: 'energy', basePrice: 88.0 },
  { symbol: 'NGAS', type: 'energy', category: 'energy', basePrice: 2.8 },

  // 指数 - 模拟数据
  { symbol: 'US500', type: 'cfd', category: 'cfd', basePrice: 5200 },
  { symbol: 'ND100', type: 'cfd', category: 'cfd', basePrice: 18500 },
  { symbol: 'AUS200', type: 'cfd', category: 'cfd', basePrice: 7800 },
  { symbol: 'UK100', type: 'cfd', category: 'cfd', basePrice: 8100 },
  { symbol: 'GER40', type: 'cfd', category: 'cfd', basePrice: 17800 },
  { symbol: 'JPN225', type: 'cfd', category: 'cfd', basePrice: 40000 },
];

/**
 * 从 Binance API 获取加密货币价格
 */
async function fetchBinancePrice(symbol: string): Promise<{ price: number; change: number }> {
  try {
    const response = await fetch(
      `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`,
      { signal: AbortSignal.timeout(5000) }
    );

    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      price: Number(data.lastPrice),
      change: Number(data.priceChangePercent),
    };
  } catch (error) {
    console.warn(`[MarketAggregator] Failed to fetch from Binance for ${symbol}:`, error);
    throw error;
  }
}

/**
 * 从 Gold API 获取贵金属价格
 */
async function fetchGoldPrice(symbol: 'XAU' | 'XAG'): Promise<{ price: number; change: number }> {
  try {
    const response = await fetch(
      `https://api.gold-api.com/price/${symbol}`,
      { signal: AbortSignal.timeout(5000) }
    );

    if (!response.ok) {
      throw new Error(`Gold API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      price: data.price,
      change: data.change || 0,
    };
  } catch (error) {
    console.warn(`[MarketAggregator] Failed to fetch from Gold API for ${symbol}:`, error);
    throw error;
  }
}

/**
 * 生成模拟价格（用于外汇、能源、指数）
 */
function generateMockPrice(config: any): { price: number; change: number } {
  const basePrice = config.basePrice;
  
  // 基于时间的动态波动
  const now = Date.now();
  const timeFactor = Math.floor(now / 1000);
  
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
  const randomFactor = Math.sin(timeFactor + config.symbol.length) * volatility;
  const dynamicPrice = basePrice + randomFactor;
  
  // 动态涨跌幅
  const dynamicChange = Math.cos(timeFactor / 10) * 0.5;

  return {
    price: dynamicPrice,
    change: dynamicChange,
  };
}

/**
 * 获取单个交易对的数据
 */
async function fetchSymbolData(config: any): Promise<MarketSymbol> {
  try {
    let price = 0;
    let change = 0;
    let source: MarketSymbol['source'] = 'mock';

    // Crypto - Binance API
    if (config.type === 'crypto') {
      try {
        const data = await fetchBinancePrice(config.binanceSymbol);
        price = data.price;
        change = data.change;
        source = 'binance';
      } catch (error) {
        console.warn(`[MarketAggregator] Binance failed for ${config.symbol}, using fallback`);
        // 降级使用模拟数据
        const mockData = generateMockPrice({ ...config, basePrice: config.basePrice || 50000 });
        price = mockData.price;
        change = mockData.change;
      }
    }
    // Metal - Gold API
    else if (config.type === 'metal') {
      try {
        const data = await fetchGoldPrice(config.goldSymbol);
        price = data.price;
        change = data.change;
        source = 'goldapi';
      } catch (error) {
        console.warn(`[MarketAggregator] Gold API failed for ${config.symbol}, using fallback`);
        // 降级使用模拟数据
        const mockData = generateMockPrice({ ...config, basePrice: config.basePrice || 2000 });
        price = mockData.price;
        change = mockData.change;
      }
    }
    // Forex/Energy/Index - 模拟数据
    else {
      const mockData = generateMockPrice(config);
      price = mockData.price;
      change = mockData.change;
      source = 'mock';
    }

    return {
      symbol: config.symbol,
      price,
      change,
      source,
      category: config.category,
    };
  } catch (error) {
    console.error(`[MarketAggregator] Failed to fetch ${config.symbol}:`, error);
    // 返回默认值
    return {
      symbol: config.symbol,
      price: config.basePrice || 100,
      change: 0,
      source: 'mock',
      category: config.category,
    };
  }
}

/**
 * 获取所有交易对数据
 */
export async function fetchMarketData(): Promise<MarketSymbol[]> {
  console.log('[MarketAggregator] Fetching market data...');
  
  try {
    // 并行获取所有交易对数据
    const results = await Promise.all(
      SYMBOLS_CONFIG.map(config => fetchSymbolData(config))
    );

    console.log(`[MarketAggregator] Fetched ${results.length} symbols`);
    return results;
  } catch (error) {
    console.error('[MarketAggregator] Failed to fetch market data:', error);
    // 返回默认数据
    return SYMBOLS_CONFIG.map(config => ({
      symbol: config.symbol,
      price: config.basePrice || 100,
      change: 0,
      source: 'mock',
      category: config.category,
    }));
  }
}
