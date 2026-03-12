import { create } from 'zustand';

export interface TradingSymbol {
  symbol: string;
  price: number;
  change: number;
  source: 'binance' | 'goldapi' | 'mock';
  category: 'crypto' | 'metal' | 'forex' | 'energy' | 'cfd';
}

interface MarketState {
  symbols: TradingSymbol[];
  currentSymbol: string | null;
  setCurrentSymbol: (symbol: string) => void;
  setSymbols: (symbols: TradingSymbol[]) => void;
  updateSymbolPrice: (symbol: string, price: number, change?: number) => void;
  loadMarket: () => Promise<void>; // 新增：加载市场数据
  isHydrated: boolean; // 新增：是否已初始化
}

export const useMarketStore = create<MarketState>((set, get) => ({
  symbols: [],
  currentSymbol: null,
  isHydrated: false,

  setCurrentSymbol: (symbol: string) =>
    set({
      currentSymbol: symbol,
    }),

  setSymbols: (symbols: TradingSymbol[]) => {
    console.log('[MarketStore] setSymbols called:', symbols.length, 'symbols');
    set({
      symbols,
      isHydrated: true,
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

  /**
   * 加载市场数据（统一从 /api/market 获取）
   */
  loadMarket: async () => {
    try {
      console.log('[MarketStore] Loading market data from /api/market...');
      const response = await fetch('/api/market', {
        cache: 'no-store',
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.symbols) {
        console.log('[MarketStore] Loaded', data.symbols.length, 'symbols');
        set({
          symbols: data.symbols,
          isHydrated: true,
        });
      } else {
        throw new Error('Invalid data format');
      }
    } catch (error) {
      console.error('[MarketStore] Failed to load market data:', error);
      // 不抛出错误，保持当前数据
    }
  },
}));
