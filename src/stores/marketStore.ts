import { create } from 'zustand';

/**
 * 获取交易对的初始价格（模拟真实市场价格）
 */
const getInitialPrice = (symbol: string): number => {
  const priceMap: Record<string, number> = {
    // Forex
    'EURUSD': 1.08563,
    'GBPUSD': 1.26345,
    'USDJPY': 149.826,
    'USDCHF': 0.88945,
    'EURAUD': 1.65432,
    'EURGBP': 0.85890,
    'EURJPY': 162.567,
    'GBPAUD': 1.92345,
    'GBPNZD': 2.08765,
    'GBPJPY': 189.234,
    'AUDUSD': 0.65432,
    'AUDJPY': 98.123,
    'NZDUSD': 0.61234,
    'NZDJPY': 91.765,
    'CADJPY': 109.876,
    'CHFJPY': 168.543,
    // Gold
    'XAUUSD': 2345.67,
    'XAGUSD': 28.45,
    // Crypto
    'BTCUSD': 67890.50,
    'ETHUSD': 3456.78,
    'LTCUSD': 89.45,
    'SOLUSD': 178.23,
    'XRPUSD': 2.34,
    'DOGEUSD': 0.45,
    // Energy
    'NGAS': 2.345,
    'UKOIL': 78.56,
    'USOIL': 76.34,
    // Indices
    'US500': 5234.56,
    'ND25': 18765.43,
    'AUS200': 7890.12,
  };
  return priceMap[symbol] || 1.0;
};

export interface TradingSymbol {
  symbol: string;
  price: number;
  change: number;
  category: 'forex' | 'gold' | 'crypto';
}

interface MarketState {
  symbols: TradingSymbol[];
  currentSymbol: string | null;
  setCurrentSymbol: (symbol: string) => void;
  setSymbols: (symbols: TradingSymbol[]) => void;
  tick: () => void;
}

export const useMarketStore = create<MarketState>((set, get) => ({
  symbols: [],
  currentSymbol: null,

  setCurrentSymbol: (symbol: string) =>
    set({
      currentSymbol: symbol,
    }),

  setSymbols: (symbols: TradingSymbol[]) =>
    set({
      symbols,
    }),

  tick: () => {
    set((state) => ({
      symbols: state.symbols.map((symbol) => {
        // 如果价格为0，给一个初始价格（避免从0开始跳动）
        const basePrice = symbol.price === 0 ? getInitialPrice(symbol.symbol) : symbol.price;

        // 生成随机价格波动：-0.1% 到 +0.1%
        const changePercent = (Math.random() - 0.5) * 0.002; // ±0.1%
        const newPrice = basePrice * (1 + changePercent);

        // 计算相对于初始价格的涨跌幅（模拟真实行情）
        // 首次 tick 时使用 ±0.5% 随机变化，后续在此基础上微调
        const baseChange = symbol.change === 0 ? (Math.random() - 0.5) * 1 : symbol.change;
        const newChange = baseChange + (changePercent * 100);

        return {
          ...symbol,
          price: newPrice,
          change: Math.round(newChange * 100) / 100, // 保留2位小数
        };
      }),
    }));
  },
}));
