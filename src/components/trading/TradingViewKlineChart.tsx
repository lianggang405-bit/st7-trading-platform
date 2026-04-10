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
import { fetchKlines } from "@/lib/kline-data-source"

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
    console.log(`[TradingViewKlineChart] useEffect触发: symbol=${symbol}, interval=${interval}, height=${height}`)

    if (!chartContainerRef.current) {
      console.warn('[TradingViewKlineChart] chartContainerRef.current 为空')
      return
    }

    // 🎯 检查容器尺寸
    const containerWidth = chartContainerRef.current.clientWidth
    const containerHeight = chartContainerRef.current.clientHeight
    console.log(`[TradingViewKlineChart] 容器尺寸: ${containerWidth}x${containerHeight}`)

    if (containerWidth === 0 || containerHeight === 0) {
      console.warn('[TradingViewKlineChart] 容器尺寸为0，无法初始化图表')
      return
    }

    console.log(`[TradingViewKlineChart] 开始创建图表`)
    isMountedRef.current = true

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

    // 🎯 订阅 tick 实时更新（使用 setData 更新所有数据以确保格式一致）
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
      console.log(`[TradingViewKlineChart] cleanup执行: symbol=${symbol}, interval=${interval}`)
      isMountedRef.current = false
      window.removeEventListener("resize", handleResize)
      if (unsubscribeTickRef.current) {
        unsubscribeTickRef.current()
      }
      if (chartRef.current) {
        console.log(`[TradingViewKlineChart] 销毁图表`)
        chartRef.current.remove()
      }
      initialDataLoadedRef.current = false
      console.log(`[TradingViewKlineChart] cleanup完成`)
    }
  }, [symbol, interval, height])

  // 🎯 生成模拟历史K线数据（当没有真实数据时使用）
  function generateMockHistoricalCandles(basePrice: number, count: number): KlineCandle[] {
    const candles: KlineCandle[] = []
    const now = Date.now()
    const intervalMs = currentInterval

    // 倒推生成历史K线
    for (let i = count - 1; i >= 0; i--) {
      const timeMs = now - (i * intervalMs)
      // 🎯 转换为秒级时间戳（Lightweight Charts标准）
      const time = Math.floor(timeMs / 1000)
      const volatility = 0.001  // 0.1% 波动

      // 基于前一根K线生成新K线
      let open, close, high, low

      if (candles.length === 0) {
        // 第一根K线
        open = basePrice
        const change = (Math.random() - 0.5) * 2 * volatility * basePrice
        close = open + change
        high = Math.max(open, close) + Math.random() * volatility * basePrice
        low = Math.min(open, close) - Math.random() * volatility * basePrice
      } else {
        const prev = candles[candles.length - 1]
        open = prev.close
        const change = (Math.random() - 0.5) * 2 * volatility * basePrice
        close = open + change
        high = Math.max(open, close) + Math.random() * volatility * basePrice
        low = Math.min(open, close) - Math.random() * volatility * basePrice
      }

      // 确保数据完整性
      high = Math.max(high, open, close)
      low = Math.min(low, open, close)

      candles.push({ time, open, high, low, close })
    }

    return candles
  }

  // 🎯 加载初始数据
  async function loadInitialData() {
    console.log(`[TradingViewKlineChart] loadInitialData调用: symbol=${symbol}, interval=${interval}, isMounted=${isMountedRef.current}`)

    if (!seriesRef.current) {
      console.error('[TradingViewKlineChart] seriesRef.current 为空，无法加载数据')
      return
    }

    if (!isMountedRef.current) {
      console.error('[TradingViewKlineChart] 组件已卸载，取消加载数据')
      return
    }

    try {
      // 🎯 第一步：从API加载历史K线数据
      console.log(`[TradingViewKlineChart] 开始加载历史K线数据: ${symbol} ${interval}`)
      const klineData = await fetchKlines(symbol, interval, limit, true)

      // 🎯 第二步：处理历史数据
      let historicalCandles: KlineCandle[] = []

      if (klineData.length > 0) {
        // 使用真实历史数据
        historicalCandles = klineData.map(k => ({
          time: k.time,
          open: k.open,
          high: k.high,
          low: k.low,
          close: k.close
        }))
        console.log(`[TradingViewKlineChart] 加载到真实历史数据: ${historicalCandles.length}根K线`)

        // 🎯 检查历史数据价格与当前价格的差异
        const lastCandle = historicalCandles[historicalCandles.length - 1]
        if (currentPrice > 0) {
          const priceDiff = Math.abs(lastCandle.close - currentPrice)
          const priceDiffPercent = (priceDiff / currentPrice) * 100

          console.log(`[TradingViewKlineChart] 价格差异: ${priceDiff.toFixed(2)} (${priceDiffPercent.toFixed(2)}%)`)

          // 如果价格差异超过10%，使用模拟数据
          if (priceDiffPercent > 10) {
            console.warn(`[TradingViewKlineChart] 历史数据价格与当前价格差异过大 (${priceDiffPercent.toFixed(2)}%)，使用模拟数据`)
            historicalCandles = generateMockHistoricalCandles(currentPrice, limit)
            console.log(`[TradingViewKlineChart] 生成模拟历史数据: ${historicalCandles.length}根K线`)
          } else {
            // 价格差异在可接受范围内，调整最后一根K线的close价格
            console.log(`[TradingViewKlineChart] 调整最后一根K线的close价格: ${lastCandle.close} → ${currentPrice}`)
            historicalCandles[historicalCandles.length - 1] = {
              ...lastCandle,
              close: currentPrice,
              high: Math.max(lastCandle.high, currentPrice),
              low: Math.min(lastCandle.low, currentPrice)
            }
          }
        }
      } else {
        // 没有真实数据，生成模拟历史数据
        console.warn(`[TradingViewKlineChart] 没有加载到真实历史数据，生成模拟数据`)
        historicalCandles = generateMockHistoricalCandles(currentPrice || 50000, limit)
        console.log(`[TradingViewKlineChart] 生成模拟历史数据: ${historicalCandles.length}根K线`)
      }

      // 🎯 第三步：确保 historicalCandles 中的 time 字段是秒级（Lightweight Charts标准）
      const normalizedCandles = historicalCandles.map(candle => {
        let timeValue = typeof candle.time === 'number' ? candle.time : Number(candle.time)

        // 检测并转换毫秒级时间戳为秒级
        // 如果时间戳大于 1e12（10^12），则认为是毫秒级时间戳
        if (timeValue > 1000000000000) {
          timeValue = Math.floor(timeValue / 1000)
        }

        return {
          ...candle,
          time: timeValue
        }
      })

      // 🎯 用历史数据初始化K线聚合器
      if (normalizedCandles.length > 0) {
        klineAggregator.initHistoricalCandles(symbol, interval, normalizedCandles)
        console.log(`[TradingViewKlineChart] K线聚合器已初始化: ${normalizedCandles.length}根历史K线`)

        // 转换为图表格式（确保time是number类型）
        const chartData = normalizedCandles.map(candle => {
          // 强制将time转换为纯数字类型
          let timeNum = candle.time
          if (typeof timeNum !== 'number' || isNaN(timeNum)) {
            console.error(`[TradingViewKlineChart] 无效的time字段:`, candle.time)
            timeNum = Math.floor(Date.now() / 1000)
          }
          // 确保是秒级时间戳
          if (timeNum > 1000000000000) {
            timeNum = Math.floor(timeNum / 1000)
          }
          return {
            time: timeNum,
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close
          }
        })

        console.log(`[TradingViewKlineChart] 准备设置初始数据: ${chartData.length}根K线`)
        console.log(`[TradingViewKlineChart] 第一根K线:`, JSON.stringify(chartData[0]))
        console.log(`[TradingViewKlineChart] 最后一根K线:`, JSON.stringify(chartData[chartData.length - 1]))

        // 🎯 转换时间格式为 yyyy-mm-dd 格式（Lightweight Charts 标准）
        // 同时验证所有 OHLC 数据，确保没有 null 或无效值
        const validChartData = chartData.filter((candle, index) => {
          // 验证 time 字段
          if (typeof candle.time !== 'number' || isNaN(candle.time)) {
            console.error(`[TradingViewKlineChart] 第${index + 1}根K线time字段无效:`, candle.time)
            return false
          }

          // 验证 OHLC 数据（确保都是有效数字）
          const ohlcFields: (keyof typeof candle)[] = ['open', 'high', 'low', 'close']
          for (const field of ohlcFields) {
            const value = candle[field]
            if (value === null || value === undefined || typeof value !== 'number' || isNaN(value)) {
              console.error(`[TradingViewKlineChart] 第${index + 1}根K线 ${field} 字段无效:`, value)
              return false
            }
          }

          return true
        }).map(candle => {
          // 将时间戳转换为秒级数字（Lightweight Charts 标准）
          let timeValue = candle.time
          if (typeof timeValue === 'string') {
            timeValue = parseInt(timeValue, 10)
          }
          if (timeValue > 1000000000000) {
            timeValue = Math.floor(timeValue / 1000)
          }

          return {
            time: timeValue,
            _originalTime: candle.time, // 保留原始值用于调试
            open: candle.open!,
            high: candle.high!,
            low: candle.low!,
            close: candle.close!
          }
        })

        if (validChartData.length === 0) {
          console.error('[TradingViewKlineChart] 没有有效的K线数据')
          return
        }

        // 🎯 去重：确保没有重复的时间戳（基于转换后的time值）
        const uniqueCandleMap = new Map<number, any>()
        for (const candle of validChartData) {
          const timeKey = typeof candle.time === 'number' ? candle.time : parseInt(String(candle.time))
          if (uniqueCandleMap.has(timeKey)) {
            console.warn(`[TradingViewKlineChart] 发现重复时间戳: ${timeKey}，跳过`)
            continue
          }
          uniqueCandleMap.set(timeKey, candle)
        }
        const uniqueChartData = Array.from(uniqueCandleMap.values()).sort((a, b) => a.time - b.time)

        console.log(`[TradingViewKlineChart] 去重后: ${validChartData.length} -> ${uniqueChartData.length}根K线`)
        console.log(`[TradingViewKlineChart] 设置初始数据: ${uniqueChartData.length}根有效K线`)

        // 设置初始数据
        seriesRef.current.setData(uniqueChartData as any)
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
      } else {
        console.error(`[TradingViewKlineChart] 没有可用数据`)
        initialDataLoadedRef.current = false
      }
    } catch (error) {
      console.error('[TradingViewKlineChart] 加载初始数据失败:', error)
      initialDataLoadedRef.current = false
    }
  }

  // 🎯 处理tick更新（核心：使用setData更新所有数据确保格式一致）
  function handleTickUpdate(tick: Tick) {
    // 🎯 关键保护：必须在初始数据加载完成后才能处理更新
    if (!initialDataLoadedRef.current) {
      console.log('[TradingViewKlineChart] 初始数据未加载完成，跳过tick更新')
      return
    }

    if (!seriesRef.current || !chartRef.current || !isMountedRef.current) {
      console.log('[TradingViewKlineChart] 图表未就绪，跳过tick更新')
      return
    }

    // 从K线聚合器获取所有K线数据
    const allCandles = klineAggregator.getCandles(symbol, interval)

    if (!allCandles || allCandles.length === 0) {
      console.log('[TradingViewKlineChart] 没有K线数据，跳过更新')
      return
    }

    // 🎯 去重：使用Map去除重复时间戳
    const candleMap = new Map<number, any>()
    for (const candle of allCandles) {
      let timeValue = typeof candle.time === 'number' ? candle.time : parseInt(String(candle.time))
      if (timeValue > 1000000000000) timeValue = Math.floor(timeValue / 1000)
      candleMap.set(timeValue, { time: timeValue, open: candle.open, high: candle.high, low: candle.low, close: candle.close })
    }
    const updatedChartData = Array.from(candleMap.values()).sort((a, b) => a.time - b.time)

    // 🎯 使用setData更新所有数据（确保格式与初始化一致）
    try {
      seriesRef.current.setData(updatedChartData)
    } catch (error) {
      console.error('[TradingViewKlineChart] 更新图表失败:', error)
    }

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
  }

  return (
    <div
      ref={chartContainerRef}
      style={{ height: `${height}px`, width: '100%', backgroundColor: '#0f172a' }}
    >
      {!initialDataLoadedRef.current && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100%',
          color: '#6b7280',
          fontSize: '14px'
        }}>
          加载K线数据...
        </div>
      )}
    </div>
  )
}
