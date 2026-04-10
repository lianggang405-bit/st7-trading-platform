/**
 * TradingView UDF 数据源适配器
 * 支持实时数据更新
 */

import { IChartApi, ISeriesApi, CandlestickData, Time, HistogramData, LineData } from 'lightweight-charts'

// Binance WebSocket 基础 URL
const BINANCE_WS_URL = 'wss://stream.binance.com:9443/ws'

// 交易对映射 - 将通用符号映射到 Binance 交易对
const SYMBOL_MAP: Record<string, string> = {
  'BTC/USDT': 'btcusdt',
  'ETH/USDT': 'ethusdt',
  'BNB/USDT': 'bnbusdt',
  'SOL/USDT': 'solusdt',
  'XRP/USDT': 'xrpusdt',
  'ADA/USDT': 'adausdt',
  'DOGE/USDT': 'dogeusdt',
  'DOT/USDT': 'dotusdt',
  'MATIC/USDT': 'maticusdt',
  'LTC/USDT': 'ltcusdt',
  'AVAX/USDT': 'avaxusdt',
  'LINK/USDT': 'linkusdt',
  'UNI/USDT': 'uniusdt',
  'ATOM/USDT': 'atomusdt',
  'XLM/USDT': 'xlmusdt',
}

interface BarData {
  time: Time
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

interface RealTimeBarCallback {
  (bar: BarData): void
}

class TradingViewDataFeed {
  private ws: WebSocket | null = null
  private currentSymbol: string = ''
  private currentResolution: string = '1h'
  private onBarCallback: RealTimeBarCallback | null = null
  private lastBar: BarData | null = null
  private reconnectAttempts: number = 0
  private maxReconnectAttempts: number = 5

  // UDF 必需的方法
  onReady(callback: (configuration: object) => void): void {
    const configuration = {
      supports_search: false,
      supports_group_request: false,
      supported_resolutions: ['1', '5', '15', '30', '60', '240', '1D', '1W'],
      supports_marks: false,
      supports_timescale_marks: false,
      supports_time: true,
    }
    setTimeout(() => callback(configuration), 0)
  }

  resolveSymbol(
    symbolName: string,
    onResolve: (symbolInfo: object) => void,
    onError: (error: string) => void
  ): void {
    const binanceSymbol = SYMBOL_MAP[symbolName] || symbolName.toLowerCase().replace('/', '')
    
    const symbolInfo = {
      name: symbolName,
      ticker: symbolName,
      description: symbolName,
      type: 'crypto',
      session: '24x7',
      exchange: 'Binance',
      listed_exchange: 'Binance',
      timezone: 'Etc/UTC',
      minmov: 1,
      pricescale: 100000000, // 8 decimal places
      has_intraday: true,
      has_daily: true,
      has_weekly_and_monthly: true,
      currency_code: 'USDT',
    }

    setTimeout(() => onResolve(symbolInfo), 0)
  }

  async getBars(
    symbolInfo: { name: string },
    resolution: string,
    from: number,
    to: number,
    onHistoryCallback: (bars: BarData[], meta: object) => void,
    onErrorCallback: (error: string) => void
  ): Promise<void> {
    try {
      const binanceSymbol = SYMBOL_MAP[symbolInfo.name] || symbolInfo.name.toLowerCase().replace('/', '')
      const interval = this.resolutionToInterval(resolution)
      
      // 从 Binance API 获取历史 K 线数据
      const response = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol.toUpperCase()}&interval=${interval}&limit=500`
      )
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      
      const bars: BarData[] = data.map((k: any[]) => ({
        time: Math.floor(k[0] / 1000) as Time,
        open: parseFloat(k[1]),
        high: parseFloat(k[2]),
        low: parseFloat(k[3]),
        close: parseFloat(k[4]),
        volume: parseFloat(k[5]),
      }))

      onHistoryCallback(bars, { noData: bars.length === 0 })
      
    } catch (error) {
      console.error('[DataFeed] getBars error:', error)
      onErrorCallback('Failed to load historical data')
    }
  }

  subscribeBars(
    symbolInfo: { name: string },
    resolution: string,
    onRealtimeCallback: RealTimeBarCallback,
    subscriberUID: string
  ): void {
    this.currentSymbol = symbolInfo.name
    this.currentResolution = resolution
    this.onBarCallback = onRealtimeCallback
    
    this.connectWebSocket()
  }

  unsubscribeBars(subscriberUID: string): void {
    this.disconnectWebSocket()
  }

  private resolutionToInterval(resolution: string): string {
    const map: Record<string, string> = {
      '1': '1m',
      '5': '5m',
      '15': '15m',
      '30': '30m',
      '60': '1h',
      '240': '4h',
      '1D': '1d',
      '1W': '1w',
    }
    return map[resolution] || '1h'
  }

  private connectWebSocket(): void {
    if (this.ws) {
      this.disconnectWebSocket()
    }

    const binanceSymbol = SYMBOL_MAP[this.currentSymbol] || this.currentSymbol.toLowerCase().replace('/', '')
    const interval = this.resolutionToInterval(this.currentResolution)
    const wsPath = `${binanceSymbol}@kline_${interval}`
    
    this.ws = new WebSocket(`${BINANCE_WS_URL}/${wsPath}`)

    this.ws.onopen = () => {
      console.log('[DataFeed] WebSocket connected')
      this.reconnectAttempts = 0
    }

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        if (data.e === 'kline') {
          const kline = data.k
          const bar: BarData = {
            time: Math.floor(kline.t / 1000) as Time,
            open: parseFloat(kline.o),
            high: parseFloat(kline.h),
            low: parseFloat(kline.l),
            close: parseFloat(kline.c),
            volume: parseFloat(kline.v),
          }
          
          this.lastBar = bar
          
          if (this.onBarCallback) {
            this.onBarCallback(bar)
          }
        }
      } catch (error) {
        console.error('[DataFeed] Parse error:', error)
      }
    }

    this.ws.onerror = (error) => {
      console.error('[DataFeed] WebSocket error:', error)
    }

    this.ws.onclose = () => {
      console.log('[DataFeed] WebSocket closed')
      this.attemptReconnect()
    }
  }

  private disconnectWebSocket(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`[DataFeed] Reconnecting... attempt ${this.reconnectAttempts}`)
      
      setTimeout(() => {
        if (this.onBarCallback) {
          this.connectWebSocket()
        }
      }, 2000 * this.reconnectAttempts)
    }
  }
}

export default TradingViewDataFeed
