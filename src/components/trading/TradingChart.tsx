'use client'

import { useEffect, useRef, useState } from 'react'
import {
  createChart,
  ColorType,
  IChartApi,
  Time,
  CandlestickSeries
} from 'lightweight-charts'

import { useMarketStore } from '@/stores/marketStore'
import { FIXED_KLINE_HISTORY, adjustHistoryToPrice } from '@/lib/kline-history'

interface TradingChartProps {
  symbol?: string
  height?: number
}

type Timeframe = '1M' | '5M' | '15M' | '1H'

const TIMEFRAMES = [
  { value: '1M', interval: 60 },
  { value: '5M', interval: 300 },
  { value: '15M', interval: 900 },
  { value: '1H', interval: 3600 }
]

interface KlineData {
  time: Time
  open: number
  high: number
  low: number
  close: number
}

export default function TradingChart({
  symbol = 'BTCUSD',
  height = 500
}: TradingChartProps) {

  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<IChartApi | null>(null)
  const seriesRef = useRef<any>(null)

  const lastCandleRef = useRef<KlineData | null>(null)
  const lastPriceRef = useRef<number>(0)

  const priceRef = useRef<number>(0)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const { symbols } = useMarketStore()

  const [timeframe, setTimeframe] = useState<Timeframe>('1M')

  const currentSymbol = symbols.find(s => s.symbol === symbol)
  const currentPrice = currentSymbol?.price || 0

  useEffect(() => {
    priceRef.current = currentPrice
  }, [currentPrice])

  const getInterval = () => {
    return TIMEFRAMES.find(t => t.value === timeframe)?.interval || 60
  }

  // ✅ 使用固定的历史数据（不再随机生成）
  const getHistory = (price: number) => {
    // 根据当前价格调整历史数据，使其价格水平匹配
    return adjustHistoryToPrice(FIXED_KLINE_HISTORY, price)
  }

  useEffect(() => {

    if (!chartRef.current) return
    if (!currentPrice) return

    const chart = createChart(chartRef.current, {

      width: chartRef.current.clientWidth,
      height: height,

      layout: {
        background: { type: ColorType.Solid, color: '#0a0a0a' },
        textColor: '#DDD'
      },

      grid: {
        vertLines: { color: '#1f1f1f' },
        horzLines: { color: '#1f1f1f' }
      },

      rightPriceScale: {
        autoScale: true,
        borderColor: '#333'
      },

      timeScale: {
        borderColor: '#333',
        timeVisible: true
      }

    })

    const series = chart.addSeries(CandlestickSeries, {

      upColor: '#00ff9c',
      downColor: '#ff4976',

      borderVisible: false,

      wickUpColor: '#00ff9c',
      wickDownColor: '#ff4976'

    })

    chartInstance.current = chart
    seriesRef.current = series

    // ✅ 使用固定的历史数据
    const history = getHistory(currentPrice)

    series.setData(history)

    lastCandleRef.current = history[history.length - 1]

    lastPriceRef.current = currentPrice

    chart.timeScale().fitContent()

    intervalRef.current = setInterval(() => {

      const price = priceRef.current

      if (!price) return

      const interval = getInterval()

      const now = Math.floor(Date.now() / 1000)

      const candleTime = Math.floor(now / interval) * interval

      const lastCandle = lastCandleRef.current

      if (!lastCandle) return

      const lastTime =
        typeof lastCandle.time === 'number'
          ? lastCandle.time
          : Number(lastCandle.time)

      if (candleTime > lastTime) {

        const newCandle = {

          time: candleTime as Time,
          open: lastCandle.close,
          high: price,
          low: price,
          close: price
        }

        series.update(newCandle)

        lastCandleRef.current = newCandle

      } else {

        const updated = {

          time: lastTime as Time,
          open: lastCandle.open,
          high: Math.max(lastCandle.high, price),
          low: Math.min(lastCandle.low, price),
          close: price
        }

        series.update(updated)

        lastCandleRef.current = updated
      }

      lastPriceRef.current = price

      chart.timeScale().scrollToRealTime()

    }, 1000)

    const handleResize = () => {

      if (!chartInstance.current || !chartRef.current) return

      chartInstance.current.applyOptions({
        width: chartRef.current.clientWidth
      })
    }

    window.addEventListener('resize', handleResize)

    return () => {

      if (intervalRef.current) clearInterval(intervalRef.current)

      window.removeEventListener('resize', handleResize)

      chart.remove()

    }

  }, [symbol, timeframe, height, currentPrice])

  return (

    <div className="relative">

      <div className="absolute top-2 left-2 z-10 flex gap-1">

        {TIMEFRAMES.map(tf => (

          <button
            key={tf.value}
            onClick={() => setTimeframe(tf.value as Timeframe)}
            className={`px-3 py-1 text-xs rounded ${
              timeframe === tf.value
                ? 'bg-[#2d2d2d] text-white'
                : 'text-gray-400'
            }`}
          >
            {tf.value}
          </button>

        ))}

      </div>

      <div
        ref={chartRef}
        style={{
          width: '100%',
          height: `${height}px`
        }}
      />

    </div>
  )
}
