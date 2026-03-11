"use client"

import { useEffect, useRef } from "react"
import { createChart, IChartApi, Time } from "lightweight-charts"
import { fetchKlines, KlineData } from "@/lib/kline-data-source"

interface SimpleKlineChartProps {
  symbol?: string
  interval?: string
  limit?: number
  height?: number
}

export default function SimpleKlineChart({
  symbol = "BTCUSDT",
  interval = "1m",
  limit = 200,
  height = 500
}: SimpleKlineChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<any>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!chartContainerRef.current) return

    // 创建图表
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height,
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
        borderColor: "#374151"
      },
      timeScale: {
        borderColor: "#374151",
        timeVisible: true,
        secondsVisible: interval === "1m" || interval === "5m"
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

        candleSeries.setData(chartData)
      } catch (error) {
        // 静默处理错误，避免控制台刷屏
      }
    }

    // 初始加载
    loadKlines(true)

    // 定时刷新（每3秒，强制刷新获取最新价格）
    intervalRef.current = setInterval(() => loadKlines(true), 3000)

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
    }
  }, [symbol, interval, limit, height])

  return <div ref={chartContainerRef} style={{ width: "100%" }} />
}
