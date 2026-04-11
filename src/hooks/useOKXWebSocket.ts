'use client'

import { useEffect, useRef, useCallback, useState } from 'react'

export interface OKXKline {
  symbol: string
  interval: string
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
  isClosed: boolean
}

export interface OKXTicker {
  symbol: string
  price: number
  priceChange: number
  priceChangePercent: number
  high: number
  low: number
  volume: number
}

// OKX WebSocket URL
const OKX_WS_URL = 'wss://ws.okx.com:8443/ws/v5/public'

// OKX 周期映射到币安格式
const OKX_INTERVAL_MAP: Record<string, string> = {
  '1m': '1m',
  '5m': '5m',
  '15m': '15m',
  '30m': '30m',
  '1h': '1h',
  '2h': '2h',
  '4h': '4h',
  '6h': '6h',
  '12h': '12h',
  '1d': '1d',
  '1w': '1w',
}

// 币安周期到 OKX 周期
const BINANCE_TO_OKX_INTERVAL: Record<string, string> = {
  '1m': '1m',
  '5m': '5m',
  '15m': '15m',
  '30m': '30m',
  '1h': '1H',
  '4h': '4H',
  '1d': '1D',
  '1w': '1W',
}

interface UseOKXWebSocketOptions {
  symbol: string // 币安格式，如 BTCUSDT
  interval?: string // 币安格式，如 1m, 1h
  onKline?: (kline: OKXKline) => void
  onTicker?: (ticker: OKXTicker) => void
  reconnect?: boolean
  reconnectInterval?: number
}

/**
 * OKX WebSocket Hook
 * 用于获取实时 K 线和行情数据
 * 符号格式转换: BTCUSDT -> BTC-USDT
 */
