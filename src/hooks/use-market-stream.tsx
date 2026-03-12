/**
 * 实时行情 Hook
 *
 * 使用 SSE 从后端获取实时行情数据
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// 市场数据类型
export type MarketDataType = 'ticker' | 'kline' | 'depth' | 'trade';

// 行情数据
export interface MarketData {
  type: MarketDataType;
  symbol: string;
  data: any;
  timestamp: number;
}

// 连接状态
export type StreamConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

// Hook 配置
interface UseMarketStreamOptions {
  symbols: string[];
  type?: MarketDataType;
  interval?: string;
  autoReconnect?: boolean;
  reconnectDelay?: number;
}

// Hook 返回值
interface UseMarketStreamResult {
  data: MarketData[];
  connectionState: StreamConnectionState;
  error: Error | null;
  isConnected: boolean;
  disconnect: () => void;
  reconnect: () => void;
}

/**
 * 实时行情 Hook
 *
 * @param options 配置选项
 * @returns 行情数据和连接状态
 */
export function useMarketStream(options: UseMarketStreamOptions): UseMarketStreamResult {
  const {
    symbols,
    type = 'ticker',
    interval = '1m',
    autoReconnect = true,
    reconnectDelay = 5000,
  } = options;

  const [data, setData] = useState<MarketData[]>([]);
  const [connectionState, setConnectionState] = useState<StreamConnectionState>('connecting');
  const [error, setError] = useState<Error | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dataBufferRef = useRef<MarketData[]>([]);

  // 清理函数
  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // 连接到 SSE 流
  const connect = useCallback(() => {
    // 清理现有连接
    cleanup();

    setConnectionState('connecting');
    setError(null);

    // 构建 URL
    const params = new URLSearchParams({
      symbols: symbols.join(','),
      type,
      interval,
    });

    const url = `/api/market/stream?${params.toString()}`;

    // 创建 EventSource
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    // 监听消息
    eventSource.onmessage = (event) => {
      try {
        const messageData = JSON.parse(event.data);

        // 处理连接状态消息
        if (messageData.type === 'connection') {
          setConnectionState(messageData.state);
          return;
        }

        // 处理市场数据
        setData(prev => {
          const newData = [...prev, messageData];
          // 保留最近的 100 条数据
          return newData.slice(-100);
        });
      } catch (err) {
        console.error('[useMarketStream] Failed to parse message:', err);
        setError(err as Error);
      }
    };

    // 监听错误
    eventSource.onerror = (err) => {
      console.error('[useMarketStream] EventSource error:', err);
      setConnectionState('error');
      setError(new Error('Connection error'));

      // 自动重连
      if (autoReconnect) {
        setConnectionState('connecting');
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, reconnectDelay);
      } else {
        cleanup();
      }
    };
  }, [symbols, type, interval, autoReconnect, reconnectDelay, cleanup]);

  // 断开连接
  const disconnect = useCallback(() => {
    cleanup();
    setConnectionState('disconnected');
  }, [cleanup]);

  // 重新连接
  const reconnect = useCallback(() => {
    connect();
  }, [connect]);

  // 初始化连接
  useEffect(() => {
    connect();

    return () => {
      cleanup();
    };
  }, [connect, cleanup]);

  // 获取连接状态
  const isConnected = connectionState === 'connected';

  return {
    data,
    connectionState,
    error,
    isConnected,
    disconnect,
    reconnect,
  };
}

// ==================== 使用示例 ====================

