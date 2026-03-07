import { TradingSymbol } from '../stores/marketStore';

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

// Mock 数据：所有交易对
// ⚠️ 注意：初始价格设为 0，等待实时数据更新
export const mockSymbols: TradingSymbol[] = [
  // Forex
  { symbol: 'EURUSD', price: 0, change: 0, category: 'forex' },
  { symbol: 'GBPUSD', price: 0, change: 0, category: 'forex' },
  { symbol: 'USDJPY', price: 0, change: 0, category: 'forex' },
  { symbol: 'USDCHF', price: 0, change: 0, category: 'forex' },
  { symbol: 'EURAUD', price: 0, change: 0, category: 'forex' },
  { symbol: 'EURGBP', price: 0, change: 0, category: 'forex' },
  { symbol: 'EURJPY', price: 0, change: 0, category: 'forex' },
  { symbol: 'GBPAUD', price: 0, change: 0, category: 'forex' },
  { symbol: 'GBPNZD', price: 0, change: 0, category: 'forex' },
  { symbol: 'GBPJPY', price: 0, change: 0, category: 'forex' },
  { symbol: 'AUDUSD', price: 0, change: 0, category: 'forex' },
  { symbol: 'AUDJPY', price: 0, change: 0, category: 'forex' },
  { symbol: 'NZDUSD', price: 0, change: 0, category: 'forex' },
  { symbol: 'NZDJPY', price: 0, change: 0, category: 'forex' },
  { symbol: 'CADJPY', price: 0, change: 0, category: 'forex' },
  { symbol: 'CHFJPY', price: 0, change: 0, category: 'forex' },

  // Gold
  { symbol: 'XAUUSD', price: 0, change: 0, category: 'gold' },
  { symbol: 'XAGUSD', price: 0, change: 0, category: 'gold' },

  // Crypto
  { symbol: 'BTCUSD', price: 0, change: 0, category: 'crypto' },
  { symbol: 'ETHUSD', price: 0, change: 0, category: 'crypto' },
  { symbol: 'LTCUSD', price: 0, change: 0, category: 'crypto' },
  { symbol: 'SOLUSD', price: 0, change: 0, category: 'crypto' },
  { symbol: 'XRPUSD', price: 0, change: 0, category: 'crypto' },
  { symbol: 'DOGEUSD', price: 0, change: 0, category: 'crypto' },

  // Energy (CFD)
  { symbol: 'NGAS', price: 0, change: 0, category: 'forex' },
  { symbol: 'UKOIL', price: 0, change: 0, category: 'forex' },
  { symbol: 'USOIL', price: 0, change: 0, category: 'forex' },

  // Indices (CFD)
  { symbol: 'US500', price: 0, change: 0, category: 'forex' },
  { symbol: 'ND25', price: 0, change: 0, category: 'forex' },
  { symbol: 'AUS200', price: 0, change: 0, category: 'forex' },
];

// 热门交易（前 4 个）
export const hotSymbols = mockSymbols.slice(0, 4);

// 按分类分组
export const symbolsByCategory = {
  forex: mockSymbols.filter(s => s.category === 'forex'),
  gold: mockSymbols.filter(s => s.category === 'gold'),
  crypto: mockSymbols.filter(s => s.category === 'crypto'),
};
