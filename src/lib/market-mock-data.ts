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
export const mockSymbols: TradingSymbol[] = [
  // Forex
  { symbol: 'EURUSD', price: 1.0856, change: 0.25, category: 'forex' },
  { symbol: 'GBPUSD', price: 1.2654, change: -0.18, category: 'forex' },
  { symbol: 'USDJPY', price: 149.82, change: 0.42, category: 'forex' },
  { symbol: 'USDCHF', price: 0.8842, change: -0.12, category: 'forex' },
  { symbol: 'EURAUD', price: 1.6523, change: 0.15, category: 'forex' },
  { symbol: 'EURGBP', price: 0.8574, change: -0.08, category: 'forex' },
  { symbol: 'EURJPY', price: 162.45, change: 0.32, category: 'forex' },
  { symbol: 'GBPAUD', price: 1.9234, change: -0.22, category: 'forex' },
  { symbol: 'GBPNZD', price: 2.0856, change: 0.18, category: 'forex' },
  { symbol: 'GBPJPY', price: 189.67, change: 0.25, category: 'forex' },
  { symbol: 'AUDUSD', price: 0.6543, change: -0.15, category: 'forex' },
  { symbol: 'AUDJPY', price: 98.12, change: 0.28, category: 'forex' },
  { symbol: 'NZDUSD', price: 0.6089, change: -0.12, category: 'forex' },
  { symbol: 'NZDJPY', price: 91.23, change: 0.35, category: 'forex' },
  { symbol: 'CADJPY', price: 110.45, change: 0.22, category: 'forex' },
  { symbol: 'CHFJPY', price: 169.54, change: -0.18, category: 'forex' },
  
  // Gold
  { symbol: 'XAUUSD', price: 2850.00, change: 0.45, category: 'gold' },
  { symbol: 'XAGUSD', price: 32.50, change: -0.25, category: 'gold' },
  
  // Crypto
  { symbol: 'BTCUSD', price: 98500.00, change: 1.25, category: 'crypto' },
  { symbol: 'ETHUSD', price: 3250.00, change: 0.85, category: 'crypto' },
  { symbol: 'LTCUSD', price: 95.00, change: -0.45, category: 'crypto' },
  { symbol: 'SOLUSD', price: 145.00, change: 2.15, category: 'crypto' },
  { symbol: 'XRPUSD', price: 2.15, change: -0.65, category: 'crypto' },
  { symbol: 'DOGEUSD', price: 0.18, change: 1.15, category: 'crypto' },
  
  // Energy (CFD)
  { symbol: 'NGAS', price: 3.15, change: -1.85, category: 'forex' },
  { symbol: 'UKOIL', price: 82.50, change: 0.65, category: 'forex' },
  { symbol: 'USOIL', price: 80.25, change: 0.45, category: 'forex' },
  
  // Indices (CFD)
  { symbol: 'US500', price: 5250.00, change: 0.35, category: 'forex' },
  { symbol: 'ND25', price: 18500.00, change: 0.45, category: 'forex' },
  { symbol: 'AUS200', price: 8125.00, change: -0.15, category: 'forex' },
];

// 热门交易（前 4 个）
export const hotSymbols = mockSymbols.slice(0, 4);

// 按分类分组
export const symbolsByCategory = {
  forex: mockSymbols.filter(s => s.category === 'forex'),
  gold: mockSymbols.filter(s => s.category === 'gold'),
  crypto: mockSymbols.filter(s => s.category === 'crypto'),
};
