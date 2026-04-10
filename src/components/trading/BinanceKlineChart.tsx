'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time, ColorType, CrosshairMode, CandlestickSeries } from 'lightweight-charts'
import { useTranslations } from 'next-intl'

interface BinanceKlineChartProps {
  symbol?: string  // 例如 'BTCUSDT', 'ETHUSDT'
  interval?: string  // 1m, 5m, 15m, 1h, 4h, 1d
  height?: number
  width?: number
  showWave?: boolean
}

// Binance API 配置
const BINANCE_API = 'https://api.binance.com'
const BINANCE_WS = 'wss://stream.binance.com:9443/ws'

// 波浪颜色配置
const WAVE_COLORS = {
  bullish: ['#26a69a', '#3cbdb4', '#52d4ce', '#6beae6', '#84fffe'],
  bearish: ['#ef5350', '#f06b68', '#f28380', '#f59b98', '#ffb3b0'],
}

// 交易对名称映射
const SYMBOL_NAMES: Record<string, string> = {
  'BTCUSDT': 'BTC/USDT',
  'ETHUSDT': 'ETH/USDT',
  'BNBUSDT': 'BNB/USDT',
  'SOLUSDT': 'SOL/USDT',
  'XRPUSDT': 'XRP/USDT',
  'ADAUSDT': 'ADA/USDT',
  'DOGEUSDT': 'DOGE/USDT',
  'DOTUSDT': 'DOT/USDT',
}

