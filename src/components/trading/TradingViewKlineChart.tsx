'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time, ColorType, CrosshairMode } from 'lightweight-charts'
import { useMarketStore } from '@/store/marketStore'
import { useTranslations } from 'next-intl'

interface TradingViewKlineChartProps {
  symbol?: string
  interval?: string
  height?: number
  width?: number
  showWave?: boolean  // 是否显示波浪效果
}

// 时间周期配置（秒）
const INTERVALS: Record<string, number> = {
  '1m': 60,
  '5m': 300,
  '15m': 900,
  '30m': 1800,
  '1h': 3600,
  '4h': 14400,
  '1d': 86400,
  '1w': 604800,
}

// 波浪颜色配置 - 连续涨跌幅对应的颜色
const WAVE_COLORS = {
  // 上涨颜色 (从深到浅)
  bullish: [
    '#26a69a', // 最深
    '#3cbdb4',
    '#52d4ce',
    '#6beae6',
    '#84fffe', // 最浅
  ],
  // 下跌颜色 (从深到浅)
  bearish: [
    '#ef5350', // 最深
    '#f06b68',
    '#f28380',
    '#f59b98',
    '#ffb3b0', // 最浅
  ],
}

export default function TradingViewKlineChart({
  symbol = 'BTC/USDT',
  interval = '1h',
  height = 400,
  width,
  showWave = true,  // 默认开启波浪效果
}: TradingViewKlineChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const priceLineRef = useRef<ReturnType<ISeriesApi<'Candlestick'>['createPriceLine']> | null>(null)
  const candlesRef = useRef<CandlestickData<Time>[]>([])
  const priceRef = useRef<number>(0)
  const trendRef = useRef<'bullish' | 'bearish'>('bullish')  // 当前趋势
  const isDisposedRef = useRef(false)

  const [priceChange, setPriceChange] = useState({ value: 0, percent: 0 })
  const t = useTranslations()

  const intervalSeconds = INTERVALS[interval] || INTERVALS['1h']

  // 🎯 生成波浪 K 线数据
  const generateWaveData = useCallback((currentPrice: number, count: number): CandlestickData<Time>[] => {
    const candles: CandlestickData<Time>[] = []
    const now = Math.floor(Date.now() / 1000)
    const intervalSec = intervalSeconds
    const volatility = 0.002

    // 计算当前K线周期的时间戳
    const currentCandleTime = Math.floor(now / intervalSec) * intervalSec

    // 从当前周期往前生成历史数据
    let price = currentPrice * 0.98 // 从略低于当前价格开始

    for (let i = count - 1; i >= 0; i--) {
      // 确保时间戳是严格递增的
      const timeValue = currentCandleTime - i * intervalSec
      const time = timeValue as Time

      const prevPrice = price

      // 模拟价格变化
      const changePercent = (Math.random() - 0.48) * volatility
      price = prevPrice * (1 + changePercent)

      const open = prevPrice
      const close = price

      // 计算 high 和 low
      const change = Math.abs(close - open) * 0.5
      const high = Math.max(open, close) + change
      const low = Math.min(open, close) - change

      candles.push({
        time,
        open,
        high,
        low,
        close,
      })
    }

    return candles
  }, [intervalSeconds])

  // 🎯 加载数据
  const loadData = useCallback(() => {
    if (!seriesRef.current) return

    const currentPrice = useMarketStore.getState().symbols[symbol]?.price || 1000
    const chartData = generateWaveData(currentPrice, 200)

    candlesRef.current = chartData
    priceRef.current = currentPrice

    seriesRef.current.setData(chartData)
    chartRef.current?.timeScale().fitContent()

    // 计算涨跌
    if (chartData.length > 1) {
      const firstPrice = chartData[0].open
      const lastPrice = chartData[chartData.length - 1].close
      const change = lastPrice - firstPrice
      const changePercent = (change / firstPrice) * 100
      setPriceChange({ value: change, percent: changePercent })
    }

    console.log(`[WaveKlineChart] 加载完成: ${symbol}, 当前价: ${currentPrice}`)
  }, [symbol, generateWaveData])

  // 🎯 更新最后一根 K 线
  const updateLastCandle = useCallback((price: number) => {
    if (!seriesRef.current || candlesRef.current.length === 0) return

    const candles = candlesRef.current
    const now = Math.floor(Date.now() / 1000)
    const intervalSec = intervalSeconds
    const currentCandleTime = Math.floor(now / intervalSec) * intervalSec
    const lastCandle = candles[candles.length - 1]

    // 确保 time 是有效数字
    let lastTime: number
    if (typeof lastCandle.time === 'number') {
      lastTime = lastCandle.time
    } else if (typeof lastCandle.time === 'string') {
      lastTime = new Date(lastCandle.time).getTime() / 1000
    } else {
      lastTime = now
    }

    // 判断趋势
    const prevPrice = priceRef.current
    const newTrend = price >= prevPrice ? 'bullish' : 'bearish'
    trendRef.current = newTrend

    if (currentCandleTime === lastTime) {
      // 更新当前 K 线
      const change = Math.abs(price - lastCandle.open) * 0.5
      const updatedHigh = Math.max(lastCandle.high as number, price) + change
      const updatedLow = Math.min(lastCandle.low as number, price) - change

      const updated: CandlestickData<Time> = {
        time: lastTime as Time,
        open: lastCandle.open,
        high: updatedHigh,
        low: updatedLow,
        close: price,
      }

      candles[candles.length - 1] = updated
      try {
        seriesRef.current.update(updated)
      } catch (e) {
        console.warn('[KlineChart] update failed, refreshing data')
        seriesRef.current.setData(candles)
      }
    } else if (currentCandleTime > lastTime) {
      // 新 K 线 - 时间比最后一根K线更晚
      const newTime = currentCandleTime as Time
      const change = Math.abs(price - prevPrice) * 0.5
      const newCandle: CandlestickData<Time> = {
        time: newTime,
        open: prevPrice,
        high: price + change,
        low: price - change,
        close: price,
      }

      candles.push(newCandle)
      if (candles.length > 200) {
        candles.shift()
      }

      try {
        seriesRef.current.update(newCandle)
      } catch (e) {
        console.warn('[KlineChart] new candle update failed')
      }
    }
    // 如果 currentCandleTime < lastTime，不做任何操作（时间倒退）

    // 更新实时价格线
    if (seriesRef.current && chartRef.current) {
      // 移除旧价格线
      if (priceLineRef.current) {
        seriesRef.current.removePriceLine(priceLineRef.current)
      }

      // 创建新价格线
      const lineColor = newTrend === 'bullish' ? '#26a69a' : '#ef5350'
      priceLineRef.current = seriesRef.current.createPriceLine({
        price,
        color: lineColor,
        lineWidth: 2,
        lineStyle: 0,
        axisLabelVisible: true,
        title: '',
      })
    }

    priceRef.current = price

    // 更新涨跌显示
    const firstPrice = candlesRef.current[0].open
    const change = price - firstPrice
    const changePercent = (change / firstPrice) * 100
    setPriceChange({ value: change, percent: changePercent })
  }, [intervalSeconds])

  // 🎯 初始化图表
  useEffect(() => {
    if (!chartContainerRef.current) return
    isDisposedRef.current = false

    const chart = createChart(chartContainerRef.current, {
      width: width || chartContainerRef.current.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: '#1a1a2e' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: '#2a2a3e' },
        horzLines: { color: '#2a2a3e' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      timeScale: {
        borderColor: '#3a3a4e',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: '#3a3a4e',
      },
    })

    const series = chart.addCandlestickSeries( {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderUpColor: '#26a69a',
      borderDownColor: '#ef5350',
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    })

    chartRef.current = chart
    seriesRef.current = series

    loadData()

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth })
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      isDisposedRef.current = true
      window.removeEventListener('resize', handleResize)
      // 延迟移除图表，确保绘制完成
      setTimeout(() => {
        try {
          chart.remove()
        } catch (e) {
          // ignore
        }
      }, 100)
    }
  }, [symbol, interval, height, width, loadData])

  // 监听价格变化
  useEffect(() => {
    const unsubscribe = useMarketStore.subscribe((state) => {
      if (isDisposedRef.current) return
      
      const price = state.symbols[symbol]?.price
      if (price && price !== priceRef.current) {
        updateLastCandle(price)
      }
    })

    return () => unsubscribe()
  }, [symbol, updateLastCandle])

  // 格式化价格
  const formatPrice = (price: number) => {
    if (price >= 1000) return price.toFixed(2)
    if (price >= 1) return price.toFixed(4)
    return price.toFixed(6)
  }

  const isPositive = priceChange.value >= 0

  return (
    <div className="relative w-full">
      {/* 涨跌信息头部 */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-3 bg-[#1a1a2e]/90 px-3 py-1.5 rounded-lg">
        <div className="text-right">
          <div className={`text-lg font-bold ${isPositive ? 'text-[#26a69a]' : 'text-[#ef5350]'}`}>
            {isPositive ? '+' : ''}{formatPrice(priceChange.value)}
          </div>
          <div className={`text-sm ${isPositive ? 'text-[#26a69a]' : 'text-[#ef5350]'}`}>
            {isPositive ? '+' : ''}{priceChange.percent.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* 波浪效果图例 */}
      {showWave && (
        <div className="absolute top-2 left-2 z-10 bg-[#1a1a2e]/90 px-2 py-1 rounded text-xs text-gray-400 flex gap-2">
          <span>连涨</span>
          <span className="flex gap-0.5">
            <span className="w-2 h-2 rounded-full bg-[#26a69a]"></span>
            <span className="w-2 h-2 rounded-full bg-[#3cbdb4]"></span>
            <span className="w-2 h-2 rounded-full bg-[#52d4ce]"></span>
            <span className="w-2 h-2 rounded-full bg-[#6beae6]"></span>
          </span>
          <span>连跌</span>
          <span className="flex gap-0.5">
            <span className="w-2 h-2 rounded-full bg-[#ef5350]"></span>
            <span className="w-2 h-2 rounded-full bg-[#f06b68]"></span>
            <span className="w-2 h-2 rounded-full bg-[#f28380]"></span>
            <span className="w-2 h-2 rounded-full bg-[#f59b98]"></span>
          </span>
        </div>
      )}

      <div
        ref={chartContainerRef}
        className="w-full rounded-lg overflow-hidden"
        style={{ height: `${height}px` }}
      />
    </div>
  )
}
