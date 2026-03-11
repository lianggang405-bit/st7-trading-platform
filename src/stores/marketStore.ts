import { create } from 'zustand';
import { realTimePrices, getPriceMap } from '@/lib/real-time-prices';

/**
 * 获取交易对的初始价格（使用真实市场数据）
 */
const getInitialPrice = (symbol: string): number => {
  const priceMap = getPriceMap();
  const price = priceMap[symbol];

  if (price === undefined) {
    console.warn('[MarketStore] Symbol not found in priceMap:', symbol, 'Available symbols:', Object.keys(priceMap).slice(0, 10));
    return 100;
  }

  console.log('[MarketStore] getInitialPrice:', symbol, '=', price);
  return price;
};

export interface TradingSymbol {
  symbol: string;
  price: number;
  change: number;
  category: 'forex' | 'gold' | 'crypto' | 'energy' | 'cfd';
}

interface MarketState {
  symbols: TradingSymbol[];
  currentSymbol: string | null;
  setCurrentSymbol: (symbol: string) => void;
  setSymbols: (symbols: TradingSymbol[]) => void;
  updateSymbolPrice: (symbol: string, price: number, change?: number) => void;
  // ✅ 禁用 tick 函数，避免生成假行情
  // 未来应该通过 WebSocket 或 API 获取真实实时价格
  // tick: () => void;
}

export const useMarketStore = create<MarketState>((set, get) => ({
  symbols: [],
  currentSymbol: null,

  setCurrentSymbol: (symbol: string) =>
    set({
      currentSymbol: symbol,
    }),

  setSymbols: (symbols: TradingSymbol[]) => {
    console.log('[MarketStore] setSymbols called:', symbols.slice(0, 5)); // 打印前5个
    set({
      symbols,
    });
  },

  /**
   * 更新单个交易对的价格（用于实时价格更新）
   */
  updateSymbolPrice: (symbol: string, price: number, change?: number) => {
    set((state) => ({
      symbols: state.symbols.map((s) =>
        s.symbol === symbol
          ? { ...s, price, change: change ?? s.change }
          : s
      ),
    }));
  },

  // ✅ 禁用 tick 函数，避免生成假行情
  // 未来应该通过 WebSocket 或 API 获取真实实时价格
}));
