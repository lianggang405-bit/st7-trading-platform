import { TradingSymbol } from '../stores/marketStore';
import { realTimePrices } from './real-time-prices';

/**
 * Mock 数据：备用交易对数据
 *
 * 注意：这是备用数据，用于在 API 不可用时使用。
 * 实际生产环境中，交易对数据应该从数据库（Supabase）获取。
 *
 * API 端点：GET /api/trading/symbols
 * 数据源：Supabase trading_pairs 表
 *
 * 当更新交易对时，请确保：
 * 1. 在 Supabase 数据库中更新 trading_pairs 表
 * 2. 如果需要，也可以更新此文件作为备用数据
 * 3. 确保前后端使用相同的数据源（Supabase）
 */

// 从 real-time-prices.ts 中获取价格映射
function getPriceMap(): Record<string, number> {
  const map: Record<string, number> = {};
  realTimePrices.forEach(p => {
    map[p.symbol] = p.price;
  });
  return map;
}

const priceMap = getPriceMap();

// 获取交易对价格，如果不存在则使用默认价格
function getSymbolPrice(symbol: string): number {
  return priceMap[symbol] || 100;
}

// Mock 数据：所有交易对
// ✅ 价格从 real-time-prices.ts 获取，确保备用数据也是合理的
export const mockSymbols: TradingSymbol[] = [
  // Forex
  { symbol: 'EURUSD', price: getSymbolPrice('EURUSD'), change: 0.12, category: 'forex' },
  { symbol: 'GBPUSD', price: getSymbolPrice('GBPUSD'), change: 0.08, category: 'forex' },
  { symbol: 'USDJPY', price: getSymbolPrice('USDJPY'), change: 0.15, category: 'forex' },
  { symbol: 'USDCHF', price: getSymbolPrice('USDCHF'), change: -0.05, category: 'forex' },
  { symbol: 'EURAUD', price: getSymbolPrice('EURAUD'), change: 0.10, category: 'forex' },
  { symbol: 'EURGBP', price: getSymbolPrice('EURGBP'), change: 0.02, category: 'forex' },
  { symbol: 'EURJPY', price: getSymbolPrice('EURJPY'), change: 0.18, category: 'forex' },
  { symbol: 'GBPAUD', price: getSymbolPrice('GBPAUD'), change: -0.03, category: 'forex' },
  { symbol: 'GBPNZD', price: getSymbolPrice('GBPNZD'), change: 0.07, category: 'forex' },
  { symbol: 'GBPJPY', price: getSymbolPrice('GBPJPY'), change: 0.12, category: 'forex' },
  { symbol: 'AUDUSD', price: getSymbolPrice('AUDUSD'), change: -0.08, category: 'forex' },
  { symbol: 'AUDJPY', price: getSymbolPrice('AUDJPY'), change: 0.09, category: 'forex' },
  { symbol: 'NZDUSD', price: getSymbolPrice('NZDUSD'), change: -0.12, category: 'forex' },
  { symbol: 'NZDJPY', price: getSymbolPrice('NZDJPY'), change: -0.03, category: 'forex' },
  { symbol: 'CADJPY', price: getSymbolPrice('CADJPY'), change: 0.06, category: 'forex' },
  { symbol: 'CHFJPY', price: getSymbolPrice('CHFJPY'), change: 0.14, category: 'forex' },

  // Gold
  { symbol: 'XAUUSD', price: getSymbolPrice('XAUUSD'), change: 0.45, category: 'gold' },
  { symbol: 'XAGUSD', price: getSymbolPrice('XAGUSD'), change: -0.23, category: 'gold' },

  // Crypto
  { symbol: 'BTCUSD', price: getSymbolPrice('BTCUSD'), change: -2.34, category: 'crypto' },
  { symbol: 'ETHUSD', price: getSymbolPrice('ETHUSD'), change: 1.23, category: 'crypto' },
  { symbol: 'LTCUSD', price: getSymbolPrice('LTCUSD'), change: -0.56, category: 'crypto' },
  { symbol: 'SOLUSD', price: getSymbolPrice('SOLUSD'), change: 3.45, category: 'crypto' },
  { symbol: 'XRPUSD', price: getSymbolPrice('XRPUSD'), change: 0.89, category: 'crypto' },
  { symbol: 'DOGEUSD', price: getSymbolPrice('DOGEUSD'), change: -1.23, category: 'crypto' },

  // Energy (CFD)
  { symbol: 'NGAS', price: getSymbolPrice('NGAS'), change: 0.56, category: 'forex' },
  { symbol: 'UKOIL', price: getSymbolPrice('UKOIL'), change: -0.34, category: 'forex' },
  { symbol: 'USOIL', price: getSymbolPrice('USOIL'), change: 0.23, category: 'forex' },

  // Indices (CFD)
  { symbol: 'US500', price: getSymbolPrice('US500'), change: 0.67, category: 'forex' },
  { symbol: 'ND25', price: getSymbolPrice('ND25'), change: -0.45, category: 'forex' },
  { symbol: 'AUS200', price: getSymbolPrice('AUS200'), change: 0.12, category: 'forex' },
];

// 热门交易（前 4 个）
export const hotSymbols = mockSymbols.slice(0, 4);

// 按分类分组
export const symbolsByCategory = {
  forex: mockSymbols.filter(s => s.category === 'forex'),
  gold: mockSymbols.filter(s => s.category === 'gold'),
  crypto: mockSymbols.filter(s => s.category === 'crypto'),
};
