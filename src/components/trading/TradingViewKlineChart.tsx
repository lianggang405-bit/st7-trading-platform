'use client'

import { useEffect, useRef, useCallback } from 'react'
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time, ColorType, CrosshairMode, CandlestickSeries } from 'lightweight-charts'
import { useMarketStore } from '@/store/marketStore'

interface TradingViewKlineChartProps {
  symbol?: string
  interval?: string
  height?: number
  width?: number
  limit?: number
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

export default function TradingViewKlineChart({
  symbol = 'BTC/USDT',
  interval = '1h',
  height = 400,
  width,
}: TradingViewKlineChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const lastCandleRef = useRef<CandlestickData<Time> | null>(null)
  const priceRef = useRef<number>(0)

  const intervalSeconds = INTERVALS[interval] || INTERVALS['1h']

  // 生成模拟数据
  const generateMockData = useCallback((basePrice: number, count: number): CandlestickData<Time>[] => {
    const candles: CandlestickData<Time>[] = []
    const now = Math.floor(Date.now() / 1000)
    const volatility = 0.001

    for (let i = count - 1; i >= 0; i--) {
      const time = (now - i * intervalSeconds) as Time
      let price = basePrice

      if (candles.length > 0) {
        const prevClose = candles[candles.length - 1].close
        price = prevClose + (Math.random() - 0.5) * volatility * prevClose
      }

      const open = price
      const close = price + (Math.random() - 0.5) * volatility * price
      const high = Math.max(open, close) * (1 + Math.random() * 0.001)
      const low = Math.min(open, close) * (1 - Math.random() * 0.001)

      candles.push({ time, open, high, low, close })
    }

    return candles
  }, [intervalSeconds])

  // 加载数据
  const loadData = useCallback(async () => {
    if (!seriesRef.current) return

    try {
      const response = await fetch(`/api/market/data?symbol=${encodeURIComponent(symbol)}`)
      const data = await response.json()
      const basePrice = data?.data?.price || 1000
      const mockData = generateMockData(basePrice, 200)
      seriesRef.current.setData(mockData)
      lastCandleRef.current = mockData[mockData.length - 1]
      priceRef.current = mockData[mockData.length - 1].close
      chartRef.current?.timeScale().fitContent()
    } catch (e) {
      const mockData = generateMockData(1000, 200)
      seriesRef.current?.setData(mockData)
      lastCandleRef.current = mockData[mockData.length - 1]
      priceRef.current = mockData[mockData.length - 1].close
      chartRef.current?.timeScale().fitContent()
    }
  }, [symbol, generateMockData])

  // 更新K线
  const updateCandle = useCallback((price: number) => {
    if (!seriesRef.current || !lastCandleRef.current) return

    const now = Math.floor(Date.now() / 1000)
    const currentCandleTime = Math.floor(now / intervalSeconds) * intervalSeconds
    const lastTime = typeof lastCandleRef.current.time === 'number'
      ? lastCandleRef.current.time
      : Number(lastCandleRef.current.time)

    if (currentCandleTime === lastTime) {
      // 更新当前K线
      const updated: CandlestickData<Time> = {
        time: lastCandleRef.current.time,
        open: lastCandleRef.current.open,
        high: Math.max(lastCandleRef.current.high, price),
        low: Math.min(lastCandleRef.current.low, price),
        close: price,
      }
      try {
        seriesRef.current?.update(updated)
        lastCandleRef.current = updated
        priceRef.current = price
      } catch (e) {
        // 忽略
      }
    } else {
      // 新K线
      const newCandle: CandlestickData<Time> = {
        time: currentCandleTime as Time,
        open: price,
        high: price,
        low: price,
        close: price,
      }
      try {
        seriesRef.current?.update(newCandle)
        lastCandleRef.current = newCandle
        priceRef.current = price
      } catch (e) {
        // 忽略
      }
    }
  }, [intervalSeconds])

  // 初始化图表
  useEffect(() => {
    if (!chartContainerRef.current) return

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

    const series = chart.addSeries(CandlestickSeries, {
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
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [symbol, interval, height, width, loadData])

  // 监听价格变化
  useEffect(() => {
    const interval = setInterval(() => {
      const price = useMarketStore.getState().symbols[symbol]?.price
      if (price && price !== priceRef.current) {
        updateCandle(price)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [symbol, updateCandle])

  return (
    <div className="relative w-full">
      <div
        ref={chartContainerRef}
        className="w-full rounded-lg overflow-hidden"
        style={{ height: `${height}px` }}
      />
    </div>
  )
}