export default function BinanceKlineChart({
  symbol = 'BTCUSDT',
  interval = '1h',
  height = 400,
  width,
  showWave = true,
}: BinanceKlineChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const candlesRef = useRef<CandlestickData<Time>[]>([])
  const priceRef = useRef<number>(0)
  const trendRef = useRef<'bullish' | 'bearish'>('bullish')

  const [priceChange, setPriceChange] = useState({ value: 0, percent: 0 })
  const [isConnected, setIsConnected] = useState(false)

  // 获取波浪颜色
  const getWaveColor = useCallback((isBullish: boolean, consecutiveCount: number): string => {
    if (!showWave) {
      return isBullish ? '#26a69a' : '#ef5350'
    }
    const colors = isBullish ? WAVE_COLORS.bullish : WAVE_COLORS.bearish
    return colors[Math.min(consecutiveCount, colors.length - 1)]
  }, [showWave])

  // 格式化交易对名称
  const formatSymbol = (sym: string) => {
    const upper = sym.toUpperCase()
    if (SYMBOL_NAMES[upper]) return SYMBOL_NAMES[upper]
    return upper.replace('USDT', '/USDT')
  }

  // 加载历史数据
  const loadHistory = useCallback(async () => {
    if (!seriesRef.current) return

    try {
      const response = await fetch(
        `${BINANCE_API}/api/v3/klines?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=200`
      )
      
      if (!response.ok) throw new Error('Failed to fetch')
      
      const data = await response.json()
      
      // 计算连续涨跌次数
      let consecutiveBullish = 0
      let consecutiveBearish = 0
      const candles: CandlestickData<Time>[] = []

      data.forEach((k: any[], index: number) => {
        const open = parseFloat(k[1])
        const close = parseFloat(k[4])
        const isBullish = close >= open

        if (isBullish) {
          consecutiveBullish++
          consecutiveBearish = 0
        } else {
          consecutiveBearish++
          consecutiveBullish = 0
        }

        const consecutiveCount = Math.max(consecutiveBullish, consecutiveBearish)
        const color = getWaveColor(isBullish, consecutiveCount)

        candles.push({
          time: Math.floor(k[0] / 1000) as Time,
          open,
          high: parseFloat(k[2]),
          low: parseFloat(k[3]),
          close,
        })
      })

      candlesRef.current = candles
      seriesRef.current.setData(candles)
      chartRef.current?.timeScale().fitContent()

      // 设置涨跌信息
      if (candles.length > 1) {
        const firstPrice = candles[0].open
        const lastPrice = candles[candles.length - 1].close
        setPriceChange({
          value: lastPrice - firstPrice,
          percent: ((lastPrice - firstPrice) / firstPrice) * 100,
        })
        priceRef.current = lastPrice
        trendRef.current = lastPrice >= firstPrice ? 'bullish' : 'bearish'
      }

      console.log(`[BinanceKline] Loaded ${candles.length} candles for ${symbol}`)
    } catch (error) {
      console.error('[BinanceKline] Load history error:', error)
    }
  }, [symbol, interval, getWaveColor])

  // 连接 WebSocket
  const connectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
    }

    const wsPath = `${symbol.toLowerCase()}@kline_${interval}`
    const ws = new WebSocket(`${BINANCE_WS}/${wsPath}`)

    ws.onopen = () => {
      console.log(`[BinanceKline] WebSocket connected: ${wsPath}`)
      setIsConnected(true)
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.e !== 'kline') return

        const kline = data.k
        const candle: CandlestickData<Time> = {
          time: Math.floor(kline.t / 1000) as Time,
          open: parseFloat(kline.o),
          high: parseFloat(kline.h),
          low: parseFloat(kline.l),
          close: parseFloat(kline.c),
        }

        const candles = candlesRef.current
        const lastCandle = candles[candles.length - 1]

        if (lastCandle && candle.time === lastCandle.time) {
          // 更新当前 K 线
          candles[candles.length - 1] = candle
          seriesRef.current?.update(candle)
        } else if (lastCandle && candle.time > lastCandle.time) {
          // 新 K 线
          candles.push(candle)
          if (candles.length > 200) candles.shift()
          seriesRef.current?.update(candle)
        }

        // 更新价格和趋势
        priceRef.current = candle.close
        const firstPrice = candles[0].open
        setPriceChange({
          value: candle.close - firstPrice,
          percent: ((candle.close - firstPrice) / firstPrice) * 100,
        })
      } catch (error) {
        console.error('[BinanceKline] Parse error:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('[BinanceKline] WebSocket error:', error)
    }

    ws.onclose = () => {
      console.log('[BinanceKline] WebSocket closed')
      setIsConnected(false)
      // 5秒后重连
      setTimeout(connectWebSocket, 5000)
    }

    wsRef.current = ws
  }, [symbol, interval])

  // 初始化图表
  useEffect(() => {
    if (!containerRef.current) return

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

    // 加载历史数据
    loadHistory()

    // 连接实时数据
    connectWebSocket()

    // 响应式
    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth })
      }
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (wsRef.current) {
        wsRef.current.close()
      }
      chart.remove()
    }
  }, [symbol, interval, height, width, loadHistory, connectWebSocket])

  const formatPrice = (price: number) => {
    if (price >= 1000) return price.toFixed(2)
    if (price >= 1) return price.toFixed(4)
    return price.toFixed(6)
  }

  const isPositive = priceChange.value >= 0

  return (
    <div className="relative w-full">
      {/* 头部信息 */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-3">
        {/* 连接状态 */}
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        
        {/* 涨跌信息 */}
        <div className="bg-[#1a1a2e]/90 px-3 py-1.5 rounded-lg text-right">
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
        <div className="absolute top-2 left-2 z-10 bg-[#1a1a2e]/90 px-2 py-1 rounded text-xs text-gray-400 flex gap-3">
          <span>Binance</span>
          <span className="flex gap-0.5">
            <span className="w-2 h-2 rounded-full bg-[#26a69a]"></span>
            <span className="w-2 h-2 rounded-full bg-[#3cbdb4]"></span>
            <span className="w-2 h-2 rounded-full bg-[#52d4ce]"></span>
          </span>
          <span className="flex gap-0.5">
            <span className="w-2 h-2 rounded-full bg-[#ef5350]"></span>
            <span className="w-2 h-2 rounded-full bg-[#f06b68]"></span>
            <span className="w-2 h-2 rounded-full bg-[#f28380]"></span>
          </span>
        </div>
      )}

      <div
        ref={containerRef}
        className="w-full rounded-lg overflow-hidden"
        style={{ height: `${height}px` }}
      />
    </div>
  )
}
