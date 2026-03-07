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
    // ✅ 不再模拟价格变化，保持最后获取的价格
    // 如果获取不到实时价格，价格将保持不变，直到重新获取到新数据
    set((state) => ({
      symbols: state.symbols.map((symbol) => ({
        ...symbol,
        // 价格不变，保留最后获取的真实价格
        price: symbol.price,
        change: symbol.change,
      })),
    }));
  },
}));
