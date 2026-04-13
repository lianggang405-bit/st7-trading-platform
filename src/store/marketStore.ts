/**
 * 唯一行情源
 * 所有组件必须从这里读取价格
 * 任何组件都不能自己 fetch 价格
 */

import { create } from "zustand"
import { subscribeWithSelector } from "zustand/middleware"
import { updateMarket, SymbolData } from "@/lib/marketEngine"

type MarketState = {
  symbols: Record<string, SymbolData>
  isStarted: boolean
  basePriceSynced: boolean
  start: () => void
  getSymbolPrice: (symbol: string) => number | undefined
  getAllSymbols: () => Array<{ symbol: string; price: number; change: number; category: string }>
  syncBasePrices: () => Promise<void>
}

export const useMarketStore = create<MarketState>()(
  subscribeWithSelector((set, get) => ({
  symbols: {},
  isStarted: false,
  basePriceSynced: false,

  // 启动行情系统（每秒更新一次）
  start: () => {
    if (get().isStarted) return

    console.log('[MarketStore] 启动行情系统...')

    // 立即更新一次
    const data = updateMarket()
    set({ symbols: data, isStarted: true })

    // 每秒更新一次模拟价格
    setInterval(() => {
      const data = updateMarket()
      set({ symbols: { ...data } })
    }, 1000)

    // 每 5 分钟同步一次基准价（从服务端获取真实价格）
    setInterval(() => {
      get().syncBasePrices()
    }, 5 * 60 * 1000)
  },

  // 同步基准价（从服务端获取真实价格更新）
  syncBasePrices: async () => {
    try {
      const response = await fetch('/api/market/base-prices')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.basePrices) {
          const currentSymbols = get().symbols
          const updatedSymbols = { ...currentSymbols }

          Object.entries(data.basePrices).forEach(([symbol, basePrice]) => {
            if (updatedSymbols[symbol]) {
              // 平滑调整 basePrice（与服务端同步时直接更新）
              updatedSymbols[symbol] = {
                ...updatedSymbols[symbol],
                basePrice: basePrice as number,
              }
            }
          })

          set({ symbols: updatedSymbols, basePriceSynced: true })
          console.log('[MarketStore] 基准价同步完成')
        }
      }
    } catch (error) {
      console.warn('[MarketStore] 基准价同步失败:', error)
    }
  },

  // 获取单个交易对价格
  getSymbolPrice: (symbol: string) => {
    return get().symbols[symbol]?.price
  },

  // 获取所有交易对列表（用于首页、市场页面）
  getAllSymbols: () => {
    const symbols = get().symbols
    const result: Array<{ symbol: string; price: number; change: number; category: string }> = []

    Object.values(symbols).forEach((s) => {
      // 计算涨跌幅
      const change = ((s.price - s.basePrice) / s.basePrice) * 100
      result.push({
        symbol: s.symbol,
        price: s.price,
        change: Number(change.toFixed(4)),
        category: s.category,
      })
    })

    return result
  },
})))

// 导出 subscribe 类型以供其他组件使用
export type MarketStoreApi = typeof useMarketStore;
