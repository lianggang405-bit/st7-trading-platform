'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time, ColorType, CrosshairMode } from 'lightweight-charts'
import { useBinanceWebSocket, BinanceKline } from '@/hooks/useBinanceWebSocket'
import { useOKXWebSocket, OKXKline } from '@/hooks/useOKXWebSocket'
import ChartErrorBoundary from './ChartErrorBoundary'

// 默认价格（用于生成模拟数据）
const DEFAULT_PRICES: Record<string, number> = {
  'BTCUSDT': 65000,
  'ETHUSDT': 3500,
  'BNBUSDT': 600,
  'XAUUSDT': 2350,
  'SOLUSDT': 150,
  'XRPUSDT': 0.6,
  'ADAUSDT': 0.45,
  'DOGEUSDT': 0.08,
  'DOTUSDT': 7.5,
  'MATICUSDT': 0.85,
}

// 币安不支持的交易对（需要使用模拟数据）
const UNSUPPORTED_SYMBOLS = ['XAUUSD', 'XAU', 'XAGUSD', 'XAG', 'EURUSD', 'GBPUSD', 'USDJPY']

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

// 是否是币安支持的交易对
function isBinanceSupported(symbol: string): boolean {
  return !UNSUPPORTED_SYMBOLS.includes(symbol.toUpperCase())
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
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const candlesRef = useRef<CandlestickData<Time>[]>([])
  const isDisposedRef = useRef(false)
  const priceRef = useRef(0)

  const [isConnected, setIsConnected] = useState(false)
  const [dataSource, setDataSource] = useState<'Binance' | 'OKX' | 'Mock'>('Mock')
  const [priceChange, setPriceChange] = useState({ value: 0, percent: 0 })

  // 处理 K 线数据更新
  const handleKlineUpdate = useCallback((candle: CandlestickData<Time>) => {
    if (isDisposedRef.current || !seriesRef.current) return

    const candles = candlesRef.current
    const lastCandle = candles[candles.length - 1]

    if (lastCandle && lastCandle.time === candle.time) {
      // 更新当前 K 线
      candles[candles.length - 1] = candle
    } else {
      // 新 K 线
      candles.push(candle)
      if (candles.length > 200) candles.shift()
    }

    try {
      seriesRef.current.update(candle)
      priceRef.current = candle.close
    } catch (e) {
      // ignore
    }

    // 更新涨跌
    if (candles.length > 1) {
      const firstPrice = candles[0].open
      const currentPrice = candle.close
      setPriceChange({
        value: currentPrice - firstPrice,
        percent: ((currentPrice - firstPrice) / firstPrice) * 100,
      })
    }
  }, [])

  // 币安 WebSocket 回调
  const handleBinanceKline = useCallback((kline: BinanceKline) => {
    handleKlineUpdate({
      time: kline.time as Time,
      open: kline.open,
      high: kline.high,
      low: kline.low,
      close: kline.close,
    })
  }, [handleKlineUpdate])

  // OKX WebSocket 回调
  const handleOKXKline = useCallback((kline: OKXKline) => {
    handleKlineUpdate({
      time: kline.time as Time,
      open: kline.open,
      high: kline.high,
      low: kline.low,
      close: kline.close,
    })
  }, [handleKlineUpdate])

  // 币安 WebSocket
  const { isConnected: binanceConnected } = useBinanceWebSocket({
    symbol,
    interval: INTERVAL_MAP[interval] || interval,
    onKline: isBinanceSupported(symbol) ? handleBinanceKline : undefined,
    reconnect: true,
  })

  // OKX WebSocket（备用）
  const { isConnected: okxConnected } = useOKXWebSocket({
    symbol,
    interval: INTERVAL_MAP[interval] || interval,
    onKline: handleOKXKline,
    reconnect: true,
  })

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

    // 加载初始数据
    const basePrice = DEFAULT_PRICES[symbol.toUpperCase()]
    const mockData = generateMockKlines(symbol, interval, 200, basePrice)
    candlesRef.current = mockData

    try {
      series.setData(mockData)
      chart.timeScale().fitContent()

      if (mockData.length > 1) {
        const firstPrice = mockData[0].open
        const lastPrice = mockData[mockData.length - 1].close
        setPriceChange({
          value: lastPrice - firstPrice,
          percent: ((lastPrice - firstPrice) / firstPrice) * 100,
        })
        priceRef.current = lastPrice
      }

      console.log(`[KlineChart] Loaded ${mockData.length} candles for ${symbol}`)
    } catch (e) {
      console.warn('[KlineChart] Failed to set data:', e)
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
    if (binanceConnected) {
      setIsConnected(true)
      setDataSource('Binance')
    } else if (okxConnected) {
      setIsConnected(true)
      setDataSource('OKX')
    } else {
      setIsConnected(false)
      setDataSource('Mock')
    }
  }, [binanceConnected, okxConnected])

  const formatPrice = (price: number) => {
    if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    if (price >= 1) return price.toFixed(4)
    return price.toFixed(6)
  }

  const formatChange = (value: number, percent: number) => {
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(2)} (${sign}${percent.toFixed(2)}%)`
  }

  const getSourceColor = () => {
    switch (dataSource) {
      case 'Binance': return 'bg-blue-500/20 text-blue-500'
      case 'OKX': return 'bg-green-500/20 text-green-500'
      default: return 'bg-yellow-500/20 text-yellow-500'
    }
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
            <span className={`text-xs px-2 py-0.5 rounded ${getSourceColor()}`}>
              {dataSource}
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
    </div>
  )
}
