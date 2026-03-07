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
import { getKlinesWithCache, fetchBinanceKlines } from '@/lib/binance-klines'

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

  const { symbols, setSymbols } = useMarketStore()

  const [timeframe, setTimeframe] = useState<Timeframe>('1M')
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [actualHeight, setActualHeight] = useState<number>(height)

  const currentSymbol = symbols.find(s => s.symbol === symbol)
  const currentPrice = currentSymbol?.price || 0

  // ✅ 监听交易对变化，清除缓存并重置状态
  useEffect(() => {
    console.log(`[TradingChart] 交易对切换到: ${symbol}`)
    setIsLoading(true)
    lastCandleRef.current = null
    lastPriceRef.current = 0
  }, [symbol])

  useEffect(() => {
    priceRef.current = currentPrice
  }, [currentPrice])

  // ✅ 响应式高度：手机端缩小一半
  // ✅ 监听交易对变化，清除缓存并重置状态
  useEffect(() => {
    console.log(`[TradingChart] 交易对切换到: ${symbol}`)
    setIsLoading(true)
    lastCandleRef.current = null
    lastPriceRef.current = 0
  }, [symbol])

  useEffect(() => {
    const updateHeight = () => {
      if (window.innerWidth < 768) {
        // 手机端：高度的一半
        setActualHeight(Math.floor(height / 2))
      } else {
        // 桌面端：默认高度（可以适当减小）
        setActualHeight(Math.floor(height * 0.8))
      }
    }

    updateHeight()
    window.addEventListener('resize', updateHeight)

    return () => window.removeEventListener('resize', updateHeight)
  }, [height])

  const getInterval = () => {
    return TIMEFRAMES.find(t => t.value === timeframe)?.interval || 60
  }

  // ✅ 生成模拟历史数据（当 API 失败时使用）
  const generateMockHistory = (basePrice: number, count: number = 80): KlineData[] => {
    if (!basePrice || basePrice <= 0) {
      basePrice = 100 // 默认价格
    }

    const now = Math.floor(Date.now() / 1000)
    const interval = getInterval()

    const history: KlineData[] = []
    let price = basePrice

    console.log(`[TradingChart] 生成模拟历史数据: symbol=${symbol}, basePrice=${basePrice}, count=${count}`)

    for (let i = count; i > 0; i--) {
      const time = now - (i * interval)
      const volatility = price * 0.001 // 0.1% 波动（更真实）

      const open = price
      const change = (Math.random() - 0.5) * volatility
      price = price + change

      const high = Math.max(open, price) + Math.random() * volatility * 0.5
      const low = Math.min(open, price) - Math.random() * volatility * 0.5

      history.push({
        time: time as Time,
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(price.toFixed(2)),
      })
    }

    console.log(`[TradingChart] 模拟数据生成完成: ${history.length} 条K线`)
    return history
  }

  // ✅ 从Binance API获取真实历史数据
  const loadHistory = async (
    mountedFlag: React.MutableRefObject<boolean>,
    chartRefLocal: React.MutableRefObject<IChartApi | null>,
    seriesLocal: any
  ): Promise<KlineData[]> => {
    setIsLoading(true)
    console.log(`[TradingChart] 开始加载历史数据: symbol=${symbol}, timeframe=${timeframe}`)

    try {
      const history = await getKlinesWithCache(symbol, timeframe, 80)

      // ✅ 检查组件是否仍然挂载
      if (!mountedFlag.current || !chartRefLocal.current) {
        console.log('[TradingChart] 组件已卸载，取消数据加载')
        return []
      }

      console.log(`[TradingChart] 从Binance API获取到 ${history.length} 条K线`)

      // 转换为图表格式
      const klineData: KlineData[] = history.map(k => ({
        time: k.time as Time,
        open: Number(k.open.toFixed(2)),
        high: Number(k.high.toFixed(2)),
        low: Number(k.low.toFixed(2)),
        close: Number(k.close.toFixed(2)),
      }))

      // ✅ 同步最新价格到 marketStore
      if (klineData.length > 0 && mountedFlag.current) {
        const latestPrice = klineData[klineData.length - 1].close
        console.log(`[TradingChart] 从K线数据同步价格: ${symbol} = ${latestPrice}`)

        // 更新 marketStore 中的价格
        const updatedSymbols = symbols.map((s) => {
          if (s.symbol === symbol) {
            return {
              ...s,
              price: latestPrice,
            }
          }
          return s
        })

        setSymbols(updatedSymbols)
      }

      return klineData
    } catch (error) {
      console.warn('[TradingChart] Binance API 失败，使用模拟历史数据:', error)

      // ✅ 如果API失败，基于当前价格生成模拟历史数据
      let basePrice = currentPrice || getInitialPriceForSymbol(symbol)
      if (!basePrice || basePrice <= 0) {
        basePrice = 100 // 默认价格
      }

      const mockHistory = generateMockHistory(basePrice, 80)

      // 同步最新价格到 marketStore
      if (mockHistory.length > 0 && mountedFlag.current) {
        const latestPrice = mockHistory[mockHistory.length - 1].close
        console.log(`[TradingChart] 从模拟数据同步价格: ${symbol} = ${latestPrice}`)

        const updatedSymbols = symbols.map((s) => {
          if (s.symbol === symbol) {
            return {
              ...s,
              price: latestPrice,
            }
          }
          return s
        })

        setSymbols(updatedSymbols)
      }

      return mockHistory
    } finally {
      // ✅ 只在组件仍然挂载时更新状态
      if (mountedFlag.current) {
        setIsLoading(false)
      }
    }
  }

  // ✅ 获取交易对初始价格（用于生成模拟数据）
  const getInitialPriceForSymbol = (sym: string): number => {
    const priceMap: Record<string, number> = {
      // Crypto
      'BTCUSD': 67890.50,
      'ETHUSD': 3456.78,
      'LTCUSD': 89.45,
      'SOLUSD': 178.23,
      'XRPUSD': 2.34,
      'DOGEUSD': 0.45,
      // Forex
      'EURUSD': 1.08563,
      'GBPUSD': 1.26345,
      'USDJPY': 149.826,
      'USDCHF': 0.88945,
      'EURAUD': 1.65432,
      'EURGBP': 0.85890,
      'EURJPY': 162.567,
      'GBPAUD': 1.92345,
      'GBPNZD': 2.08765,
      'GBPJPY': 189.234,
      'AUDUSD': 0.65432,
      'AUDJPY': 98.123,
      'NZDUSD': 0.61234,
      'NZDJPY': 91.765,
      'CADJPY': 109.876,
      'CHFJPY': 168.543,
      // Gold
      'XAUUSD': 2345.67,
      'XAGUSD': 28.45,
      // Energy
      'NGAS': 2.345,
      'UKOIL': 78.56,
      'USOIL': 76.34,
      // Indices
      'US500': 5234.56,
      'ND25': 18765.43,
      'AUS200': 7890.12,
    }
    return priceMap[sym] || 100
  }

  // ✅ 监听交易对变化，清除缓存并重置状态
  useEffect(() => {
    console.log(`[TradingChart] 交易对切换到: ${symbol}`)
    setIsLoading(true)
    lastCandleRef.current = null
    lastPriceRef.current = 0
  }, [symbol])

  useEffect(() => {

    // ✅ 添加挂载标志
    const isMounted = { current: true }

    if (!chartRef.current) return

    // ✅ 使用默认价格，不依赖 currentPrice
    let effectivePrice = currentPrice
    if (!effectivePrice || effectivePrice <= 0) {
      effectivePrice = getInitialPriceForSymbol(symbol)
      console.log(`[TradingChart] 使用默认价格: ${symbol} = ${effectivePrice}`)
    }

    priceRef.current = effectivePrice

    console.log(`[TradingChart] 初始化图表: symbol=${symbol}, price=${effectivePrice}`)

    const chart = createChart(chartRef.current, {

      width: chartRef.current.clientWidth,
      height: actualHeight,

      layout: {
        background: { type: ColorType.Solid, color: '#fafafa' },
        textColor: '#666',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      },

      grid: {
        vertLines: { color: '#e5e5e5', style: 0 },
        horzLines: { color: '#e5e5e5', style: 0 }
      },

      rightPriceScale: {
        autoScale: true,
        borderColor: 'transparent',
        scaleMargins: {
          top: 0.1,
          bottom: 0.2,
        },
      },

      leftPriceScale: {
        visible: false,
      },

      timeScale: {
        borderColor: 'transparent',
        timeVisible: true,
        secondsVisible: false,
      },

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

    // ✅ 从Binance API加载真实历史数据
    const initializeChart = async () => {
      if (!isMounted.current) return

      const history = await loadHistory(isMounted, chartInstance, series)

      // ✅ 检查组件是否仍然挂载
      if (!isMounted.current || !chartInstance.current || !seriesRef.current) {
        console.log('[TradingChart] 组件已卸载，取消图表初始化')
        return
      }

      if (history.length > 0) {
        try {
          series.setData(history)
          lastCandleRef.current = history[history.length - 1]
          lastPriceRef.current = effectivePrice
          chart.timeScale().fitContent()
        } catch (error) {
          console.warn('[TradingChart] setData error:', error)
        }
      }
    }

    initializeChart()

    intervalRef.current = setInterval(() => {

      const price = priceRef.current

      if (!price) return

      // ✅ 检查组件是否仍然挂载
      if (!isMounted.current || !chartInstance.current || !seriesRef.current) return

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

        try {
          series.update(newCandle)
        } catch (error) {
          console.warn('[TradingChart] update new candle error:', error)
          return
        }

        lastCandleRef.current = newCandle

      } else {

        const updated = {

          time: lastTime as Time,
          open: lastCandle.open,
          high: Math.max(lastCandle.high, price),
          low: Math.min(lastCandle.low, price),
          close: price
        }

        try {
          series.update(updated)
        } catch (error) {
          console.warn('[TradingChart] update candle error:', error)
          return
        }

        lastCandleRef.current = updated
      }

      lastPriceRef.current = price

      try {
        chart.timeScale().scrollToRealTime()
      } catch (error) {
        console.warn('[TradingChart] scrollToRealTime error:', error)
      }

    }, 1000)

    const handleResize = () => {

      if (!chartInstance.current || !chartRef.current) return

      try {
        chartInstance.current.applyOptions({
          width: chartRef.current.clientWidth,
          height: actualHeight
        })
      } catch (error) {
        console.warn('[TradingChart] Resize error:', error)
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {

      // ✅ 标记组件已卸载
      isMounted.current = false

      // 清除定时器
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }

      // 移除事件监听
      window.removeEventListener('resize', handleResize)

      // 销毁图表实例
      if (chartInstance.current) {
        try {
          chart.remove()
        } catch (error) {
          console.warn('[TradingChart] chart.remove error:', error)
        }
        chartInstance.current = null
      }
      seriesRef.current = null

    }

  }, [symbol, timeframe, actualHeight, currentPrice, symbols, setSymbols])

  return (
    <div className="relative">

      <div className="absolute top-2 left-2 z-10 flex gap-1">

        {TIMEFRAMES.map(tf => (

          <button
            key={tf.value}
            onClick={() => setTimeframe(tf.value as Timeframe)}
            className={`px-3 py-1 text-xs rounded ${
              timeframe === tf.value
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tf.value}
          </button>

        ))}

      </div>

      {/* 加载指示器 */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-20">
          <div className="text-gray-600 text-sm">加载历史数据...</div>
        </div>
      )}

      <div
        ref={chartRef}
        className="trading-chart-container"
        style={{
          width: '100%',
          height: `${actualHeight}px`
        }}
      />

    </div>
  )
}
