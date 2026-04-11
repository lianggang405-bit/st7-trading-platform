'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time, ColorType, CrosshairMode } from 'lightweight-charts'
import { useTranslations } from 'next-intl'
import ChartErrorBoundary from './ChartErrorBoundary'

interface BinanceKlineChartProps {
  symbol?: string  // 例如 'BTCUSDT', 'ETHUSDT'
  interval?: string  // 1m, 5m, 15m, 1h, 4h, 1d
  height?: number
  width?: number
  showWave?: boolean
}

// 波浪颜色配置
const WAVE_COLORS = {
  bullish: ['#26a69a', '#3cbdb4', '#52d4ce', '#6beae6', '#84fffe'],
  bearish: ['#ef5350', '#f06b68', '#f28380', '#f59b98', '#ffb3b0'],
}

// 交易对默认价格映射
const DEFAULT_PRICES: Record<string, number> = {
  'BTCUSDT': 65000,
  'ETHUSDT': 3500,
  'BNBUSDT': 600,
  'SOLUSDT': 150,
  'XRPUSDT': 0.6,
  'ADAUSDT': 0.5,
  'DOGEUSDT': 0.15,
  'DOTUSDT': 7,
  'MATICUSDT': 0.8,
  'LTCUSDT': 85,
  'AVAXUSDT': 35,
  'LINKUSDT': 15,
  'ATOMUSDT': 9,
  'UNIUSDT': 10,
  'XLMUSDT': 0.12,
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
  const candlesRef = useRef<CandlestickData<Time>[]>([])
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const priceRef = useRef<number>(0)
  const lastFetchTimeRef = useRef<number>(0)

  const [priceChange, setPriceChange] = useState({ value: 0, percent: 0 })
  const [isConnected, setIsConnected] = useState(false)
  const isDisposedRef = useRef(false)

  // 获取波浪颜色
  const getWaveColor = useCallback((isBullish: boolean, consecutiveCount: number): string => {
    if (!showWave) {
      return isBullish ? '#26a69a' : '#ef5350'
    }
    const colors = isBullish ? WAVE_COLORS.bullish : WAVE_COLORS.bearish
    return colors[Math.min(consecutiveCount, colors.length - 1)]
  }, [showWave])

  // 生成模拟数据
  const generateMockData = useCallback((basePrice: number, count: number): CandlestickData<Time>[] => {
    const candles: CandlestickData<Time>[] = []
    const now = Math.floor(Date.now() / 1000)
    const intervalSec = interval === '1' ? 60 : interval === '5' ? 300 : 
                        interval === '15' ? 900 : interval === '30' ? 1800 :
                        interval === '60' ? 3600 : interval === '240' ? 14400 :
                        interval === '1D' ? 86400 : 3600
    
    const currentCandleTime = Math.floor(now / intervalSec) * intervalSec
    let price = basePrice * 0.98

    for (let i = count - 1; i >= 0; i--) {
      const time = (currentCandleTime - i * intervalSec) as Time
      const open = price
      const changePercent = (Math.random() - 0.48) * 0.002
      price = open * (1 + changePercent)
      const close = price

      candles.push({
        time,
        open,
        high: Math.max(open, close) * 1.001,
        low: Math.min(open, close) * 0.999,
        close,
      })
    }

    return candles
  }, [interval])

  // 获取时间周期秒数
  const getIntervalSeconds = useCallback(() => {
    const map: Record<string, number> = {
      '1': 60, '5': 300, '15': 900, '30': 1800,
      '60': 3600, '240': 14400, '1D': 86400, '1W': 604800
    }
    return map[interval] || 3600
  }, [interval])

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

    // 立即加载历史数据（使用闭包中的 series）
    const basePrice = DEFAULT_PRICES[symbol.toUpperCase()] || 1000
    const loadInitialData = async () => {
      // 检查组件是否已卸载
      if (isDisposedRef.current) {
        console.log('[BinanceKline] Skipping load - component disposed')
        return
      }
      
      try {
        const response = await fetch(
          `/api/binance/klines?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=200`
        )
        
        // 再次检查组件是否已卸载
        if (isDisposedRef.current) return
        
        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data && result.data.length > 0 && !isDisposedRef.current) {
            const candles: CandlestickData<Time>[] = result.data.map((k: any) => ({
              time: k.time as Time,
              open: k.open,
              high: k.high,
              low: k.low,
              close: k.close,
            }))
            candlesRef.current = candles
            
            // 使用 try-catch 防止 setData 时组件已卸载
            try {
              series.setData(candles)
              chart.timeScale().fitContent()
            } catch (e) {
              console.warn('[BinanceKline] setData failed:', e)
              return
            }
            
            setIsConnected(true)
            if (candles.length > 1) {
              const firstPrice = candles[0].open
              const lastPrice = candles[candles.length - 1].close
              setPriceChange({
                value: lastPrice - firstPrice,
                percent: ((lastPrice - firstPrice) / firstPrice) * 100,
              })
              priceRef.current = lastPrice
            }
            console.log(`[BinanceKline] Loaded ${candles.length} candles from API`)
            return
          }
        }
      } catch (error) {
        console.warn('[BinanceKline] API failed, using mock data')
      }

      // 使用模拟数据
      if (isDisposedRef.current) return
      const mockData = generateMockData(basePrice, 200)
      candlesRef.current = mockData
      
      try {
        series.setData(mockData)
        chart.timeScale().fitContent()
      } catch (e) {
        console.warn('[BinanceKline] setData failed:', e)
        return
      }
      
      setIsConnected(false)
      if (mockData.length > 0) {
        priceRef.current = mockData[mockData.length - 1].close
      }
      console.log(`[BinanceKline] Using mock data for ${symbol}`)
    }

    loadInitialData()

    // 响应式
    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth })
      }
    }
    window.addEventListener('resize', handleResize)

    return () => {
      // 立即标记为已卸载，防止任何更新操作
      isDisposedRef.current = true
      window.removeEventListener('resize', handleResize)
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
      // 立即移除图表，避免后续 setData 调用
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
  }, [symbol, interval, height, width, generateMockData])

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
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'}`} />
        
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
          <span>{isConnected ? 'Binance' : 'Simulation'}</span>
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
