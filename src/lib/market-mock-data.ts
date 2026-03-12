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
  { symbol: 'EURUSD', price: getSymbolPrice('EURUSD'), source: 'mock' },
  { symbol: 'GBPUSD', price: getSymbolPrice('GBPUSD'), source: 'mock' },
  { symbol: 'USDJPY', price: getSymbolPrice('USDJPY'), source: 'mock' },
  { symbol: 'USDCHF', price: getSymbolPrice('USDCHF'), source: 'mock' },
  { symbol: 'EURAUD', price: getSymbolPrice('EURAUD'), source: 'mock' },
  { symbol: 'EURGBP', price: getSymbolPrice('EURGBP'), source: 'mock' },
  { symbol: 'EURJPY', price: getSymbolPrice('EURJPY'), source: 'mock' },
  { symbol: 'GBPAUD', price: getSymbolPrice('GBPAUD'), source: 'mock' },
  { symbol: 'GBPNZD', price: getSymbolPrice('GBPNZD'), source: 'mock' },
  { symbol: 'GBPJPY', price: getSymbolPrice('GBPJPY'), source: 'mock' },
  { symbol: 'AUDUSD', price: getSymbolPrice('AUDUSD'), source: 'mock' },
  { symbol: 'AUDJPY', price: getSymbolPrice('AUDJPY'), source: 'mock' },
  { symbol: 'NZDUSD', price: getSymbolPrice('NZDUSD'), source: 'mock' },
  { symbol: 'NZDJPY', price: getSymbolPrice('NZDJPY'), source: 'mock' },
  { symbol: 'CADJPY', price: getSymbolPrice('CADJPY'), source: 'mock' },
  { symbol: 'CHFJPY', price: getSymbolPrice('CHFJPY'), source: 'mock' },

  // Gold (Metal)
  { symbol: 'XAUUSD', price: getSymbolPrice('XAUUSD'), source: 'mock' },
  { symbol: 'XAGUSD', price: getSymbolPrice('XAGUSD'), source: 'mock' },

  // Crypto
  { symbol: 'BTCUSD', price: getSymbolPrice('BTCUSD'), source: 'mock' },
  { symbol: 'ETHUSD', price: getSymbolPrice('ETHUSD'), source: 'mock' },
  { symbol: 'LTCUSD', price: getSymbolPrice('LTCUSD'), source: 'mock' },
  { symbol: 'SOLUSD', price: getSymbolPrice('SOLUSD'), source: 'mock' },
  { symbol: 'XRPUSD', price: getSymbolPrice('XRPUSD'), source: 'mock' },
  { symbol: 'DOGEUSD', price: getSymbolPrice('DOGEUSD'), source: 'mock' },

  // Energy
  { symbol: 'NGAS', price: getSymbolPrice('NGAS'), source: 'mock' },
  { symbol: 'UKOIL', price: getSymbolPrice('UKOIL'), source: 'mock' },
  { symbol: 'USOIL', price: getSymbolPrice('USOIL'), source: 'mock' },

  // CFD (Indices)
  { symbol: 'US500', price: getSymbolPrice('US500'), source: 'mock' },
  { symbol: 'ND25', price: getSymbolPrice('ND25'), source: 'mock' },
  { symbol: 'AUS200', price: getSymbolPrice('AUS200'), source: 'mock' },
];

// 热门交易（前 4 个）
export const hotSymbols = mockSymbols.slice(0, 4);

// 按分类分组
export const symbolsByCategory = {
  forex: mockSymbols.filter(s => s.symbol.includes('USD') && !s.symbol.includes('USDT') && !s.symbol.startsWith('XA')),
  metal: mockSymbols.filter(s => s.symbol.startsWith('XA')),
  crypto: mockSymbols.filter(s => s.symbol.includes('USDT')),
};
