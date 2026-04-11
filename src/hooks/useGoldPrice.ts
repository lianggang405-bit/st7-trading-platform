'use client'

import { useState, useEffect, useRef } from 'react'

export interface GoldPriceData {
  success: boolean
  symbol: string
  price: number
  change: number
  changePercent: number
  timestamp: number
  source: string
  unit: string
}

interface UseGoldPriceOptions {
  refreshInterval?: number // 刷新间隔（毫秒），默认 5 分钟
  onPriceUpdate?: (price: number) => void
}

const GOLD_PRICE_API = '/api/gold-price-realtime'

/**
 * 黄金价格 Hook
 * 自动获取并缓存黄金实时价格
 */
export function useGoldPrice(options: UseGoldPriceOptions = {}) {
  const { refreshInterval = 5 * 60 * 1000, onPriceUpdate } = options
  const [priceData, setPriceData] = useState<GoldPriceData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPrice, setCurrentPrice] = useState<number | null>(null)

  // 使用 ref 来避免依赖变化导致的重新渲染
  const onPriceUpdateRef = useRef(onPriceUpdate)
  onPriceUpdateRef.current = onPriceUpdate

  // 缓存 interval ID
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const mountedRef = useRef(true)

  const fetchPrice = async () => {
    if (!mountedRef.current) return

    try {
      const response = await fetch(GOLD_PRICE_API)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const data: GoldPriceData = await response.json()
      
      if (!mountedRef.current) return
      
      setPriceData(data)
      setCurrentPrice(data.price)
      setError(null)
      
      // 通知价格更新
      const callback = onPriceUpdateRef.current
      if (callback && data.success) {
        callback(data.price)
      }
    } catch (err) {
      if (!mountedRef.current) return
      setError(err instanceof Error ? err.message : 'Failed to fetch gold price')
    } finally {
      if (mountedRef.current) {
        setIsLoading(false)
      }
    }
  }

  useEffect(() => {
    // 初始获取
    fetchPrice()

    // 定时刷新
    intervalRef.current = setInterval(fetchPrice, refreshInterval)

    return () => {
      mountedRef.current = false
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, []) // 只运行一次

  return {
    priceData,
    isLoading,
    error,
    currentPrice,
    refresh: fetchPrice
  }
}