// 示例 1: 显示实时行情
function Example1_TickerDisplay() {
  const { data, connectionState, isConnected } = useMarketStream({
    symbols: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'],
    type: 'ticker',
  });

  // 获取最新行情
  const latestTickers = data.filter(d => d.type === 'ticker');

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">实时行情</h1>
      
      <div className="mb-4">
        <span className={`px-3 py-1 rounded-full text-sm ${
          isConnected ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {connectionState}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {latestTickers.map((ticker) => (
          <div key={ticker.symbol} className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold">{ticker.symbol}</h3>
            <p className="text-2xl font-bold">${ticker.data.lastPrice}</p>
            <p className={`text-sm ${
              parseFloat(ticker.data.priceChangePercent) >= 0 
                ? 'text-green-600' 
                : 'text-red-600'
            }`}>
              {ticker.data.priceChangePercent}%
            </p>
            <p className="text-xs text-gray-500">
              Vol: {parseFloat(ticker.data.volume).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// 示例 2: 显示 K 线数据
function Example2_KlineDisplay() {
  const { data, isConnected } = useMarketStream({
    symbols: ['BTCUSDT'],
    type: 'kline',
    interval: '1m',
  });

  const latestKlines = data.filter(d => d.type === 'kline');

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">K 线数据</h1>
      
      <div className="mb-4">
        <span className={`px-3 py-1 rounded-full text-sm ${
          isConnected ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {isConnected ? '已连接' : '未连接'}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-4 py-2">时间</th>
              <th className="border px-4 py-2">开盘</th>
              <th className="border px-4 py-2">最高</th>
              <th className="border px-4 py-2">最低</th>
              <th className="border px-4 py-2">收盘</th>
              <th className="border px-4 py-2">成交量</th>
            </tr>
          </thead>
          <tbody>
            {latestKlines.slice(-10).reverse().map((kline, index) => (
              <tr key={index}>
                <td className="border px-4 py-2">
                  {new Date(kline.data.startTime).toLocaleTimeString()}
                </td>
                <td className="border px-4 py-2">{kline.data.open}</td>
                <td className="border px-4 py-2">{kline.data.high}</td>
                <td className="border px-4 py-2">{kline.data.low}</td>
                <td className="border px-4 py-2">{kline.data.close}</td>
                <td className="border px-4 py-2">{kline.data.volume}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 示例 3: 多个交易对同时监控
function Example3_MultipleSymbols() {
  const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'ADAUSDT'];
  const { data, connectionState, isConnected } = useMarketStream({
    symbols,
    type: 'ticker',
  });

  // 按交易对分组
  const tickerMap = data
    .filter(d => d.type === 'ticker')
    .reduce((acc, ticker) => {
      acc[ticker.symbol] = ticker;
      return acc;
    }, {} as Record<string, MarketData>);

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">多交易对监控</h1>
        <span className={`px-3 py-1 rounded-full text-sm ${
          isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {connectionState}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {symbols.map((symbol) => {
          const ticker = tickerMap[symbol];
          if (!ticker) return null;

          const change = parseFloat(ticker.data.priceChangePercent);
          
          return (
            <div key={symbol} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">{symbol}</h3>
                <span className={`text-sm px-2 py-1 rounded ${
                  change >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                </span>
              </div>
              <p className="text-3xl font-bold mb-2">${ticker.data.lastPrice}</p>
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>24h High:</span>
                  <span>{ticker.data.highPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span>24h Low:</span>
                  <span>{ticker.data.lowPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span>Volume:</span>
                  <span>{parseFloat(ticker.data.volume).toLocaleString()}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 示例 4: 带控制按钮的监控
function Example4_WithControls() {
  const { data, connectionState, isConnected, disconnect, reconnect } = useMarketStream({
    symbols: ['BTCUSDT'],
    type: 'ticker',
  });

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">实时行情控制</h1>
        <div className="space-x-2">
          <button
            onClick={isConnected ? disconnect : reconnect}
            className={`px-4 py-2 rounded ${
              isConnected 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {isConnected ? '断开连接' : '重新连接'}
          </button>
        </div>
      </div>

      <div className="mb-4 p-4 bg-gray-50 rounded">
        <p><strong>连接状态:</strong> {connectionState}</p>
        <p><strong>数据点数:</strong> {data.length}</p>
      </div>

      {data.length > 0 && (
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">最新数据</h3>
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
            {JSON.stringify(data[data.length - 1], null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export {
  Example1_TickerDisplay,
  Example2_KlineDisplay,
  Example3_MultipleSymbols,
  Example4_WithControls,
};
