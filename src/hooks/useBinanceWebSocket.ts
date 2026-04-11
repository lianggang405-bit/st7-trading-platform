'use client'

import { useEffect, useRef, useCallback, useState } from 'react'

export interface BinanceKline {
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

export interface BinanceTicker {
  symbol: string
  price: number
  priceChange: number
  priceChangePercent: number
  high: number
  low: number
  volume: number
}

type MessageHandler = (data: BinanceKline | BinanceTicker) => void

// WebSocket URL
const BINANCE_WS_BASE = 'wss://stream.binance.com:9443/ws'

interface UseBinanceWebSocketOptions {
  symbol: string
  interval?: string
  onKline?: (kline: BinanceKline) => void
  onTicker?: (ticker: BinanceTicker) => void
  reconnect?: boolean
  reconnectInterval?: number
}

/**
 * 币安 WebSocket Hook
 * 用于获取实时 K 线和行情数据
 */
export function useBinanceWebSocket({
  symbol,
  interval = '1h',
  onKline,
  onTicker,
  reconnect = true,
  reconnectInterval = 10000, // 增加重连间隔到10秒
}: UseBinanceWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isUnmountedRef = useRef(false)
  const reconnectCountRef = useRef(0)
  const maxReconnectAttempts = 10 // 增加最大重试次数
  const manualCloseRef = useRef(false)

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

    const wsSymbol = symbol.toLowerCase()

    // 根据回调选择订阅流
    const streams: string[] = []

    if (onKline) {
      streams.push(`${wsSymbol}@kline_${interval}`)
    }
    if (onTicker) {
      streams.push(`${wsSymbol}@ticker`)
    }

    if (streams.length === 0) {
      // 如果没有回调，只订阅 ticker
      streams.push(`${wsSymbol}@ticker`)
    }

    const wsUrl = `${BINANCE_WS_BASE}/${streams.join('/')}`
    console.log(`[BinanceWS] Connecting to: ${wsUrl}`)

    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      // 设置 pong 处理（币安会自动发送 pong）
      ws.onpong = () => {
        // console.log(`[BinanceWS] Pong received for ${symbol}`)
      }

      ws.onopen = () => {
        if (isUnmountedRef.current) {
          ws.close()
          return
        }
        console.log(`[BinanceWS] Connected: ${symbol}`)
        setIsConnected(true)
        setError(null)
        reconnectCountRef.current = 0
        manualCloseRef.current = false
      }

      ws.onmessage = (event) => {
        if (isUnmountedRef.current) return

        try {
          const message = JSON.parse(event.data)

          // 处理 K 线数据
          if (message.stream && message.stream.includes('@kline')) {
            const klineData = message.data
            if (klineData.k) {
              const kline: BinanceKline = {
                symbol: klineData.s,
                interval: klineData.k.i,
                time: Math.floor(klineData.k.t / 1000),
                open: parseFloat(klineData.k.o),
                high: parseFloat(klineData.k.h),
                low: parseFloat(klineData.k.l),
                close: parseFloat(klineData.k.c),
                volume: parseFloat(klineData.k.v),
                isClosed: klineData.k.x,
              }
              onKline?.(kline)
            }
          }

          // 处理 Ticker 数据
          if (message.stream && message.stream.includes('@ticker')) {
            const tickerData = message.data
            const ticker: BinanceTicker = {
              symbol: tickerData.s,
              price: parseFloat(tickerData.c),
              priceChange: parseFloat(tickerData.p),
              priceChangePercent: parseFloat(tickerData.P),
              high: parseFloat(tickerData.h),
              low: parseFloat(tickerData.l),
              volume: parseFloat(tickerData.v),
            }
            onTicker?.(ticker)
          }
        } catch (e) {
          // 忽略解析错误
        }
      }

      ws.onerror = () => {
        console.warn(`[BinanceWS] Error for ${symbol}`)
        setError('Connection error')
      }

      ws.onclose = (event) => {
        console.log(`[BinanceWS] Closed: ${symbol}, code: ${event.code}, reason: ${event.reason}`)

        // 如果是正常关闭码，不重连
        if (event.code === 1000 || manualCloseRef.current) {
          setIsConnected(false)
          return
        }

        setIsConnected(false)

        // 尝试重连（指数退避）
        if (reconnect && !isUnmountedRef.current && reconnectCountRef.current < maxReconnectAttempts) {
          reconnectCountRef.current++
          const backoffDelay = Math.min(reconnectInterval * Math.pow(1.5, reconnectCountRef.current - 1), 60000)
          console.log(`[BinanceWS] Reconnecting ${symbol} in ${backoffDelay}ms (attempt ${reconnectCountRef.current})...`)
          reconnectTimeoutRef.current = setTimeout(connect, backoffDelay)
        }
      }
    } catch (e) {
      console.error(`[BinanceWS] Failed to connect ${symbol}:`, e)
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
 * 组合多个交易对的 WebSocket 连接
 */
export function useBinanceMultiWebSocket(
  symbols: string[],
  onTicker?: (ticker: BinanceTicker) => void
) {
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isUnmountedRef = useRef(false)

  const connect = useCallback(() => {
    if (isUnmountedRef.current || symbols.length === 0) return

    // 清理旧连接
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    // 构建组合流 URL
    const streams = symbols
      .map(s => `${s.toLowerCase()}@ticker`)
      .join('/')

    const wsUrl = `${BINANCE_WS_BASE}/${streams}`
    console.log(`[BinanceMultiWS] Connecting to ${symbols.length} symbols`)

    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        if (isUnmountedRef.current) {
          ws.close()
          return
        }
        console.log(`[BinanceMultiWS] Connected: ${symbols.length} symbols`)
        setIsConnected(true)
        setError(null)
      }

      ws.onmessage = (event) => {
        if (isUnmountedRef.current) return

        try {
          const message = JSON.parse(event.data)

          if (message.stream?.includes('@ticker') && message.data) {
            const tickerData = message.data
            const ticker: BinanceTicker = {
              symbol: tickerData.s,
              price: parseFloat(tickerData.c),
              priceChange: parseFloat(tickerData.p),
              priceChangePercent: parseFloat(tickerData.P),
              high: parseFloat(tickerData.h),
              low: parseFloat(tickerData.l),
              volume: parseFloat(tickerData.v),
            }
            onTicker?.(ticker)
          }
        } catch (e) {
          // 忽略解析错误
        }
      }

      ws.onerror = () => {
        setError('Connection error')
      }

      ws.onclose = () => {
        setIsConnected(false)

        // 自动重连
        if (!isUnmountedRef.current) {
          reconnectTimeoutRef.current = setTimeout(connect, 10000)
        }
      }
    } catch (e) {
      setError('Failed to connect')
    }
  }, [symbols.join(','), onTicker])

  // 连接
  useEffect(() => {
    isUnmountedRef.current = false
    connect()

    return () => {
      isUnmountedRef.current = true
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [connect])

  return {
    isConnected,
    error,
    reconnect: connect,
  }
}

export default useBinanceWebSocket
