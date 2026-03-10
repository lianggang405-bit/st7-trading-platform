/**
 * Exchange Rate API 收集器（外汇完全免费）
 *
 * 官网: https://open.er-api.com
 * 
 * 特点：
 * - 完全免费
 * - 不需要 API key
 * - 实时汇率
 * - 稳定可靠
 * 
 * 支持：
 * - EUR, GBP, JPY, CHF, AUD, NZD, CAD 等 160+ 货币
 */

const EXCHANGE_RATE_API_BASE_URL = 'https://open.er-api.com/v6/latest';

/**
 * Exchange Rate API 返回的数据格式
 */
interface ExchangeRateApiResponse {
  result: string;
  time_last_update_unix: number;
  base_code: string;
  rates: Record<string, number>;
}

/**
 * 外汇交易对列表（相对于 USD）
 */
const FOREX_PAIRS = [
  'EUR', // 欧元
  'GBP', // 英镑
  'JPY', // 日元
  'CHF', // 瑞士法郎
  'AUD', // 澳元
  'NZD', // 纽元
  'CAD', // 加元
];

/**
 * 转换货币代码到系统符号
 */
function currencyCodeToSystem(currency: string): string {
  return `${currency}USD`;
}

/**
 * 转换系统符号到货币代码
 */
function systemSymbolToCurrency(symbol: string): string {
  return symbol.replace('USD', '');
}

/**
 * 获取所有外汇汇率（相对于 USD）
 * 
 * @returns 汇率映射表 {symbol: rate}
 */
export async function getExchangeRates(): Promise<Map<string, number>> {
  try {
    const url = `${EXCHANGE_RATE_API_BASE_URL}/USD`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(5000), // 5秒超时
    });

    if (!response.ok) {
      console.warn(`[ExchangeRateAPI] Failed to fetch rates: HTTP ${response.status}`);
      return new Map();
    }

    const data: ExchangeRateApiResponse = await response.json();

    if (data.result !== 'success') {
      console.warn(`[ExchangeRateAPI] API returned: ${data.result}`);
      return new Map();
    }

    const rates = new Map<string, number>();

    for (const currency of FOREX_PAIRS) {
      const rate = data.rates[currency];

      if (rate !== undefined && !isNaN(rate)) {
        const symbol = currencyCodeToSystem(currency);
        rates.set(symbol, rate);

        console.log(`[ExchangeRateAPI] ✅ ${symbol}: ${rate.toFixed(6)}`);
      }
    }

    // 对于 JPY，需要特殊处理（USD/JPY 是 JPY 的倒数）
    if (rates.has('JPYUSD')) {
      const jpyRate = rates.get('JPYUSD')!;
      rates.set('USDJPY', 1 / jpyRate);
      console.log(`[ExchangeRateAPI] ✅ USDJPY: ${(1 / jpyRate).toFixed(6)}`);
    }

    console.log(`[ExchangeRateAPI] ✅ Fetched ${rates.size} exchange rates`);

    return rates;

  } catch (error) {
    console.error('[ExchangeRateAPI] ❌ Error fetching rates:', error);
    return new Map();
  }
}

/**
 * 计算交叉汇率（如 EURJPY = EUR/USD * USD/JPY）
 * 
 * @param base 基础货币（如 EUR）
 * @param quote 报价货币（如 JPY）
 * @param usdRates USD 汇率表
 * @returns 交叉汇率
 */
export function calculateCrossRate(
  base: string,
  quote: string,
  usdRates: Map<string, number>
): number | null {
  const baseSymbol = currencyCodeToSystem(base);
  const quoteSymbol = currencyCodeToSystem(quote);
  const usdSymbol = 'USDJPY';

  const baseRate = usdRates.get(baseSymbol);
  const quoteRate = usdRates.get(quoteSymbol);
  const usdRate = usdRates.get(usdSymbol);

  if (!baseRate || !quoteRate || !usdRate) {
    return null;
  }

  // 交叉汇率计算
  let crossRate: number;

  if (base === 'USD') {
    crossRate = usdRate;
  } else if (quote === 'USD') {
    crossRate = baseRate;
  } else {
    // EURJPY = EUR/USD * USD/JPY
    crossRate = baseRate * usdRate;
  }

  return crossRate;
}

/**
 * Exchange Rate API 收集器类（用于定时刷新）
 */
export class ExchangeRateCollector {
  private rates: Map<string, number> = new Map();
  private lastUpdateTime: number = 0;
  private intervalMs: number; // 刷新间隔（毫秒）

  constructor(intervalMs: number = 30000) { // 默认 30 秒
    this.intervalMs = intervalMs;
  }

  /**
   * 启动收集器
   */
  public async start(): Promise<void> {
    console.log(`[ExchangeRateAPI] Starting collector (interval: ${this.intervalMs / 1000}s)`);

    // 立即获取一次
    await this.fetchRates();

    // 定时刷新
    setInterval(async () => {
      await this.fetchRates();
    }, this.intervalMs);
  }

  /**
   * 获取汇率
   */
  public async fetchRates(): Promise<void> {
    const rates = await getExchangeRates();

    if (rates.size > 0) {
      this.rates = rates;
      this.lastUpdateTime = Date.now();
    }
  }

  /**
   * 获取缓存的汇率
   */
  public getRate(symbol: string): number | null {
    return this.rates.get(symbol) || null;
  }

  /**
   * 获取所有缓存的汇率
   */
  public getAllRates(): Map<string, number> {
    return new Map(this.rates);
  }

  /**
   * 获取最后更新时间
   */
  public getLastUpdateTime(): number {
    return this.lastUpdateTime;
  }
}
