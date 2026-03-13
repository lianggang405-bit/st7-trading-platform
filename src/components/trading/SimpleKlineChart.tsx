"use client"

import { useEffect, useRef, useState } from "react"
import { createChart, IChartApi, Time } from "lightweight-charts"
import { fetchKlines, KlineData } from "@/lib/kline-data-source"
import { useMarketStore } from "@/store/marketStore"

// 🎯 K线数据结构（统一格式）
export interface Candle {
  time: number
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
  currentPrice?: number  // 可选，如果提供则使用，否则从MarketStore读取
}

// 🎯 动态价格轴刻度计算函数（交易所级）
// 根据当前K线的价格范围动态计算合适的价格轴刻度
function calculatePriceStep(high: number, low: number): number {
  const range = high - low
  const step = range / 8  // 目标是显示8-10个刻度

  if (step < 0.5) return 0.1
  if (step < 1) return 0.5
  if (step < 2) return 1
  if (step < 5) return 2
  if (step < 10) return 5
  if (step < 20) return 10
  if (step < 50) return 20
  if (step < 100) return 50
  return 100
}

// 🎯 根据时间周期动态计算价格精度
function calculatePricePrecision(symbol: string, interval: string): number {
  // 不同资产类别的基准价格
  const basePriceMap: { [key: string]: number } = {
    'BTCUSDT': 62000,
    'ETHUSDT': 3200,
    'XAUUSD': 5200,
    'EURUSD': 1.085,
    'USOIL': 85,
  }
  const basePrice = basePriceMap[symbol] || 1000

  // 根据时间周期设置精度（交易所级）
  const intervalConfig: { [key: string]: number } = {
    '1m': basePrice < 10 ? 2 : 1,      // BTC: 1, XAU: 1, EUR: 2
    '5m': basePrice < 10 ? 2 : 1,      // BTC: 1, XAU: 1, EUR: 2
    '15m': basePrice < 10 ? 2 : 1,     // BTC: 1, XAU: 1, EUR: 2
    '1h': basePrice < 10 ? 2 : 0,      // BTC: 0, XAU: 0, EUR: 2
    '4h': basePrice < 10 ? 1 : 0,      // BTC: 0, XAU: 1, EUR: 1
    '1d': basePrice < 10 ? 0 : 0,      // BTC: 0, XAU: 0, EUR: 0
  }

  return intervalConfig[interval] ?? 2
}

