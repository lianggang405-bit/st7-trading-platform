/**
 * useMarketStream Hook
 *
 * 功能：
 * - 建立实时行情流连接（SSE）
 * - 接收实时价格更新
 * - 自动重连机制
 * - 清理连接
 *
 * 使用方式：
 * ```javascript
 * const { isConnected, lastUpdate } = useMarketStream({
 *   onMessage: (data) => {
 *     console.log('收到价格更新:', data);
 *   },
 * });
 * ```
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import type { TradingSymbol } from '../stores/marketStore';

export interface MarketStreamData {
  type: 'price_update' | 'error';
  timestamp: number;
  symbols?: TradingSymbol[];
  message?: string;
}

export interface UseMarketStreamOptions {
  onMessage?: (data: MarketStreamData) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
  enabled?: boolean;
}

export interface UseMarketStreamReturn {
  isConnected: boolean;
  lastUpdate: number | null;
  connect: () => void;
  disconnect: () => void;
}

export function useMarketStream({
  onMessage,
  onConnect,
  onDisconnect,
  onError,
  enabled = true,
}: UseMarketStreamOptions = {}): UseMarketStreamReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 5;
  const retryDelay = 3000; // 3秒

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

    setIsConnected(false);
    retryCountRef.current = 0;

    onDisconnect?.();
  }, [onDisconnect]);

  // 连接函数
  const connect = useCallback(() => {
    if (!enabled) {
      console.log('[Market Stream] Stream disabled');
      return;
    }

    // 清理现有连接
    cleanup();

    console.log(`[Market Stream] Connecting... (attempt ${retryCountRef.current + 1}/${maxRetries})`);

    try {
      const eventSource = new EventSource('/api/market/stream');
      eventSourceRef.current = eventSource;

      // 连接成功
      eventSource.onopen = () => {
        console.log('[Market Stream] Connected');
        setIsConnected(true);
        retryCountRef.current = 0; // 重置重试计数
        onConnect?.();
      };

      // 接收消息
      eventSource.onmessage = (event) => {
        try {
          const data: MarketStreamData = JSON.parse(event.data);

          console.log('[Market Stream] Received:', data.type);

          setLastUpdate(data.timestamp);
          onMessage?.(data);
        } catch (error) {
          console.error('[Market Stream] Error parsing message:', error);
          onError?.(error as Error);
        }
      };

      // 错误处理
      eventSource.onerror = (error) => {
        console.error('[Market Stream] Connection error:', error);

        setIsConnected(false);

        // 重连逻辑
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          const delay = retryDelay * retryCountRef.current;

          console.log(`[Market Stream] Reconnecting in ${delay}ms...`);

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          console.error('[Market Stream] Max retries reached, giving up');
          onError?.(new Error('Max retries reached'));
          cleanup();
        }
      };
    } catch (error) {
      console.error('[Market Stream] Failed to create EventSource:', error);
      onError?.(error as Error);
    }
  }, [enabled, cleanup, onConnect, onMessage, onError]);

  // 断开连接
  const disconnect = useCallback(() => {
    console.log('[Market Stream] Disconnecting...');
    cleanup();
  }, [cleanup]);

  // 组件挂载时连接
  useEffect(() => {
    if (enabled) {
      connect();
    }

    // 组件卸载时清理
    return () => {
      cleanup();
    };
  }, [enabled, connect, cleanup]);

  return {
    isConnected,
    lastUpdate,
    connect,
    disconnect,
  };
}
