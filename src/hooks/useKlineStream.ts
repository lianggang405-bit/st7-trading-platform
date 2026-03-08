/**
 * React Hook for K线实时推送
 */

'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { KlineStreamClient, KlineUpdate, PriceUpdate, StreamEventHandlers } from '@/lib/kline-stream-client';

interface UseKlineStreamOptions {
  symbols: string[];
  intervals?: string[];
  enabled?: boolean;
}

interface UseKlineStreamResult {
  connected: boolean;
  connecting: boolean;
  latestKlines: Map<string, KlineUpdate>;
  latestPrices: Map<string, PriceUpdate>;
  connect: () => void;
  disconnect: () => void;
  error: Error | null;
}

export function useKlineStream(options: UseKlineStreamOptions): UseKlineStreamResult {
  const { symbols, intervals = ['1M'], enabled = true } = options;

  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [latestKlines, setLatestKlines] = useState<Map<string, KlineUpdate>>(new Map());
  const [latestPrices, setLatestPrices] = useState<Map<string, PriceUpdate>>(new Map());

  const clientRef = useRef<KlineStreamClient | null>(null);
  const enabledRef = useRef(enabled);

  // 更新 enabled 引用
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  // 创建客户端
  const createClient = useCallback(() => {
    const handlers: StreamEventHandlers = {
      onConnected: (data) => {
        setConnected(true);
        setConnecting(false);
        setError(null);
        console.log('[useKlineStream] 连接成功:', data);
      },
      onKline: (update) => {
        setLatestKlines(prev => {
          const newMap = new Map(prev);
          const key = `${update.symbol}_${update.interval}`;
          newMap.set(key, update);
          return newMap;
        });
      },
      onPrice: (update) => {
        setLatestPrices(prev => {
          const newMap = new Map(prev);
          newMap.set(update.symbol, update);
          return newMap;
        });
      },
      onDisconnected: () => {
        setConnected(false);
        setConnecting(false);
        console.log('[useKlineStream] 连接断开');
      },
      onError: (err) => {
        setError(err);
        setConnecting(false);
        console.error('[useKlineStream] 连接错误:', err);
      },
      onHeartbeat: () => {
        // 心跳响应，更新最后心跳时间
      },
    };

    return new KlineStreamClient(handlers);
  }, []);

  // 连接
  const connect = useCallback(() => {
    if (!enabledRef.current || symbols.length === 0) {
      return;
    }

    setConnecting(true);

    if (!clientRef.current) {
      clientRef.current = createClient();
    }

    clientRef.current.connect(symbols, intervals);
  }, [symbols, intervals, createClient]);

  // 断开连接
  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.disconnect();
    }
  }, []);

  // 初始化连接
  useEffect(() => {
    if (enabled && symbols.length > 0) {
      connect();
    } else {
      disconnect();
    }

    // 清理函数
    return () => {
      disconnect();
    };
  }, [enabled, symbols.length, connect, disconnect]);

  // 更新订阅
  useEffect(() => {
    if (connected && clientRef.current) {
      clientRef.current.updateSubscription(symbols, intervals);
    }
  }, [symbols, intervals, connected]);

  return {
    connected,
    connecting,
    latestKlines,
    latestPrices,
    connect,
    disconnect,
    error,
  };
}
