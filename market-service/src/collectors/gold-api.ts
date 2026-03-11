/**
 * Gold API 数据收集器（完全免费）
 *
 * 官网: https://www.gold-api.com
 * 
 * 特点：
 * - 完全免费
 * - 不需要 API key
 * - 实时价格
 * - 无限请求
 * 
 * 支持：
 * - XAU: 黄金
 * - XAG: 白银
 * - XPD: 钯金
 * - XPT: 铂金
 */

const GOLD_API_BASE_URL = 'https://api.gold-api.com';

/**
 * Gold API 返回的数据格式
 */
interface GoldApiResponse {
  price: number;
  symbol: string;
  currency?: string;
  timestamp?: number;
}

/**
 * 转换 Gold API 符号到系统符号
 */
function goldApiSymbolToSystem(symbol: string): string {
  const symbolMap: Record<string, string> = {
    'XAU': 'XAUUSD',
    'XAG': 'XAGUSD',
    'XPD': 'XPDUSD',
    'XPT': 'XPTUSD',
  };

  return symbolMap[symbol] || `${symbol}USD`;
}

/**
 * 转换系统符号到 Gold API 符号
 */
function systemSymbolToGoldApi(symbol: string): string {
  return symbol.replace('USD', '');
}

/**
 * 获取贵金属的实时价格
 * 
 * @param symbol 系统符号（如 XAUUSD, XAGUSD）
 * @returns 价格
 */
export async function getGoldApiPrice(symbol: string): Promise<number | null> {
  try {
    const goldSymbol = systemSymbolToGoldApi(symbol);
    const url = `${GOLD_API_BASE_URL}/price/${goldSymbol}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(5000), // 5秒超时
    });

    if (!response.ok) {
      console.warn(`[GoldAPI] Failed to fetch ${symbol}: HTTP ${response.status}`);
      return null;
    }

    const data = await response.json() as GoldApiResponse;

    if (!data.price || isNaN(data.price)) {
      console.warn(`[GoldAPI] Invalid price for ${symbol}:`, data);
      return null;
    }

    console.log(`[GoldAPI] ✅ ${symbol}: $${data.price.toFixed(2)}`);

    return data.price;

  } catch (error) {
    console.error(`[GoldAPI] ❌ Error fetching ${symbol}:`, error);
    return null;
  }
}

/**
 * 批量获取所有贵金属价格
 * 
 * @returns 价格映射表 {symbol: price}
 */
export async function getAllGoldApiPrices(): Promise<Map<string, number>> {
  const prices = new Map<string, number>();

  const symbols = ['XAU', 'XAG', 'XPD', 'XPT'];

  // 并发获取所有价格
  const promises = symbols.map(async (goldSymbol) => {
    const systemSymbol = goldApiSymbolToSystem(goldSymbol);
    const price = await getGoldApiPrice(systemSymbol);
    if (price !== null) {
      prices.set(systemSymbol, price);
    }
  });

  await Promise.all(promises);

  console.log(`[GoldAPI] ✅ Fetched ${prices.size} metals prices`);

  return prices;
}

/**
 * Gold API 收集器类（用于定时刷新）
 */
export class GoldApiCollector {
  private prices: Map<string, number> = new Map();
  private lastUpdateTime: number = 0;
  private intervalMs: number; // 刷新间隔（毫秒）

  constructor(intervalMs: number = 10000) { // 默认 10 秒
    this.intervalMs = intervalMs;
  }

  /**
   * 启动收集器
   */
  public async start(): Promise<void> {
    console.log(`[GoldAPI] Starting collector (interval: ${this.intervalMs / 1000}s)`);

    // 立即获取一次
    await this.fetchPrices();

    // 定时刷新
    setInterval(async () => {
      await this.fetchPrices();
    }, this.intervalMs);
  }

  /**
   * 获取价格
   */
  public async fetchPrices(): Promise<void> {
    const prices = await getAllGoldApiPrices();

    if (prices.size > 0) {
      this.prices = prices;
      this.lastUpdateTime = Date.now();
    }
  }

  /**
   * 获取缓存的价格
   */
  public getPrice(symbol: string): number | null {
    return this.prices.get(symbol) || null;
  }

  /**
   * 获取所有缓存的价格
   */
  public getAllPrices(): Map<string, number> {
    return new Map(this.prices);
  }

  /**
   * 获取最后更新时间
   */
  public getLastUpdateTime(): number {
    return this.lastUpdateTime;
  }
}
