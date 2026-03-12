/**
 * Binance WebSocket 服务模块
 *
 * 功能：
 * - WebSocket 连接管理
 * - Ping/Pong 心跳机制
 * - 订阅实时行情
 * - 断线重连
 * - 连接生命周期管理（24小时）
 *
 * 参考资料：
 * - 主网: wss://ws-api.binance.com:443/ws-api/v3
 * - 备用: wss://ws-api.binance.com:9443/ws-api/v3
 * - 测试网: wss://ws-api.testnet.binance.vision/ws-api/v3
 */

// WebSocket 连接状态
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

// WebSocket 配置
export interface BinanceWSConfig {
  endpoint?: 'main' | 'backup' | 'testnet';
  apiKey?: string;
  secretKey?: string;
  autoReconnect?: boolean;
  pingInterval?: number;
  pongTimeout?: number;
}

// 订阅类型
export type SubscriptionType = 'ticker' | 'depth' | 'trade' | 'kline';

// 订阅配置
export interface Subscription {
  type: SubscriptionType;
  symbols: string[];
  interval?: string; // for kline
}

// 市场数据
export interface MarketTicker {
  eventTime: number;
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  prevClosePrice: string;
  lastPrice: string;
  lastQty: string;
  bidPrice: string;
  bidQty: string;
  askPrice: string;
  askQty: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  firstId: number;
  lastId: number;
  count: number;
}

// K线数据
export interface Kline {
  eventTime: number;
  symbol: string;
  interval: string;
  startTime: number;
  closeTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  numberOfTrades: number;
  isKlineClosed: boolean;
  quoteVolume: string;
  takerBuyBaseVolume: string;
  takerBuyQuoteVolume: string;
}

// 消息处理器
type MessageHandler = (data: any) => void;
type ConnectionHandler = (state: ConnectionState) => void;
type ErrorHandler = (error: Error) => void;

class BinanceWebSocketService {
  private ws: WebSocket | null = null;
  private config: Required<BinanceWSConfig>;
  private connectionState: ConnectionState = 'disconnected';
  private connectionTime: number = 0;
  private subscriptions: Set<Subscription> = new Set();
  private messageHandlers: Map<string, MessageHandler[]> = new Map();
  private connectionHandlers: ConnectionHandler[] = [];
  private errorHandlers: ErrorHandler[] = [];

  // Ping/Pong 机制
  private pingInterval: NodeJS.Timeout | null = null;
  private pongTimeout: NodeJS.Timeout | null = null;
  private lastPingTime: number = 0;

  // 重连机制
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 5000;

  constructor(config: BinanceWSConfig = {}) {
    this.config = {
      endpoint: config.endpoint || 'main',
      apiKey: config.apiKey || '',
      secretKey: config.secretKey || '',
      autoReconnect: config.autoReconnect !== undefined ? config.autoReconnect : true,
      pingInterval: config.pingInterval || 20000, // 20秒（服务器发送频率）
      pongTimeout: config.pongTimeout || 60000, // 1分钟（必须响应）
    };
  }

  /**
   * 获取端点 URL
   */
  private getEndpointURL(): string {
    const endpoints = {
      main: 'wss://ws-api.binance.com:443/ws-api/v3',
      backup: 'wss://ws-api.binance.com:9443/ws-api/v3',
      testnet: 'wss://ws-api.testnet.binance.vision/ws-api/v3',
    };
    return endpoints[this.config.endpoint];
  }

