import WebSocket from 'ws';
import axios from 'axios';
import { orderBookEngine, OrderBook } from '../engine/orderbook-engine';

/**
 * Binance Depth 消息格式（增量更新）
 */
interface BinanceDepthUpdateMessage {
  e: string;          // 事件类型
  E: number;          // 事件时间
  s: string;          // 交易对
  U: number;          // 第一个更新ID
  u: number;          // 最后一个更新ID
  b: [string, string][];  // 买盘增量 [[price, quantity], ...]
  a: [string, string][];  // 卖盘增量 [[price, quantity], ...]
}

/**
 * Binance Depth 快照格式
 */
interface BinanceDepthSnapshot {
  lastUpdateId: number;
  bids: [string, string][];
  asks: [string, string][];
}

/**
 * Binance Depth Stream Collector
 * 从 Binance WebSocket 接收实时深度数据
 */
export class BinanceDepthCollector {
  private ws: WebSocket | null = null;
  private symbols: string[];
  private reconnectInterval: NodeJS.Timeout | null = null;
  private reconnectDelay: number = 1000;
  private maxReconnectDelay: number = 30000;
  private isConnected: boolean = false;
  private speed: '100ms' | '1000ms';

  constructor(
    symbols: string[] = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'],
    speed: '100ms' | '1000ms' = '1000ms'
  ) {
    this.symbols = symbols.map(s => s.toLowerCase());
    this.speed = speed;
  }

  /**
   * 启动采集器
   */
  public async start(): Promise<void> {
    console.log('[BinanceDepthCollector] Starting...');
    await this.connect();
  }

  /**
   * 停止采集器
   */
  public stop(): void {
    console.log('[BinanceDepthCollector] Stopping...');

    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
      this.reconnectInterval = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.isConnected = false;
  }

  /**
   * 连接 Binance WebSocket
   */
  private async connect(): Promise<void> {
    try {
      // 步骤1：获取初始快照
      await this.fetchInitialSnapshots();

      // 步骤2：连接 WebSocket
      const streams = this.symbols.map(s => `${s}@depth@${this.speed}`).join('/');
      const url = `wss://stream.binance.com:9443/ws/${streams}`;

      console.log(`[BinanceDepthCollector] Connecting to ${url}...`);

      this.ws = new WebSocket(url);

      this.ws.on('open', () => {
        console.log('[BinanceDepthCollector] ✅ Connected to Binance WebSocket');
        this.isConnected = true;
        this.reconnectDelay = 1000;
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        this.handleMessage(data);
      });

      this.ws.on('error', (error: Error) => {
        console.error('[BinanceDepthCollector] ❌ WebSocket error:', error.message);
      });

      this.ws.on('close', (code: number, reason: Buffer) => {
        console.log(`[BinanceDepthCollector] ⚠️  WebSocket closed: ${code} - ${reason.toString()}`);
        this.isConnected = false;
        this.scheduleReconnect();
      });

      this.ws.on('ping', () => {
        this.ws?.pong();
      });

    } catch (error) {
      console.error('[BinanceDepthCollector] Error connecting:', error);
      this.scheduleReconnect();
    }
  }

  /**
   * 获取初始快照
   */
  private async fetchInitialSnapshots(): Promise<void> {
    console.log('[BinanceDepthCollector] Fetching initial snapshots...');

    for (const symbol of this.symbols) {
      try {
        const response = await axios.get<BinanceDepthSnapshot>(
          `https://api.binance.com/api/v3/depth?symbol=${symbol.toUpperCase()}&limit=1000`
        );

        const snapshot = response.data;
        const upperSymbol = symbol.toUpperCase();

        // 转换为数值数组
        const bids = snapshot.bids.map(([price, quantity]) => [parseFloat(price), parseFloat(quantity)] as [number, number]);
        const asks = snapshot.asks.map(([price, quantity]) => [parseFloat(price), parseFloat(quantity)] as [number, number]);

        // 更新 OrderBook
        orderBookEngine.updateOrderBook(upperSymbol, bids, asks, snapshot.lastUpdateId);

        console.log(
          `[BinanceDepthCollector] ✅ Loaded snapshot for ${upperSymbol}: ` +
          `${snapshot.bids.length} bids, ${snapshot.asks.length} asks`
        );

      } catch (error) {
        console.error(`[BinanceDepthCollector] Failed to fetch snapshot for ${symbol}:`, error);
      }
    }
  }

