/**
 * 行情系统启动器
 * 在客户端启动行情系统
 */

'use client'

import { useEffect } from 'react'
import { useMarketStore } from '@/store/marketStore'

export function MarketProvider({ children }: { children: React.ReactNode }) {
  const start = useMarketStore((s) => s.start)

  useEffect(() => {
    // 启动行情系统
    start()
  }, [start])

  return <>{children}</>
}
