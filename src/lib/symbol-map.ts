/**
 * 交易对映射配置
 * 统一前端交易对格式，后端自动选择数据源
 */

// 数据源类型
export type DataSource = 'binance' | 'gold' | 'forex' | 'crypto' | 'energy' | 'cfd';

// 交易对 -> 数据源映射
export const SYMBOL_SOURCE: Record<string, DataSource> = {
  // 加密货币 - Binance
  BTCUSD: 'binance',
  ETHUSD: 'binance',
  BNBUSD: 'binance',
  LTCUSD: 'binance',
  SOLUSD: 'binance',
  XRPUSD: 'binance',
  DOGEUSD: 'binance',
  ADAUSD: 'binance',
  DOTUSD: 'binance',

  // 贵金属 - 模拟数据（Twelve Data 需要 API Key）
  XAUUSD: 'gold',
  XAGUSD: 'gold',

  // 外汇 - 模拟数据（OANDA 需要 API Key）
  EURUSD: 'forex',
  GBPUSD: 'forex',
  USDJPY: 'forex',
  USDCHF: 'forex',
  EURAUD: 'forex',
  EURGBP: 'forex',
  EURJPY: 'forex',
  GBPAUD: 'forex',
  GBPNZD: 'forex',
  GBPJPY: 'forex',
  AUDUSD: 'forex',
  AUDJPY: 'forex',
  NZDUSD: 'forex',
  NZDJPY: 'forex',
  CADJPY: 'forex',
  CHFJPY: 'forex',

  // 能源 - 模拟数据
  UKOIL: 'energy',
  USOIL: 'energy',
  NGAS: 'energy',

  // 指数 - 模拟数据
  US500: 'cfd',
  ND25: 'cfd',
  AUS200: 'cfd',
};

// 交易对 -> Binance 交易对映射
export const BINANCE_SYMBOL_MAP: Record<string, string> = {
  BTCUSD: 'BTCUSDT',
  ETHUSD: 'ETHUSDT',
  BNBUSD: 'BNBUSDT',
  LTCUSD: 'LTCUSDT',
  SOLUSD: 'SOLUSDT',
  XRPUSD: 'XRPUSDT',
  DOGEUSD: 'DOGEUSDT',
  ADAUSD: 'ADAUSDT',
  DOTUSD: 'DOTUSDT',
};

// 时间周期映射（统一格式 -> API 格式）
export const INTERVAL_MAP: Record<string, string> = {
  '1M': '1m',
  '5M': '5m',
  '15M': '15m',
  '30M': '30m',
  '1H': '1h',
  '4H': '4h',
  '1D': '1d',
};

// 统一的K线数据格式
export interface UnifiedKline {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * 检查交易对是否支持
 */
export function isSymbolSupported(symbol: string): boolean {
  return symbol in SYMBOL_SOURCE;
}

/**
 * 获取交易对数据源
 */
export function getSymbolSource(symbol: string): DataSource {
  return SYMBOL_SOURCE[symbol] || 'binance';
}

/**
 * 获取 Binance 交易对格式
 */
export function getBinanceSymbol(symbol: string): string {
  return BINANCE_SYMBOL_MAP[symbol] || symbol.replace('USD', 'USDT');
}

/**
 * 获取统一的时间周期格式
 */
export function getUnifiedInterval(interval: string): string {
  return INTERVAL_MAP[interval] || interval.toLowerCase();
}
