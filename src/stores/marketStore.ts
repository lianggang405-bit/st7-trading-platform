import { create } from 'zustand';

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
        // 模拟价格变化：随机波动 -0.1% 到 +0.1%
        const priceChange = symbol.price * (Math.random() * 0.002 - 0.001);
        const newPrice = symbol.price + priceChange;
        
        // 更新涨跌幅（基于初始价格，简化处理）
        const changeChange = Math.random() * 0.02 - 0.01;
        const newChange = Math.max(-99.99, Math.min(99.99, symbol.change + changeChange));

        return {
          ...symbol,
          price: parseFloat(newPrice.toFixed(4)),
          change: parseFloat(newChange.toFixed(2)),
        };
      }),
    }));
  },
}));
