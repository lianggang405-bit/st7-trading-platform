import { create } from 'zustand';

export interface TradingSymbol {
  symbol: string;
  price: number;
  change: number;
  source: 'coingecko' | 'gold-api' | 'mock' | 'cached' | 'fallback';
  category: 'crypto' | 'metal' | 'forex' | 'energy' | 'cfd';
}

interface MarketState {
  symbols: TradingSymbol[];
  currentSymbol: string | null;
  setCurrentSymbol: (symbol: string) => void;
  setSymbols: (symbols: TradingSymbol[]) => void;
  updateSymbolPrice: (symbol: string, price: number, change?: number) => void;
  updateFromStream: (symbols: TradingSymbol[]) => void;
  loadMarket: () => Promise<void>;
  isHydrated: boolean;
  useStreaming: boolean;
  setUseStreaming: (enabled: boolean) => void;
}

export const useMarketStore = create<MarketState>((set, get) => ({
  symbols: [],
  currentSymbol: null,
  isHydrated: false,
  useStreaming: false,

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
   *
   * 数据来源：
   * - Crypto → CoinGecko API（真实数据）
   * - Metal → Gold API（真实数据）
   * - 其他 → 模拟数据
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

  /**
   * 从实时流更新所有交易对价格
   *
   * 这是 SSE 流式更新的入口
   */
  updateFromStream: (symbols: TradingSymbol[]) => {
    const state = get();

    if (state.symbols.length === 0) {
      // 第一次收到数据，直接设置
      console.log('[MarketStore] First stream data, setting symbols');
      set({
        symbols,
        isHydrated: true,
      });
      return;
    }

    // 更新现有交易对的价格
    set({
      symbols: state.symbols.map((existing) => {
        const updated = symbols.find((s) => s.symbol === existing.symbol);
        if (updated) {
          return updated; // 使用流中的新数据
        }
        return existing; // 保持旧数据
      }),
    });
  },

  /**
   * 设置是否使用实时流
   */
  setUseStreaming: (enabled: boolean) => {
    set({ useStreaming: enabled });
    console.log('[MarketStore] Streaming mode:', enabled ? 'enabled' : 'disabled');
  },
}));
