/**
 * Metals-API 配置
 * 用于获取真实的黄金、白银等贵金属价格
 *
 * API 文档: https://metals-api.com
 */

export interface MetalsRate {
  symbol: string;
  rate: number;
  price: number; // 换算后的价格
  timestamp: number;
}

export interface MetalsApiResponse {
  success: boolean;
  timestamp?: number;
  base: string;
  date?: string;
  rates: {
    [symbol: string]: number;
  };
  error?: {
    code: number;
    type: string;
    info?: string;
  };
}

/**
 * Metals-API 配置
 */
export const METALS_API_CONFIG = {
  // API 端点
  baseUrl: 'https://api.metals-api.com/v1',

  // 默认基准货币
  base: 'USD',

  // 支持的贵金属符号
  symbols: ['XAU', 'XAG', 'XPT', 'XPD'], // 黄金、白银、铂金、钯金

  // 超时时间（毫秒）
  timeout: 10000,

  // 缓存时间（毫秒）
  cacheTTL: 30000, // 30秒
};

/**
 * 从环境变量获取 API Key
 */
export function getMetalsApiKey(): string | null {
  return process.env.METALS_API_KEY || null;
}

/**
 * 检查 Metals-API 是否已配置
 */
export function isMetalsApiConfigured(): boolean {
  return !!getMetalsApiKey();
}

/**
 * 换算 Metals-API 返回的汇率为价格
 *
 * Metals-API 返回的汇率格式：XAU: 0.000196
 * 表示：0.000196 盎司黄金 = 1 美元
 * 换算：1 盎司黄金 = 1 / 0.000196 ≈ 5102 美元
 *
 * @param symbol 贵金属符号（XAU, XAG 等）
 * @param rate Metals-API 返回的汇率
 * @returns 换算后的价格（美元/盎司）
 */
export function convertRateToPrice(symbol: string, rate: number): number {
  if (rate <= 0) {
    console.warn(`[Metals-API] Invalid rate for ${symbol}: ${rate}`);
    return 0;
  }

  const price = 1 / rate;
  return price;
}

/**
 * 将 Metals-API 符号转换为系统使用的符号
 * Metals-API: XAU → 系统: XAUUSD
 * Metals-API: XAG → 系统: XAGUSD
 */
export function metalsSymbolToSystemSymbol(symbol: string): string {
  const symbolMap: Record<string, string> = {
    'XAU': 'XAUUSD', // 黄金
    'XAG': 'XAGUSD', // 白银
    'XPT': 'XPTUSD', // 铂金
    'XPD': 'XPDUSD', // 钯金
  };

  return symbolMap[symbol] || symbol + 'USD';
}

/**
 * 将系统符号转换为 Metals-API 符号
 */
export function systemSymbolToMetalsSymbol(symbol: string): string {
  if (symbol.endsWith('USD')) {
    return symbol.replace('USD', '');
  }
  return symbol;
}