export default function SimpleKlineChart({
  symbol = "BTCUSDT",
  interval = "1m",
  limit = 200,
  height = 500,
  currentPrice: propCurrentPrice,  // 可选，如果提供则使用
}: SimpleKlineChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<any>(null)
  const priceLineRef = useRef<any>(null)  // 实时价格红线
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastDataRef = useRef<Candle[]>([]) // 保存上一次的数据

  // 🎯 从MarketStore读取当前价格（统一行情源）
  const marketStorePrice = useMarketStore((state) => state.getSymbolPrice(symbol))
  const currentPrice = propCurrentPrice ?? marketStorePrice ?? 0

  // 检测是否为移动端，如果是则缩小高度（缩小1/3）
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  const chartHeight = isMobile ? Math.floor(height * 2 / 3) : height

  // 🎯 时间周期映射（毫秒）
  const intervalMap: Record<string, number> = {
    "1m": 60000,
    "5m": 300000,
    "15m": 900000,
    "1h": 3600000,
    "4h": 14400000,
    "1d": 86400000,
  }
  const currentInterval = intervalMap[interval] || 60000

  useEffect(() => {
    if (!chartContainerRef.current) return

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
        mode: 0, // 0 = Normalized Scale
        scaleMargins: {
          top: 0.05,    // 顶部留5%缓冲区（减小，让价格轴更紧凑）
          bottom: 0.05,  // 底部留5%缓冲区
        },
        autoScale: true, // 启用自动缩放（关键）
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

    // 🎯 实时更新当前K线（核心逻辑）
    function updateCurrentCandle(price: number) {
      if (lastDataRef.current.length === 0) return

      const candle = lastDataRef.current[lastDataRef.current.length - 1]
      candle.close = price
      candle.high = Math.max(candle.high, price)
      candle.low = Math.min(candle.low, price)
    }

    // 🎯 检查是否需要生成新K线
    function checkNewCandle(price: number, intervalMs: number) {
      if (lastDataRef.current.length === 0) return

      const last = lastDataRef.current[lastDataRef.current.length - 1]
      const now = Date.now()

      // 如果当前时间超过上一个K线的时间 + 周期
      if (now - last.time >= intervalMs) {
        const newCandle: Candle = {
          time: now,
          open: price,
          high: price,
          low: price,
          close: price,
        }

        lastDataRef.current.push(newCandle)

        // 限制K线数量，自动滚动
        if (lastDataRef.current.length > limit) {
          lastDataRef.current.shift()
        }

        return true  // 返回true表示生成了新K线
      }

      return false
    }

    // 🎯 动态价格轴计算（核心）
    function getPriceRange(): { high: number; low: number } {
      if (lastDataRef.current.length === 0) {
        return { high: 0, low: 0 }
      }

      const highs = lastDataRef.current.map(c => c.high)
      const lows = lastDataRef.current.map(c => c.low)
      const high = Math.max(...highs)
      const low = Math.min(...lows)
      const padding = (high - low) * 0.2

      return {
        high: high + padding,
        low: low - padding,
      }
    }

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

        // 🎯 动态计算价格轴刻度（基于当前K线的价格范围）
        if (chartData.length > 0) {
          // 计算所有K线的最高价和最低价
          const allHighs = chartData.map(k => k.high)
          const allLows = chartData.map(k => k.low)
          const maxHigh = Math.max(...allHighs)
          const minLow = Math.min(...allLows)

          // 🎯 动态调整价格范围（使用 padding 避免价格顶到边）
          // 计算价格范围
          const priceRange = maxHigh - minLow

          // 计算 padding（20%）
          const padding = priceRange * 0.2
          const displayHigh = maxHigh + padding
          const displayLow = minLow - padding

          // 使用 fitContent 来设置价格范围
          // 注意：fitContent 会根据当前数据自动调整价格范围
          const contentWidth = chart.timeScale().getVisibleRange()
          if (contentWidth) {
            chart.timeScale().setVisibleLogicalRange({
              from: contentWidth.from as number,
              to: contentWidth.to as number,
            })
          }

          console.log(`[SimpleKlineChart] 动态价格范围: range=${priceRange.toFixed(2)}, high=${displayHigh.toFixed(2)}, low=${displayLow.toFixed(2)}`)
        }

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

          // 🎯 新K线生成：自动滚动到最新K线
          const isNewCandle = lastNewTime !== lastOldTime
          if (isNewCandle && chartRef.current) {
            // 自动滚动到最新K线（交易所级体验）
            chartRef.current.timeScale().scrollToPosition(0, false)  // false = 禁用动画
            console.log(`[SimpleKlineChart] 新K线生成，自动滚动到最新K线`)
          }
        }

        // 首次加载或时间戳变化，重新设置所有数据
        candleSeries.setData(chartData)
        lastDataRef.current = chartData

        // 🎯 添加实时价格红线（交易所级）
        if (currentPrice && !priceLineRef.current) {
          const precision = calculatePricePrecision(symbol, interval)

          priceLineRef.current = candleSeries.createPriceLine({
            price: currentPrice,
            color: "#ff4d4f",  // 红色
            lineWidth: 1,
            lineStyle: 2,  // 2 = dashed
            axisLabelVisible: true,
            title: "",  // 不显示标题
            lineVisible: true,
          })
        }
      } catch (error) {
        // 静默处理错误，避免控制台刷屏
      }
    }

    // 初始加载
    loadKlines(true)

    // 定时刷新（每1秒更新，确保当前K线实时更新）
    intervalRef.current = setInterval(() => loadKlines(true), 1000)

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

  // 🚀 每秒更新最后一根K线和价格线（交易所级）
  useEffect(() => {
    if (!currentPrice || !seriesRef.current || lastDataRef.current.length === 0 || !chartRef.current) return

    const lastCandle = lastDataRef.current[lastDataRef.current.length - 1]

    if (lastCandle) {
      // 🔥 实时更新当前K线（交易所级）
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

      // 🎯 更新实时价格红线（交易所级）
      // 注意：Lightweight Charts 的价格线不支持直接更新价格
      // 需要先移除再重新添加（这是库的限制，无法优化）
      if (priceLineRef.current) {
        seriesRef.current.removePriceLine(priceLineRef.current)

        const precision = calculatePricePrecision(symbol, interval)

        priceLineRef.current = seriesRef.current.createPriceLine({
          price: currentPrice,
          color: "#ff4d4f",
          lineWidth: 1,
          lineStyle: 2,
          axisLabelVisible: true,
          title: "",
          lineVisible: true,
        })
      }

      // 🎯 动态调整价格范围（如果价格超出了当前范围）
      const allHighs = lastDataRef.current.map(k => k.high)
      const allLows = lastDataRef.current.map(k => k.low)
      const maxHigh = Math.max(...allHighs, currentPrice)
      const minLow = Math.min(...allLows, currentPrice)

      // 计算价格范围
      const priceRange = maxHigh - minLow

      // 计算 padding（20%）
      const padding = priceRange * 0.2
      const displayHigh = maxHigh + padding
      const displayLow = minLow - padding

      console.log(`[SimpleKlineChart] 实时价格范围: range=${priceRange.toFixed(2)}, high=${maxHigh.toFixed(2)}, low=${minLow.toFixed(2)}`)

      // 🎯 检查是否需要自动滚动
      const visibleRange = chartRef.current.timeScale().getVisibleRange()
      const lastTime = lastCandle.time
      const visibleTimeTo = visibleRange ? (typeof visibleRange.to === 'number' ? visibleRange.to : Number(visibleRange.to)) : 0

      // 如果用户正在查看最新K线（最后10秒内），保持自动滚动
      const isViewingLatest = lastTime - visibleTimeTo < 10000

      if (isViewingLatest) {
        chartRef.current.timeScale().scrollToPosition(0, false)  // false = 禁用动画，确保流畅
      }
    }
  }, [currentPrice, symbol, interval])

  return (
    <div
      ref={chartContainerRef}
      style={{ height: `${chartHeight}px` }}
    />
  )
}
