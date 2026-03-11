"use client"

import { useEffect, useRef } from "react"
import { createChart, IChartApi, Time } from "lightweight-charts"

interface KlineData {
  time: Time
  open: number
  high: number
  low: number
  close: number
}

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
    async function loadKlines() {
      try {
        const res = await fetch(
          `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
        )

        if (!res.ok) {
          throw new Error(`API 请求失败: ${res.status}`)
        }

        const data = await res.json()

        if (!Array.isArray(data) || data.length === 0) {
          return
        }

        const candles: KlineData[] = data.map((k) => ({
          time: (k[0] / 1000) as Time,
          open: parseFloat(k[1]),
          high: parseFloat(k[2]),
          low: parseFloat(k[3]),
          close: parseFloat(k[4])
        }))

        candleSeries.setData(candles)
      } catch (error) {
        // 静默处理错误，避免控制台刷屏
      }
    }

    // 初始加载
    loadKlines()

    // 定时刷新（5秒）
    intervalRef.current = setInterval(loadKlines, 5000)

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