  /**
   * 连接到 WebSocket
   */
  public connect(): void {
    if (this.ws) {
      console.warn('[BinanceWS] Already connected');
      return;
    }

    const url = this.getEndpointURL();
    console.log(`[BinanceWS] Connecting to ${url}`);

    this.connectionState = 'connecting';
    this.notifyConnectionHandlers();

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
    } catch (error) {
      console.error('[BinanceWS] Failed to create WebSocket:', error);
      this.handleError(error as Error);
    }
  }

  /**
   * 断开连接
   */
  public disconnect(): void {
    if (!this.ws) return;

    console.log('[BinanceWS] Disconnecting');
    this.stopPingInterval();

    this.ws.close();
    this.ws = null;
    this.connectionState = 'disconnected';
    this.notifyConnectionHandlers();
  }

  /**
   * 处理连接打开
   */
  private handleOpen(): void {
    console.log('[BinanceWS] Connected');
    this.connectionState = 'connected';
    this.connectionTime = Date.now();
    this.reconnectAttempts = 0;
    this.notifyConnectionHandlers();

    // 启动 Ping/Pong 机制
    this.startPingInterval();

    // 重新订阅之前的订阅
    this.resubscribe();
  }

  /**
   * 处理消息
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);

      // 处理 ping 消息
      if (data.ping !== undefined) {
        this.handlePing(data.ping);
        return;
      }

      // 处理 pong 消息
      if (data.pong !== undefined) {
        this.handlePong(data.pong);
        return;
      }

      // 处理 serverShutdown 事件
      if (data.eventType === 'serverShutdown') {
        console.warn('[BinanceWS] Server shutdown notification received');
        this.handleServerShutdown();
        return;
      }

      // 分发消息给处理器
      this.dispatchMessage(data);
    } catch (error) {
      console.error('[BinanceWS] Failed to parse message:', error);
    }
  }

  /**
   * 处理错误
   */
  private handleError(error: Error | Event): void {
    console.error('[BinanceWS] Error:', error);

    if (error instanceof Error) {
      this.notifyErrorHandlers(error);
    }
  }

  /**
   * 处理连接关闭
   */
  private handleClose(event: CloseEvent): void {
    console.log(`[BinanceWS] Connection closed: ${event.code} - ${event.reason}`);
    this.connectionState = 'disconnected';
    this.notifyConnectionHandlers();

    this.stopPingInterval();

    // 检查是否需要重连
    if (this.config.autoReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.scheduleReconnect();
    }
  }

  /**
   * 处理 ping 消息
   */
  private handlePing(pingTime: number): void {
    console.log('[BinanceWS] Ping received:', pingTime);
    this.lastPingTime = pingTime;

    // 立即响应 pong
    this.sendPong(pingTime);

    // 设置 pong 超时检查
    if (this.pongTimeout) {
      clearTimeout(this.pongTimeout);
    }

    this.pongTimeout = setTimeout(() => {
      console.error('[BinanceWS] Pong timeout - connection may be closed');
    }, this.config.pongTimeout);
  }

  /**
   * 发送 pong 消息
   */
  private sendPong(pingTime: number): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    try {
      this.ws.send(JSON.stringify({ pong: pingTime }));
      console.log('[BinanceWS] Pong sent:', pingTime);
    } catch (error) {
      console.error('[BinanceWS] Failed to send pong:', error);
    }
  }

  /**
   * 处理 pong 消息
   */
  private handlePong(pongTime: number): void {
    console.log('[BinanceWS] Pong received:', pongTime);
    if (this.pongTimeout) {
      clearTimeout(this.pongTimeout);
      this.pongTimeout = null;
    }
  }

  /**
   * 启动 Ping 间隔
   */
  private startPingInterval(): void {
    this.stopPingInterval();

    this.pingInterval = setInterval(() => {
      // 主动发送 ping（可选）
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        const pingTime = Date.now();
        this.ws.send(JSON.stringify({ ping: pingTime }));
      }
    }, this.config.pingInterval);
  }

  /**
   * 停止 Ping 间隔
   */
  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    if (this.pongTimeout) {
      clearTimeout(this.pongTimeout);
      this.pongTimeout = null;
    }
  }

  /**
   * 处理服务器关闭通知
   */
  private handleServerShutdown(): void {
    console.warn('[BinanceWS] Server will shutdown, reconnecting...');
    this.disconnect();

    // 立即重连
    setTimeout(() => {
      this.connect();
    }, 1000);
  }

  /**
   * 计划重连
   */
  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    this.connectionState = 'reconnecting';
    this.notifyConnectionHandlers();

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    console.log(`[BinanceWS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * 检查连接是否过期（24小时）
   */
  private checkConnectionExpiry(): boolean {
    if (!this.connectionTime) return false;

    const age = Date.now() - this.connectionTime;
    const maxAge = 24 * 60 * 60 * 1000; // 24小时

    return age >= maxAge;
  }

  /**
   * 订阅
   */
  public subscribe(subscription: Subscription): void {
    this.subscriptions.add(subscription);

    if (this.connectionState === 'connected') {
      this.sendSubscription(subscription);
    }
  }

  /**
   * 取消订阅
   */
  public unsubscribe(subscription: Subscription): void {
    this.subscriptions.delete(subscription);

    if (this.connectionState === 'connected') {
      this.sendUnsubscription(subscription);
    }
  }

  /**
   * 发送订阅请求
   */
  private sendSubscription(subscription: Subscription): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    try {
      const payload = this.buildSubscriptionPayload(subscription);
      this.ws.send(JSON.stringify(payload));
      console.log('[BinanceWS] Subscription sent:', payload);
    } catch (error) {
      console.error('[BinanceWS] Failed to send subscription:', error);
    }
  }

  /**
   * 发送取消订阅请求
   */
  private sendUnsubscription(subscription: Subscription): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    try {
      const payload = this.buildUnsubscriptionPayload(subscription);
      this.ws.send(JSON.stringify(payload));
      console.log('[BinanceWS] Unsubscription sent:', payload);
    } catch (error) {
      console.error('[BinanceWS] Failed to send unsubscription:', error);
    }
  }

  /**
   * 构建订阅载荷
   */
  private buildSubscriptionPayload(subscription: Subscription): any {
    const params = subscription.symbols.map(symbol => {
      switch (subscription.type) {
        case 'ticker':
          return `${symbol.toLowerCase()}@ticker`;
        case 'depth':
          return `${symbol.toLowerCase()}@depth@100ms`;
        case 'trade':
          return `${symbol.toLowerCase()}@trade`;
        case 'kline':
          return `${symbol.toLowerCase()}@kline_${subscription.interval || '1m'}`;
        default:
          return symbol;
      }
    });

    return {
      method: 'SUBSCRIBE',
      params,
      id: Date.now(),
    };
  }

  /**
   * 构建取消订阅载荷
   */
  private buildUnsubscriptionPayload(subscription: Subscription): any {
    const params = subscription.symbols.map(symbol => {
      switch (subscription.type) {
        case 'ticker':
          return `${symbol.toLowerCase()}@ticker`;
        case 'depth':
          return `${symbol.toLowerCase()}@depth`;
        case 'trade':
          return `${symbol.toLowerCase()}@trade`;
        case 'kline':
          return `${symbol.toLowerCase()}@kline_${subscription.interval || '1m'}`;
        default:
          return symbol;
      }
    });

    return {
      method: 'UNSUBSCRIBE',
      params,
      id: Date.now(),
    };
  }

  /**
   * 重新订阅
   */
  private resubscribe(): void {
    console.log('[BinanceWS] Resubscribing to all subscriptions');

    this.subscriptions.forEach(subscription => {
      this.sendSubscription(subscription);
    });
  }

  /**
   * 分发消息
   */
  private dispatchMessage(data: any): void {
    const handlers = this.messageHandlers.get(data.e || 'default');
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }

    // 调用默认处理器
    const defaultHandlers = this.messageHandlers.get('default');
    if (defaultHandlers) {
      defaultHandlers.forEach(handler => handler(data));
    }
  }

  /**
   * 添加消息处理器
   */
  public onMessage(eventType: string, handler: MessageHandler): void {
    if (!this.messageHandlers.has(eventType)) {
      this.messageHandlers.set(eventType, []);
    }
    this.messageHandlers.get(eventType)!.push(handler);
  }

  /**
   * 移除消息处理器
   */
  public offMessage(eventType: string, handler: MessageHandler): void {
    const handlers = this.messageHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * 添加连接状态处理器
   */
  public onConnection(handler: ConnectionHandler): void {
    this.connectionHandlers.push(handler);
  }

  /**
   * 移除连接状态处理器
   */
  public offConnection(handler: ConnectionHandler): void {
    const index = this.connectionHandlers.indexOf(handler);
    if (index !== -1) {
      this.connectionHandlers.splice(index, 1);
    }
  }

  /**
   * 添加错误处理器
   */
  public onError(handler: ErrorHandler): void {
    this.errorHandlers.push(handler);
  }

  /**
   * 移除错误处理器
   */
  public offError(handler: ErrorHandler): void {
    const index = this.errorHandlers.indexOf(handler);
    if (index !== -1) {
      this.errorHandlers.splice(index, 1);
    }
  }

  /**
   * 通知连接状态处理器
   */
  private notifyConnectionHandlers(): void {
    this.connectionHandlers.forEach(handler => handler(this.connectionState));
  }

  /**
   * 通知错误处理器
   */
  private notifyErrorHandlers(error: Error): void {
    this.errorHandlers.forEach(handler => handler(error));
  }

  /**
   * 获取连接状态
   */
  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * 检查是否已连接
   */
  public isConnected(): boolean {
    return this.connectionState === 'connected' && this.ws?.readyState === WebSocket.OPEN;
  }
}

// 导出单例实例
export const binanceWS = new BinanceWebSocketService();

// 导出类
export default BinanceWebSocketService;
