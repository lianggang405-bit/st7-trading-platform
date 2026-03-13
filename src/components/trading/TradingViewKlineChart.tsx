/**
 * 🎯 交易所级K线图表组件
 *
 * 核心特性：
 * 1. Tick-by-tick更新（每个tick更新当前K线）
 * 2. 动态价格轴（viewport auto-scale）
 * 3. 实时价格线
 * 4. Non-repainting（历史K线永不重绘）
 * 5. 平滑K线切换
 *
 * 架构：
 * Market Engine → Tick Stream → Kline Aggregator → Chart Renderer
 */

"use client"

import { useEffect, useRef, useState } from "react"
import { createChart, IChartApi, Time } from "lightweight-charts"
import { klineAggregator, KlineCandle, INTERVAL_MAP, Tick } from "@/lib/kline-aggregator"
import { onTick } from "@/lib/marketEngine"
import { useMarketStore } from "@/store/marketStore"

interface TradingViewKlineChartProps {
  symbol?: string
  interval?: string
  limit?: number
  height?: number
}

export default function TradingViewKlineChart({
  symbol = "BTCUSDT",
  interval = "1m",
  limit = 200,
  height = 500,
}: TradingViewKlineChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<any>(null)
  const priceLineRef = useRef<any>(null)  // 实时价格线
  const isMountedRef = useRef<boolean>(true)
  const unsubscribeTickRef = useRef<(() => void) | null>(null)
  const initialDataLoadedRef = useRef<boolean>(false)

  // 🎯 从MarketStore读取当前价格
  const currentPrice = useMarketStore((state) => state.getSymbolPrice(symbol)) || 0

  // 🎯 时间周期映射
  const currentInterval = INTERVAL_MAP[interval] || 60000

  // 🎯 计算价格轴精度
  function calculatePricePrecision(price: number): number {
    if (price >= 1000) return 2  // BTC: 2位小数
    if (price >= 100) return 2    // 黄金: 2位小数
    if (price >= 10) return 2     // 外汇: 2位小数
    if (price >= 1) return 4      // EURUSD: 4位小数
    return 6                      // 小于1的币种: 6位小数
  }

  // 🎯 初始化图表
  useEffect(() => {
    if (!chartContainerRef.current) return

    // 创建图表
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: height,
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
        mode: 0,  // Normalized Scale
        scaleMargins: {
          top: 0.05,
          bottom: 0.05,
        },
        autoScale: true,  // 🎯 启用自动缩放
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

    // 🎯 加载初始数据
    loadInitialData()

    // 🎯 监听tick事件（核心：tick-by-tick更新）
    const unsubscribe = onTick((tick: Tick) => {
      if (!isMountedRef.current || tick.symbol !== symbol) return

      handleTickUpdate(tick)
    })

    unsubscribeTickRef.current = unsubscribe

    // 响应式调整大小
    const handleResize = () => {
      if (isMountedRef.current && chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth
        })
      }
    }

    window.addEventListener("resize", handleResize)

    // 清理
    return () => {
      isMountedRef.current = false
      window.removeEventListener("resize", handleResize)
      if (unsubscribeTickRef.current) {
        unsubscribeTickRef.current()
      }
      if (chartRef.current) {
        chartRef.current.remove()
      }
    }
  }, [symbol, interval, height])

  // 🎯 加载初始数据
  function loadInitialData() {
    if (!seriesRef.current || !isMountedRef.current) return

    // 从K线聚合器获取数据
    const candles = klineAggregator.getCandles(symbol, interval)

    // 转换为图表格式
    const chartData = candles.map(candle => ({
      time: candle.time as Time,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close
    }))

    // 设置初始数据
    seriesRef.current.setData(chartData)
    initialDataLoadedRef.current = true

    console.log(`[TradingViewKlineChart] 初始数据加载完成: ${chartData.length}根K线`)

    // 🎯 添加实时价格线
    if (currentPrice > 0 && seriesRef.current) {
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
  }

  // 🎯 处理tick更新（核心：tick-by-tick）
  function handleTickUpdate(tick: Tick) {
    if (!seriesRef.current || !chartRef.current || !isMountedRef.current) return

    // 从K线聚合器获取当前K线
    const currentCandle = klineAggregator.getCurrentCandle(symbol, interval)

    if (!currentCandle) return

    // 更新图表（tick-by-tick更新）
    seriesRef.current.update({
      time: currentCandle.time as Time,
      open: currentCandle.open,
      high: currentCandle.high,
      low: currentCandle.low,
      close: currentCandle.close
    })

    // 🎯 更新实时价格线
    if (priceLineRef.current && seriesRef.current) {
      // Lightweight Charts不支持直接更新价格线，需要先移除再添加
      seriesRef.current.removePriceLine(priceLineRef.current)

      priceLineRef.current = seriesRef.current.createPriceLine({
        price: tick.price,
        color: "#ff4d4f",
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: "",
        lineVisible: true,
      })
    }

    // 🎯 动态调整价格范围（viewport auto-scale）
    // Lightweight Charts的autoScale已经自动处理，无需手动调整
  }

  // 🎯 监听symbol/interval变化，重新加载数据
  useEffect(() => {
    if (initialDataLoadedRef.current) {
      loadInitialData()
    }
  }, [symbol, interval])

  return (
    <div
      ref={chartContainerRef}
      style={{ height: `${height}px` }}
    />
  )
}
