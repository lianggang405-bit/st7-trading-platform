/**
 * Oil Price API 收集器（能源 - 原油）
 *
 * 官网: https://api.oilpriceapi.com
 * 
 * 备选：抓取 investing.com
 * 
 * 特点：
 * - 完全免费（investing.com）
 * - 实时价格
 * - 支持原油、天然气
 * 
 * 支持：
 * - WTI 原油 (USOIL)
 * - 布伦特原油 (UKOIL)
 * - 天然气 (NGAS)
 */

import { getSupabase } from '../config/database';

/**
 * 从 Investing.com 抓取原油价格（免费方案）
 */
export async function getOilPriceFromInvesting(symbol: string): Promise<number | null> {
  try {
    // Investing.com 商品页面 URL 映射
    const investingUrls: Record<string, string> = {
      'USOIL': 'https://www.investing.com/commodities/crude-oil-wti',
      'UKOIL': 'https://www.investing.com/commodities/brent-oil',
      'NGAS': 'https://www.investing.com/commodities/natural-gas',
    };

    const url = investingUrls[symbol];
    if (!url) {
      console.warn(`[OilPriceAPI] No investing.com URL for ${symbol}`);
      return null;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(10000), // 10秒超时
    });

    if (!response.ok) {
      console.warn(`[OilPriceAPI] Failed to fetch ${symbol}: HTTP ${response.status}`);
      return null;
    }

    const html = await response.text();

    // 使用正则表达式提取价格
    // Investing.com 的价格通常在 data-last 属性中
    const priceMatch = html.match(/data-last="(\d+\.?\d*)"/);

    if (!priceMatch) {
      console.warn(`[OilPriceAPI] Could not extract price for ${symbol}`);
      return null;
    }

    const price = parseFloat(priceMatch[1]);

    if (isNaN(price)) {
      console.warn(`[OilPriceAPI] Invalid price for ${symbol}: ${priceMatch[1]}`);
      return null;
    }

    console.log(`[OilPriceAPI] ✅ ${symbol}: $${price.toFixed(2)}`);

    return price;

  } catch (error) {
    console.error(`[OilPriceAPI] ❌ Error fetching ${symbol}:`, error);
    return null;
  }
}

/**
 * 批量获取所有能源价格
 * 
 * @returns 价格映射表 {symbol: price}
 */
export async function getAllOilPrices(): Promise<Map<string, number>> {
  const prices = new Map<string, number>();

  const symbols = ['USOIL', 'UKOIL', 'NGAS'];

  // 串行获取（避免被 investing.com 封禁）
  for (const symbol of symbols) {
    const price = await getOilPriceFromInvesting(symbol);
    if (price !== null) {
      prices.set(symbol, price);
    }
    
    // 延迟 1 秒，避免请求过快
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`[OilPriceAPI] ✅ Fetched ${prices.size} oil prices`);

  return prices;
}

/**
 * 从数据库获取能源价格（备用方案）
 */
export async function getOilPriceFromDatabase(symbol: string): Promise<number | null> {
  try {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('klines')
      .select('close')
      .eq('symbol', symbol)
      .order('open_time', { ascending: false })
      .limit(1);

    if (error) {
      console.error(`[OilPriceAPI] ❌ Failed to fetch ${symbol} from database:`, error.message);
      return null;
    }

    if (data && data.length > 0) {
      return data[0].close;
    }

    return null;
  } catch (error) {
    console.error(`[OilPriceAPI] ❌ Error fetching ${symbol} from database:`, error);
    return null;
  }
}

/**
 * Oil Price API 收集器类（用于定时刷新）
 */
export class OilPriceCollector {
  private prices: Map<string, number> = new Map();
  private lastUpdateTime: number = 0;
  private intervalMs: number; // 刷新间隔（毫秒）

  constructor(intervalMs: number = 60000) { // 默认 60 秒
    this.intervalMs = intervalMs;
  }

  /**
   * 启动收集器
   */
  public async start(): Promise<void> {
    console.log(`[OilPriceAPI] Starting collector (interval: ${this.intervalMs / 1000}s)`);

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
    // 先尝试从 Investing.com 获取
    let prices = await getAllOilPrices();

    // 如果失败，降级到数据库
    if (prices.size === 0) {
      console.log('[OilPriceAPI] ⚠️ Investing.com failed, fallback to database');

      for (const symbol of ['USOIL', 'UKOIL', 'NGAS']) {
        const price = await getOilPriceFromDatabase(symbol);
        if (price !== null && price > 0) {
          prices.set(symbol, price);
        }
      }
    }

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