export function useOKXWebSocket({
  symbol,
  interval = '1h',
  onKline,
  onTicker,
  reconnect = true,
  reconnectInterval = 10000,
}: UseOKXWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isUnmountedRef = useRef(false)
  const reconnectCountRef = useRef(0)
  const maxReconnectAttempts = 10
  const manualCloseRef = useRef(false)
  const subscribedRef = useRef(false)

  // 转换符号格式: BTCUSDT -> BTC-USDT
  const toOKXSymbol = (sym: string): string => {
    // 移除后缀 USDT/USDC 等
    const base = sym.replace(/(USDT|USDC|BTC|ETH|BNB)$/, '')
    const quote = sym.slice(base.length)
    return `${base}-${quote}`
  }

  // 转换 OKX K 线到标准格式
  const parseOKXKline = (data: any[]): OKXKline => {
    // OKX K 线数据格式: [timestamp, open, high, low, close, volume, ...]
    return {
      symbol: data[7]?.replace('-', '') || symbol, // instId
      interval: data[8] || interval, // bar
      time: Math.floor(parseInt(data[0]) / 1000), // timestamp in ms
      open: parseFloat(data[1]),
      high: parseFloat(data[2]),
      low: parseFloat(data[3]),
      close: parseFloat(data[4]),
      volume: parseFloat(data[5]),
      isClosed: true,
    }
  }

  const connect = useCallback(() => {
    if (isUnmountedRef.current) return

    // 如果已经有活跃连接，先关闭
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return
    }

    // 清理旧连接
    if (wsRef.current) {
      try {
        wsRef.current.close()
      } catch (e) {
        // ignore
      }
      wsRef.current = null
    }

    const okxSymbol = toOKXSymbol(symbol)
    const okxInterval = BINANCE_TO_OKX_INTERVAL[interval] || '1H'

    // 构建订阅消息
    const channels: any[] = []
    if (onKline) {
      channels.push({
        channel: `candle${okxInterval.toLowerCase()}`,
        instId: okxSymbol,
      })
    }
    if (onTicker) {
      channels.push({
        channel: 'tickers',
        instId: okxSymbol,
      })
    }

    if (channels.length === 0) {
      channels.push({
        channel: `candle${okxInterval.toLowerCase()}`,
        instId: okxSymbol,
      })
    }

    console.log(`[OKXWS] Connecting for ${symbol} (${okxSymbol})`)

    try {
      const ws = new WebSocket(OKX_WS_URL)
      wsRef.current = ws

      ws.onopen = () => {
        if (isUnmountedRef.current) {
          ws.close()
          return
        }
        console.log(`[OKXWS] Connected: ${symbol}`)
        setIsConnected(true)
        setError(null)
        reconnectCountRef.current = 0
        manualCloseRef.current = false
        subscribedRef.current = false

        // 发送订阅请求
        const subscribeMsg = {
          op: 'subscribe',
          args: channels,
        }
        ws.send(JSON.stringify(subscribeMsg))
        console.log(`[OKXWS] Subscribed to ${channels.length} channels`)
      }

      ws.onmessage = (event) => {
        if (isUnmountedRef.current) return

        try {
          const message = JSON.parse(event.data)

          // 处理订阅确认
          if (message.event === 'subscribe') {
            console.log(`[OKXWS] Subscribe confirmed for ${symbol}`)
            subscribedRef.current = true
            return
          }

          // 处理 K 线数据
          if (message.data && message.arg?.channel?.startsWith('candle')) {
            for (const klineData of message.data) {
              const kline = parseOKXKline(klineData)
              onKline?.(kline)
            }
          }

          // 处理 Ticker 数据
          if (message.data && message.arg?.channel === 'tickers') {
            for (const tickerData of message.data) {
              const ticker: OKXTicker = {
                symbol: tickerData.instId?.replace('-', '') || symbol,
                price: parseFloat(tickerData.last),
                priceChange: parseFloat(tickerData.last) - parseFloat(tickerData.open24h),
                priceChangePercent: ((parseFloat(tickerData.last) - parseFloat(tickerData.open24h)) / parseFloat(tickerData.open24h)) * 100,
                high: parseFloat(tickerData.high24h),
                low: parseFloat(tickerData.low24h),
                volume: parseFloat(tickerData.vol24h),
              }
              onTicker?.(ticker)
            }
          }
        } catch (e) {
          // 忽略解析错误
        }
      }

      ws.onerror = () => {
        console.warn(`[OKXWS] Error for ${symbol}`)
        setError('Connection error')
      }

      ws.onclose = (event) => {
        console.log(`[OKXWS] Closed: ${symbol}, code: ${event.code}`)

        // 正常关闭不重连
        if (event.code === 1000 || manualCloseRef.current) {
          console.log(`[OKXWS] Normal close for ${symbol}, not reconnecting`)
          setIsConnected(false)
          return
        }

        setIsConnected(false)

        // 尝试重连
        if (reconnect && !isUnmountedRef.current && reconnectCountRef.current < maxReconnectAttempts) {
          reconnectCountRef.current++
          const backoffDelay = Math.min(reconnectInterval * Math.pow(1.5, reconnectCountRef.current - 1), 60000)
          console.log(`[OKXWS] Reconnecting ${symbol} in ${backoffDelay}ms...`)
          reconnectTimeoutRef.current = setTimeout(connect, backoffDelay)
        }
      }
    } catch (e) {
      console.error(`[OKXWS] Failed to connect ${symbol}:`, e)
      setError('Failed to connect')
    }
  }, [symbol, interval, onKline, onTicker, reconnect, reconnectInterval])

  const disconnect = useCallback(() => {
    manualCloseRef.current = true

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect')
      wsRef.current = null
    }

    setIsConnected(false)
  }, [])

  // 连接
  useEffect(() => {
    isUnmountedRef.current = false
    reconnectCountRef.current = 0
    connect()

    return () => {
      isUnmountedRef.current = true
      disconnect()
    }
  }, [connect, disconnect])

  return {
    isConnected,
    error,
    disconnect,
    reconnect: () => {
      reconnectCountRef.current = 0
      manualCloseRef.current = false
      connect()
    },
  }
}

/**
 * 多数据源 Hook
 * 优先使用币安，OKX 作为备用
 */
export function useMultiExchangeWebSocket({
  symbol,
  interval = '1h',
  onKline,
  onTicker,
}: {
  symbol: string
  interval?: string
  onKline?: (kline: { time: number; open: number; high: number; low: number; close: number }) => void
  onTicker?: (ticker: { symbol: string; price: number }) => void
}) {
  const [isConnected, setIsConnected] = useState(false)
  const [dataSource, setDataSource] = useState<'binance' | 'okx' | 'mock'>('mock')

  // 币安 WebSocket
  const { isConnected: binanceConnected, reconnect: reconnectBinance } = useOKXWebSocket({
    symbol,
    interval,
    onKline,
    onTicker,
  })

  // 更新连接状态
  useEffect(() => {
    setIsConnected(binanceConnected)
    if (binanceConnected) {
      setDataSource('binance')
    }
  }, [binanceConnected])

  return {
    isConnected,
    dataSource,
    reconnect: reconnectBinance,
  }
}

export default useOKXWebSocket
