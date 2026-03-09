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

  setSymbols: (symbols: TradingSymbol[]) => {
    console.log('[MarketStore] setSymbols called:', symbols.slice(0, 5)); // 打印前5个
    set({
      symbols,
    });
  },

  tick: () => {
    set((state) => {
      // ✅ 优化：每次只更新部分交易对（30%），更接近真实行情
      // 真实交易所不会每秒更新所有交易对
      const symbols = [...state.symbols];
      const total = symbols.length;

      // 打印调试信息（每10次打印一次，避免过多日志）
      if (Math.random() < 0.1) {
        console.log('[MarketStore] tick called, total symbols:', total, 'sample:', symbols.slice(0, 2));
      }

      const updateCount = Math.max(1, Math.floor(total * 0.3)); // 每次更新 30% 的交易对

      // 随机选择要更新的交易对索引
      const indicesToUpdate = new Set<number>();
      while (indicesToUpdate.size < updateCount && indicesToUpdate.size < total) {
        indicesToUpdate.add(Math.floor(Math.random() * total));
      }

      // 只更新选中的交易对
      indicesToUpdate.forEach((index) => {
        const symbol = symbols[index];

        // 如果价格为0，给一个初始价格（避免从0开始跳动）
        const basePrice = symbol.price === 0 ? getInitialPrice(symbol.symbol) : symbol.price;

        // ✅ 优化：波动幅度改为 ±0.02%，更符合真实外汇市场
        const changePercent = (Math.random() - 0.5) * 0.0004; // ±0.02%
        const newPrice = basePrice * (1 + changePercent);

        // 计算相对于初始价格的涨跌幅（模拟真实行情）
        // 首次 tick 时使用 ±0.5% 随机变化，后续在此基础上微调
        const baseChange = symbol.change === 0 ? (Math.random() - 0.5) * 1 : symbol.change;
        const newChange = baseChange + (changePercent * 100);

        symbols[index] = {
          ...symbol,
          price: newPrice,
          change: Math.round(newChange * 100) / 100, // 保留2位小数
        };
      });

      return { symbols };
    });
  },
}));