  /**
   * 处理接收到的消息
   */
  private handleMessage(data: WebSocket.Data): void {
    try {
      const message = JSON.parse(data.toString()) as BinanceDepthUpdateMessage;

      // 只处理 depthUpdate 消息
      if (message.e !== 'depthUpdate') {
        return;
      }

      // 提取数据
      const symbol = message.s.toUpperCase();

      // 转换为数值数组
      const bids = message.b.map(([price, quantity]) => [parseFloat(price), parseFloat(quantity)] as [number, number]);
      const asks = message.a.map(([price, quantity]) => [parseFloat(price), parseFloat(quantity)] as [number, number]);

      // 增量更新 OrderBook
      const success = orderBookEngine.updateOrderBookIncremental(
        symbol,
        bids,
        asks,
        message.U,
        message.u
      );

      if (!success) {
        console.warn(`[BinanceDepthCollector] ⚠️  Failed to update ${symbol}, will trigger resync`);
        // TODO: 触发全量同步
      }

    } catch (error) {
      console.error('[BinanceDepthCollector] Error handling message:', error);
    }
  }

  /**
   * 调度重连
   */
  private scheduleReconnect(): void {
    console.log(
      `[BinanceDepthCollector] 🔄 Reconnecting in ${this.reconnectDelay / 1000} seconds...`
    );

    this.reconnectInterval = setTimeout(() => {
      this.reconnectDelay = Math.min(
        this.reconnectDelay * 2,
        this.maxReconnectDelay
      );
      this.connect();
    }, this.reconnectDelay);
  }

  /**
   * 获取连接状态
   */
  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * 添加订阅
   */
  public async addSymbol(symbol: string): Promise<void> {
    const lowerSymbol = symbol.toLowerCase();
    if (!this.symbols.includes(lowerSymbol)) {
      this.symbols.push(lowerSymbol);
      console.log(`[BinanceDepthCollector] Added symbol: ${symbol}`);

      // 获取新交易对的快照
      try {
        const response = await axios.get<BinanceDepthSnapshot>(
          `https://api.binance.com/api/v3/depth?symbol=${symbol.toUpperCase()}&limit=1000`
        );

        const snapshot = response.data;
        const upperSymbol = symbol.toUpperCase();

        const bids = snapshot.bids.map(([price, quantity]) => [parseFloat(price), parseFloat(quantity)] as [number, number]);
        const asks = snapshot.asks.map(([price, quantity]) => [parseFloat(price), parseFloat(quantity)] as [number, number]);

        orderBookEngine.updateOrderBook(upperSymbol, bids, asks, snapshot.lastUpdateId);

        console.log(
          `[BinanceDepthCollector] ✅ Loaded snapshot for ${upperSymbol}`
        );

      } catch (error) {
        console.error(`[BinanceDepthCollector] Failed to fetch snapshot for ${symbol}:`, error);
      }

      // 如果已连接，重新连接以订阅新交易对
      if (this.isConnected) {
        console.log('[BinanceDepthCollector] Reconnecting to add new symbol...');
        this.stop();
        this.start();
      }
    }
  }

  /**
   * 移除订阅
   */
  public removeSymbol(symbol: string): void {
    const lowerSymbol = symbol.toLowerCase();
    const index = this.symbols.indexOf(lowerSymbol);
    if (index > -1) {
      this.symbols.splice(index, 1);
      console.log(`[BinanceDepthCollector] Removed symbol: ${symbol}`);

      // 清理 OrderBook
      orderBookEngine.clearOrderBook(symbol);

      // 如果已连接，重新连接
      if (this.isConnected) {
        console.log('[BinanceDepthCollector] Reconnecting to update subscriptions...');
        this.stop();
        this.start();
      }
    }
  }
}

// 导出单例
export const binanceDepthCollector = new BinanceDepthCollector();
