/**
 * K线实时推送客户端 (SSE)
 * 支持自动重连、心跳检测、订阅管理
 */

export interface KlineUpdate {
  symbol: string;
  interval: string;
  kline: {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  };
  timestamp: number;
}

export interface PriceUpdate {
  symbol: string;
  price: number;
  change: number;
  timestamp: number;
}

export interface StreamEventHandlers {
  onConnected?: (data: { clientId: string; symbols: string[]; intervals: string[] }) => void;
  onKline?: (update: KlineUpdate) => void;
  onPrice?: (update: PriceUpdate) => void;
  onDisconnected?: () => void;
  onError?: (error: Error) => void;
  onHeartbeat?: () => void;
}

export class KlineStreamClient {
  private eventSource: EventSource | null = null;
  private clientId: string | null = null;
  private symbols: Set<string> = new Set();
  private intervals: Set<string> = new Set();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000; // 初始重连延迟1秒
  private maxReconnectDelay: number = 30000; // 最大重连延迟30秒
  private heartbeatTimeout: NodeJS.Timeout | null = null;
  protected handlers: StreamEventHandlers = {};
  private isConnected: boolean = false;

  constructor(handlers: StreamEventHandlers = {}) {
    this.handlers = handlers;
  }

  /**
   * 连接到服务器
   */
  connect(symbols: string[], intervals: string[] = ['1M']) {
    if (this.eventSource) {
      console.warn('[KlineStreamClient] 已经连接，先断开现有连接');
      this.disconnect();
    }

    this.symbols = new Set(symbols);
    this.intervals = new Set(intervals);

    const symbolsStr = symbols.join(',');
    const intervalsStr = intervals.join(',');

    const url = `/api/klines/stream?symbols=${encodeURIComponent(symbolsStr)}&intervals=${encodeURIComponent(intervalsStr)}`;

    console.log(`[KlineStreamClient] 连接中: ${url}`);

    try {
      this.eventSource = new EventSource(url);

      // 监听初始化事件
      this.eventSource.addEventListener('init', (event) => {
        try {
          const data = JSON.parse(event.data);
          this.clientId = data.clientId;
          this.isConnected = true;
          this.reconnectAttempts = 0; // 重置重连计数
          console.log('[KlineStreamClient] 连接成功:', data);
          this.handlers.onConnected?.(data);
        } catch (error) {
          console.error('[KlineStreamClient] 解析init事件失败:', error);
        }
      });

      // 监听K线更新事件
      this.eventSource.addEventListener('kline', (event) => {
        try {
          const update: KlineUpdate = JSON.parse(event.data);
          this.handlers.onKline?.(update);
        } catch (error) {
          console.error('[KlineStreamClient] 解析kline事件失败:', error);
        }
      });

      // 监听价格更新事件
      this.eventSource.addEventListener('price', (event) => {
        try {
          const update: PriceUpdate = JSON.parse(event.data);
          this.handlers.onPrice?.(update);
        } catch (error) {
          console.error('[KlineStreamClient] 解析price事件失败:', error);
        }
      });

      // 监听心跳事件
      this.eventSource.addEventListener('heartbeat', (event) => {
        try {
          this.resetHeartbeat();
          this.handlers.onHeartbeat?.();
        } catch (error) {
          console.error('[KlineStreamClient] 解析heartbeat事件失败:', error);
        }
      });

      // 监听错误
      this.eventSource.onerror = (error) => {
        console.error('[KlineStreamClient] 连接错误:', error);
        this.isConnected = false;
        this.handlers.onError?.(new Error('Connection error'));

        // 如果连接断开，尝试重连
        if (this.eventSource?.readyState === EventSource.CLOSED) {
          this.attemptReconnect();
        }
      };

      // 开始心跳检测
      this.startHeartbeat();
    } catch (error) {
      console.error('[KlineStreamClient] 连接失败:', error);
      this.handlers.onError?.(error as Error);
      this.attemptReconnect();
    }
  }

  /**
   * 断开连接
   */
  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.stopHeartbeat();
    this.isConnected = false;
    this.clientId = null;

    console.log('[KlineStreamClient] 已断开连接');
    this.handlers.onDisconnected?.();
  }

  /**
   * 更新订阅
   */
  updateSubscription(symbols: string[], intervals: string[] = ['1M']) {
    const newSymbols = new Set(symbols);
    const newIntervals = new Set(intervals);

    if (this.symbols.size === newSymbols.size &&
        this.intervals.size === newIntervals.size &&
        symbols.every(s => this.symbols.has(s)) &&
        intervals.every(i => this.intervals.has(i))) {
      // 订阅没有变化，不需要重新连接
      return;
    }

    this.symbols = newSymbols;
    this.intervals = newIntervals;

    // 重新连接
    this.connect(symbols, intervals);
  }

  /**
   * 添加订阅交易对
   */
  addSymbol(symbol: string) {
    if (this.symbols.has(symbol)) {
      return;
    }

    this.symbols.add(symbol);
    this.updateSubscription(Array.from(this.symbols), Array.from(this.intervals));
  }

  /**
   * 移除订阅交易对
   */
  removeSymbol(symbol: string) {
    if (!this.symbols.has(symbol)) {
      return;
    }

    this.symbols.delete(symbol);

    if (this.symbols.size === 0) {
      this.disconnect();
    } else {
      this.updateSubscription(Array.from(this.symbols), Array.from(this.intervals));
    }
  }

  /**
   * 尝试重连
   */
  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[KlineStreamClient] 达到最大重连次数，停止重连');
      this.disconnect();
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), this.maxReconnectDelay);

    console.log(`[KlineStreamClient] 第 ${this.reconnectAttempts} 次重连尝试，${delay}ms 后重连`);

    setTimeout(() => {
      this.connect(Array.from(this.symbols), Array.from(this.intervals));
    }, delay);
  }

  /**
   * 开始心跳检测
   */
  private startHeartbeat() {
    this.stopHeartbeat();

    this.heartbeatTimeout = setInterval(() => {
      if (!this.isConnected) {
        console.warn('[KlineStreamClient] 心跳超时，尝试重连');
        this.disconnect();
        this.attemptReconnect();
      }
    }, 60000); // 60秒超时
  }

  /**
   * 重置心跳
   */
  private resetHeartbeat() {
    if (this.heartbeatTimeout) {
      clearInterval(this.heartbeatTimeout);
    }

    this.startHeartbeat();
  }

  /**
   * 停止心跳
   */
  private stopHeartbeat() {
    if (this.heartbeatTimeout) {
      clearInterval(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }

  /**
   * 检查是否已连接
   */
  isReady(): boolean {
    return this.isConnected && this.eventSource?.readyState === EventSource.OPEN;
  }

  /**
   * 获取当前订阅的交易对
   */
  getSubscribedSymbols(): string[] {
    return Array.from(this.symbols);
  }

  /**
   * 获取当前订阅的时间周期
   */
  getSubscribedIntervals(): string[] {
    return Array.from(this.intervals);
  }

  /**
   * 更新事件处理器
   */
  updateHandlers(handlers: StreamEventHandlers) {
    Object.assign(this.handlers, handlers);
  }
}

/**
 * 创建全局单例（可选）
 */
let globalStreamClient: KlineStreamClient | null = null;

export function getGlobalStreamClient(handlers?: StreamEventHandlers): KlineStreamClient {
  if (!globalStreamClient) {
    globalStreamClient = new KlineStreamClient(handlers);
  } else if (handlers) {
    // 更新处理器
    globalStreamClient.updateHandlers(handlers);
  }

  return globalStreamClient;
}
