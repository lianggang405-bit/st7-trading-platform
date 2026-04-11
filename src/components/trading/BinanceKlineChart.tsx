'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time, ColorType, CrosshairMode } from 'lightweight-charts'
import { useTranslations } from 'next-intl'
import { useBinanceWebSocket, BinanceKline } from '@/hooks/useBinanceWebSocket'
import ChartErrorBoundary from './ChartErrorBoundary'

// 默认价格（用于生成模拟数据）
const DEFAULT_PRICES: Record<string, number> = {
  'BTCUSDT': 65000,
  'ETHUSDT': 3500,
  'BNBUSDT': 600,
  'XAUUSDT': 2350,
  'SOLUSDT': 150,
  'XRPUSDT': 0.6,
}

// 时间周期映射
const INTERVAL_MAP: Record<string, string> = {
  '1m': '1m',
  '5m': '5m',
  '15m': '15m',
  '30m': '30m',
  '1h': '1h',
  '4h': '4h',
  '1d': '1d',
  '1w': '1w',
}

// 生成模拟 K 线数据
function generateMockKlines(symbol: string, interval: string, limit: number, basePrice?: number) {
  const now = Math.floor(Date.now() / 1000)
  const intervalSeconds = 
    interval === '1m' ? 60 :
    interval === '5m' ? 300 :
    interval === '15m' ? 900 :
    interval === '30m' ? 1800 :
    interval === '1h' ? 3600 :
    interval === '4h' ? 14400 :
    interval === '1d' ? 86400 :
    interval === '1w' ? 604800 : 3600

  const price = basePrice || DEFAULT_PRICES[symbol.toUpperCase()] || 1000
  const currentCandleTime = Math.floor(now / intervalSeconds) * intervalSeconds
  const candles: CandlestickData<Time>[] = []

  for (let i = limit - 1; i >= 0; i--) {
    const time = (currentCandleTime - i * intervalSeconds) as Time
    const volatility = price * 0.02
    const trend = Math.sin(i / 20) * volatility
    const open = price + trend + (Math.random() - 0.5) * volatility
    const close = open + (Math.random() - 0.5) * volatility
    const high = Math.max(open, close) + Math.random() * volatility * 0.3
    const low = Math.min(open, close) - Math.random() * volatility * 0.3

    candles.push({
      time,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
    })
  }

  return candles
}

interface BinanceKlineChartProps {
  symbol?: string
  interval?: string
  height?: number
  width?: number
  showHeader?: boolean
}

export default function BinanceKlineChart({
  symbol = 'BTCUSDT',
  interval = '1h',
  height = 500,
  width,
  showHeader = true,
}: BinanceKlineChartProps) {
  const t = useTranslations('Trade')
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const candlesRef = useRef<CandlestickData<Time>[]>([])
  const isDisposedRef = useRef(false)

  const [isConnected, setIsConnected] = useState(false)
  const [priceChange, setPriceChange] = useState({ value: 0, percent: 0 })

  // WebSocket K 线回调
  const handleKline = useCallback((kline: BinanceKline) => {
    if (isDisposedRef.current || !seriesRef.current) return

    const newCandle: CandlestickData<Time> = {
      time: kline.time as Time,
      open: kline.open,
      high: kline.high,
      low: kline.low,
      close: kline.close,
    }

    const candles = candlesRef.current
    const lastCandle = candles[candles.length - 1]

    if (kline.isClosed) {
      // 新K线
      candles.push(newCandle)
      if (candles.length > 200) candles.shift()
    } else {
      // 更新当前K线
      if (lastCandle && lastCandle.time === kline.time) {
        candles[candles.length - 1] = newCandle
      } else {
        candles.push(newCandle)
        if (candles.length > 200) candles.shift()
      }
    }

    try {
      seriesRef.current?.update(newCandle)
    } catch (e) {
      // ignore dispose error
    }

    // 更新涨跌
    if (candles.length > 1) {
      const firstPrice = candles[0].open
      const currentPrice = kline.close
      setPriceChange({
        value: currentPrice - firstPrice,
        percent: ((currentPrice - firstPrice) / firstPrice) * 100,
      })
    }
  }, [])

  // 连接币安 WebSocket
  const { isConnected: wsConnected, error: wsError } = useBinanceWebSocket({
    symbol,
    interval: INTERVAL_MAP[interval] || interval,
    onKline: handleKline,
  })

  // 设置 K 线数据到图表
  const setData = useCallback((candles: CandlestickData<Time>[]) => {
    if (isDisposedRef.current || !seriesRef.current) return
    try {
      seriesRef.current.setData(candles)
      chartRef.current?.timeScale().fitContent()
    } catch (e) {
      // ignore
    }
  }, [])

  // 初始化图表
  useEffect(() => {
    if (!containerRef.current) return
    isDisposedRef.current = false

    const chart = createChart(containerRef.current, {
      width: width || containerRef.current.clientWidth,
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
      handleScroll: false,
      handleScale: false,
    })

    const series = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderUpColor: '#26a69a',
      borderDownColor: '#ef5350',
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    })

    chartRef.current = chart
    seriesRef.current = series

    // 加载历史数据
    const basePrice = DEFAULT_PRICES[symbol.toUpperCase()]
    const mockData = generateMockKlines(symbol, interval, 200, basePrice)
    candlesRef.current = mockData
    
    try {
      series.setData(mockData)
      chart.timeScale().fitContent()
      
      // 设置涨跌
      if (mockData.length > 1) {
        const firstPrice = mockData[0].open
        const lastPrice = mockData[mockData.length - 1].close
        setPriceChange({
          value: lastPrice - firstPrice,
          percent: ((lastPrice - firstPrice) / firstPrice) * 100,
        })
      }
      
      console.log(`[BinanceKline] Loaded ${mockData.length} candles for ${symbol}`)
    } catch (e) {
      console.warn('[BinanceKline] Failed to set data:', e)
    }

    // 响应式
    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth })
      }
    }
    window.addEventListener('resize', handleResize)

    return () => {
      isDisposedRef.current = true
      window.removeEventListener('resize', handleResize)
      if (chartRef.current) {
        try {
          chartRef.current.remove()
        } catch (e) {
          // ignore
        }
        chartRef.current = null
      }
      seriesRef.current = null
    }
  }, [symbol, interval, height, width])

  // 更新连接状态
  useEffect(() => {
    setIsConnected(wsConnected)
  }, [wsConnected])

  const formatPrice = (price: number) => {
    if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    if (price >= 1) return price.toFixed(4)
    return price.toFixed(6)
  }

  const formatChange = (value: number, percent: number) => {
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(2)} (${sign}${percent.toFixed(2)}%)`
  }

  return (
    <div className="relative">
      {showHeader && (
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <span className="text-lg font-semibold text-white">
              {symbol.replace('USDT', '/USDT')}
            </span>
            <span className="text-sm text-gray-400">
              {interval.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className={`text-sm ${priceChange.value >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {formatChange(priceChange.value, priceChange.percent)}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded ${
              isConnected ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'
            }`}>
              {isConnected ? 'LIVE' : 'OFFLINE'}
            </span>
          </div>
        </div>
      )}

      <ChartErrorBoundary>
        <div
          ref={containerRef}
          className="w-full rounded-lg overflow-hidden"
          style={{ height: `${height}px` }}
        />
      </ChartErrorBoundary>

      {wsError && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-yellow-500/20 text-yellow-500 text-xs px-3 py-1 rounded">
          WebSocket disconnected, using cached data
        </div>
      )}
    </div>
  )
}
