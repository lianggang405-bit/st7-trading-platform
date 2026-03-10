/**
 * 余额实时推送服务
 * 
 * 使用 Server-Sent Events (SSE) 实时监听用户资产变动
 */

import { useAssetStore } from '@/stores/assetStore';

export interface BalanceUpdateData {
  balance: number;
  equity: number;
  usedMargin: number;
  freeMargin: number;
  floatingProfit: number;
  lockedBalance: number;
}

export interface SSEMessage {
  type: 'connected' | 'balance_update' | 'heartbeat';
  data?: BalanceUpdateData;
  userId?: string;
  timestamp: string;
}

export class BalanceStreamService {
  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;
  private listeners: Map<string, (data: any) => void> = new Map();

  /**
   * 连接到余额推送流
   */
  connect(token: string): void {
    // 如果已经连接，先关闭
    this.disconnect();

    try {
      this.eventSource = new EventSource(`/api/user/balance/stream`, {
        withCredentials: true,
      } as any);

      // 添加 Authorization header（EventSource 不支持自定义 header）
      // 需要在 URL 中传递 token
      const url = new URL('/api/user/balance/stream', window.location.origin);
      url.searchParams.set('token', token);

      // 重新创建 EventSource
      this.eventSource.close();
      this.eventSource = new EventSource(url.toString());

      this.eventSource.onmessage = (event) => {
        try {
          const message: SSEMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('[BalanceStreamService] Failed to parse message:', error);
        }
      };

      this.eventSource.onopen = () => {
        console.log('[BalanceStreamService] Connected');
        this.reconnectAttempts = 0;
        this.notify('connected', null);
      };

      this.eventSource.onerror = (error) => {
        console.error('[BalanceStreamService] Error:', error);
        this.notify('error', error);

        // 自动重连
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`[BalanceStreamService] Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

          setTimeout(() => {
            this.connect(token);
          }, this.reconnectDelay * this.reconnectAttempts);
        } else {
          console.error('[BalanceStreamService] Max reconnect attempts reached');
          this.disconnect();
        }
      };

    } catch (error) {
      console.error('[BalanceStreamService] Failed to connect:', error);
      this.notify('error', error);
    }
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      console.log('[BalanceStreamService] Disconnected');
    }
  }

  /**
   * 处理消息
   */
  private handleMessage(message: SSEMessage): void {
    switch (message.type) {
      case 'connected':
        console.log('[BalanceStreamService] Server connected, user ID:', message.userId);
        this.notify('connected', message);
        break;

      case 'balance_update':
        console.log('[BalanceStreamService] Balance updated:', message.data);
        this.notify('balance_update', message.data);

        // 自动更新 assetStore
        if (message.data) {
          useAssetStore.getState().updateBalance(message.data.balance);
          useAssetStore.getState().updateFloatingProfit(message.data.floatingProfit || 0);
        }
        break;

      case 'heartbeat':
        // 心跳消息，保持连接
        break;

      default:
        console.warn('[BalanceStreamService] Unknown message type:', message.type);
    }
  }

  /**
   * 添加监听器
   */
  on(event: string, callback: (data: any) => void): void {
    this.listeners.set(event, callback);
  }

  /**
   * 移除监听器
   */
  off(event: string): void {
    this.listeners.delete(event);
  }

  /**
   * 通知监听器
   */
  private notify(event: string, data: any): void {
    const callback = this.listeners.get(event);
    if (callback) {
      callback(data);
    }
  }

  /**
   * 检查连接状态
   */
  isConnected(): boolean {
    return this.eventSource !== null && this.eventSource.readyState === EventSource.OPEN;
  }
}

// 导出单例
export const balanceStreamService = new BalanceStreamService();

/**
 * React Hook: 使用余额实时推送
 */
export function useBalanceStream(token: string) {
  const { useEffect, useState } = require('react');
  const [isConnected, setIsConnected] = useState(false);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    // 连接到余额推送
    balanceStreamService.connect(token);

    // 监听连接状态
    balanceStreamService.on('connected', () => {
      setIsConnected(true);
    });

    // 监听余额更新
    balanceStreamService.on('balance_update', (data: BalanceUpdateData) => {
      setBalance(data.balance);
    });

    // 清理
    return () => {
      balanceStreamService.disconnect();
      balanceStreamService.off('connected');
      balanceStreamService.off('balance_update');
    };
  }, [token]);

  return {
    isConnected,
    balance,
  };
}
