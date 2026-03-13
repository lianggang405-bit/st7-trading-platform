"use client"

import { useEffect, useRef } from "react"
import { createChart, IChartApi, Time } from "lightweight-charts"
import { fetchKlines, KlineData } from "@/lib/kline-data-source"

interface SimpleKlineChartProps {
  symbol?: string
  interval?: string
  limit?: number
  height?: number
  currentPrice?: number  // 当前价格（用于确保K线图价格一致）
}

export default function SimpleKlineChart({
  symbol = "BTCUSDT",
  interval = "1m",
  limit = 200,
  height = 500,
  currentPrice,  // 当前价格（可选）
}: SimpleKlineChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<any>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastDataRef = useRef<any[]>([]) // 保存上一次的数据

  // 检测是否为移动端，如果是则缩小高度（缩小1/3）
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  const chartHeight = isMobile ? Math.floor(height * 2 / 3) : height

  useEffect(() => {
    if (!chartContainerRef.current) return

    // 🎯 根据时间周期设置价格轴刻度
    // 小周期（1m、5m、15m）使用更小的刻度，大周期（1h、4h、1d）使用更大的刻度
    const getPriceAxisOptions = (symbol: string, interval: string) => {
      // 获取基准价格
      const basePriceMap: { [key: string]: number } = {
        'BTCUSDT': 62000,
        'ETHUSDT': 3200,
        'XAUUSD': 5200,
        'EURUSD': 1.085,
        'USOIL': 85,
      }
      const basePrice = basePriceMap[symbol] || 1000

      // 根据时间周期设置刻度
      const intervalConfig: { [key: string]: { minTickSpacing: number } } = {
        // 小周期：使用更小的刻度（5-10美元为单位）
        '1m': { minTickSpacing: basePrice * 0.0005 },    // BTC: ~31, XAU: ~2.6
        '5m': { minTickSpacing: basePrice * 0.001 },     // BTC: ~62, XAU: ~5.2
        '15m': { minTickSpacing: basePrice * 0.002 },    // BTC: ~124, XAU: ~10.4
        // 中周期：使用中等刻度
        '1h': { minTickSpacing: basePrice * 0.005 },     // BTC: ~310, XAU: ~26
        '4h': { minTickSpacing: basePrice * 0.01 },      // BTC: ~620, XAU: ~52
        // 大周期：使用较大的刻度
        '1d': { minTickSpacing: basePrice * 0.02 },      // BTC: ~1240, XAU: ~104
      }

      return intervalConfig[interval] || { minTickSpacing: basePrice * 0.01 }
    }

    const priceAxisOptions = getPriceAxisOptions(symbol, interval)

    // 创建图表
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartHeight,
      layout: {
        background: { color: "#0f172a" },
        textColor: "#d1d5db"
      },
      grid: {
        vertLines: { color: "#1f2937" },
        horzLines: { color: "#1f2937" }
      },
      crosshair: {
        mode: 0
      },
      rightPriceScale: {
        borderColor: "#374151",
        mode: 0, // 0 = Normalized Scale（规范化模式，避免跳变）
        scaleMargins: {
          top: 0.1,    // 顶部留10%缓冲区
          bottom: 0.2,  // 底部留20%缓冲区，防止价格变化导致缩放
        },
        autoScale: true, // 启用自动缩放
        ...priceAxisOptions, // 🎯 动态价格轴刻度
      },
      timeScale: {
        borderColor: "#374151",
        timeVisible: true,
        secondsVisible: interval === "1m" || interval === "5m",
      }
    })

    // 添加K线系列
    const candleSeries = chart.addCandlestickSeries({
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444"
    })

    chartRef.current = chart
    seriesRef.current = candleSeries

    // 加载K线数据
    async function loadKlines(forceRefresh: boolean = false) {
      try {
        // 使用聚合数据源，自动根据交易对类型选择最佳数据源
        const candles = await fetchKlines(symbol, interval, limit, forceRefresh)

        if (candles.length === 0) {
          return
        }

        // 安全处理：确保 high/low 数据正确
        // 转换为图表格式（添加类型断言和安全检查）
        const chartData: Array<{
          time: Time
          open: number
          high: number
          low: number
          close: number
        }> = candles.map(k => {
          const open = Number(k.open)
          const high = Number(k.high)
          const low = Number(k.low)
          const close = Number(k.close)

          return {
            time: k.time as Time,
            open,
            high: Math.max(high, open, close),  // 确保 high >= max(open, close)
            low: Math.min(low, open, close),    // 确保 low <= min(open, close)
            close
          }
        })

        // 按时间排序（确保从旧到新）
        chartData.sort((a, b) => {
          const timeA = typeof a.time === 'number' ? a.time : Number(a.time)
          const timeB = typeof b.time === 'number' ? b.time : Number(b.time)
          return timeA - timeB
        })

        // 🔥 关键修复：如果提供了 currentPrice，只修改最后一根K线的收盘价和边界
        if (currentPrice && chartData.length > 0) {
          const lastCandle = chartData[chartData.length - 1]

          // 只修改 close 价格
          lastCandle.close = currentPrice

          // 更新 high 和 low 边界（不改变 K线形态，只更新边界值）
          lastCandle.high = Math.max(lastCandle.high, currentPrice)
          lastCandle.low = Math.min(lastCandle.low, currentPrice)

          console.log(`[SimpleKlineChart] 更新最后一根K线: close=${currentPrice}, high=${lastCandle.high}, low=${lastCandle.low}`)
        }

        // 智能更新：检查是否需要重新设置数据
        if (lastDataRef.current.length > 0) {
          // 比较最后一根K线的时间戳
          const lastNewTime = chartData[chartData.length - 1].time
          const lastOldTime = lastDataRef.current[lastDataRef.current.length - 1]?.time

          // 如果时间戳相同，只更新最后一根K线的价格
          if (lastNewTime === lastOldTime) {
            const lastCandle = chartData[chartData.length - 1]
            candleSeries.update(lastCandle)
            lastDataRef.current = chartData
            return
          }
        }

        // 首次加载或时间戳变化，重新设置所有数据
        candleSeries.setData(chartData)
        lastDataRef.current = chartData
      } catch (error) {
        // 静默处理错误，避免控制台刷屏
      }
    }

    // 初始加载
    loadKlines(true)

    // 定时刷新（每10秒，减少频率以避免价格轴频繁跳变）
    intervalRef.current = setInterval(() => loadKlines(true), 10000)

    // 响应式调整大小
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth
        })
      }
    }

    window.addEventListener("resize", handleResize)

    // 清理
    return () => {
      window.removeEventListener("resize", handleResize)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (chartRef.current) {
        chartRef.current.remove()
      }
      lastDataRef.current = [] // 清除数据引用
    }
  }, [symbol, interval, limit, height])

  // 🚀 优化：每秒更新最后一根K线（平滑移动，不是跳动）
  useEffect(() => {
    if (!currentPrice || !seriesRef.current || lastDataRef.current.length === 0) return

    const lastCandle = lastDataRef.current[lastDataRef.current.length - 1]

    if (lastCandle) {
      // 🔥 只修改 close 和边界值，不改变 K线形态
      const updatedCandle = {
        time: lastCandle.time,
        open: lastCandle.open,
        close: currentPrice,
        high: Math.max(lastCandle.high, currentPrice),  // 更新边界
        low: Math.min(lastCandle.low, currentPrice),    // 更新边界
      }

      // 更新图表
      seriesRef.current.update(updatedCandle)

      // 更新缓存
      lastDataRef.current[lastDataRef.current.length - 1] = updatedCandle
    }
  }, [currentPrice])

  return (
    <div
      ref={chartContainerRef}
      style={{ height: `${chartHeight}px` }}
    />
  )
}
