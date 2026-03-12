/**
 * 唯一行情源
 * 所有组件必须从这里读取价格
 * 任何组件都不能自己 fetch 价格
 */

import { create } from "zustand"
import { updateMarket, SymbolData } from "@/lib/marketEngine"

type MarketState = {
  symbols: Record<string, SymbolData>
  isStarted: boolean
  start: () => void
  getSymbolPrice: (symbol: string) => number | undefined
  getAllSymbols: () => Array<{ symbol: string; price: number; change: number }>
}

export const useMarketStore = create<MarketState>((set, get) => ({
  symbols: {},
  isStarted: false,

  // 启动行情系统（每秒更新一次）
  start: () => {
    if (get().isStarted) return

    console.log('[MarketStore] 启动行情系统...')

    // 立即更新一次
    const data = updateMarket()
    set({ symbols: data, isStarted: true })

    // 每秒更新一次
    setInterval(() => {
      const data = updateMarket()
      set({ symbols: { ...data } })
    }, 1000)
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
      const change = ((s.price - s.base) / s.base) * 100
      result.push({
        symbol: s.symbol,
        price: s.price,
        change: Number(change.toFixed(4)),
        category: s.category,
      })
    })

    return result
  },
}))
