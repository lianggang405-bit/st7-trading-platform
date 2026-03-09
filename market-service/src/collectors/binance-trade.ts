import WebSocket from 'ws';
import { updateCandle } from '../engine/kline-engine';
import { updateMarket } from '../cache/market-cache';

/**
 * Binance Trade 消息格式
 */
interface BinanceTradeMessage {
  e: string;          // 事件类型
  E: number;          // 事件时间
  s: string;          // 交易对
  t: number;          // 交易ID
  p: string;          // 价格
  q: string;          // 数量
  b: number;          // 买方订单ID
  a: number;          // 卖方订单ID
  T: number;          // 交易时间
  m: boolean;         // 是否是maker
  M: boolean;         // 是否忽略
}

/**
 * Binance Trade Stream Collector
 * 从 Binance WebSocket 接收实时交易数据
 */
export class BinanceTradeCollector {
  private ws: WebSocket | null = null;
  private symbols: string[];
  private reconnectInterval: NodeJS.Timeout | null = null;
  private reconnectDelay: number = 1000; // 初始重连延迟 1秒
  private maxReconnectDelay: number = 30000; // 最大重连延迟 30秒
  private isConnected: boolean = false;

  constructor(symbols: string[] = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT']) {
    this.symbols = symbols.map(s => s.toLowerCase());
  }

  /**
   * 启动采集器
   */
  public start(): void {
    console.log('[BinanceTradeCollector] Starting...');
    this.connect();
  }

  /**
   * 停止采集器
   */
  public stop(): void {
    console.log('[BinanceTradeCollector] Stopping...');

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
  private connect(): void {
    // 构建订阅流
    const streams = this.symbols.map(s => `${s}@trade`).join('/');
    const url = `wss://stream.binance.com:9443/ws/${streams}`;

    console.log(`[BinanceTradeCollector] Connecting to ${url}...`);

    this.ws = new WebSocket(url);

    this.ws.on('open', () => {
      console.log('[BinanceTradeCollector] ✅ Connected to Binance WebSocket');
      this.isConnected = true;
      this.reconnectDelay = 1000; // 重置重连延迟
    });

    this.ws.on('message', (data: WebSocket.Data) => {
      this.handleMessage(data);
    });

    this.ws.on('error', (error: Error) => {
      console.error('[BinanceTradeCollector] ❌ WebSocket error:', error.message);
    });

    this.ws.on('close', (code: number, reason: Buffer) => {
      console.log(`[BinanceTradeCollector] ⚠️  WebSocket closed: ${code} - ${reason.toString()}`);
      this.isConnected = false;
      this.scheduleReconnect();
    });

    this.ws.on('ping', () => {
      // 响应 ping
      this.ws?.pong();
    });
  }

  /**
   * 处理接收到的消息
   */
  private handleMessage(data: WebSocket.Data): void {
    try {
      const message = JSON.parse(data.toString()) as BinanceTradeMessage;

      // 只处理 trade 消息
      if (message.e !== 'trade') {
        return;
      }

      // 提取数据
      const symbol = message.s.toUpperCase();
      const price = parseFloat(message.p);
      const volume = parseFloat(message.q);

      // 更新 K线
      updateCandle(symbol, price, '1m', volume);

      // 更新市场缓存
      updateMarket(symbol, price, volume);

      // 可选：打印日志（生产环境可以关闭）
      // console.log(
      //   `[BinanceTradeCollector] ${symbol}: $${price.toFixed(2)} | Vol: ${volume.toFixed(4)}`
      // );

    } catch (error) {
      console.error('[BinanceTradeCollector] Error handling message:', error);
    }
  }

  /**
   * 调度重连
   */
  private scheduleReconnect(): void {
    console.log(
      `[BinanceTradeCollector] 🔄 Reconnecting in ${this.reconnectDelay / 1000} seconds...`
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
  public addSymbol(symbol: string): void {
    const lowerSymbol = symbol.toLowerCase();
    if (!this.symbols.includes(lowerSymbol)) {
      this.symbols.push(lowerSymbol);
      console.log(`[BinanceTradeCollector] Added symbol: ${symbol}`);

      // 如果已连接，需要重新连接以订阅新交易对
      if (this.isConnected) {
        console.log('[BinanceTradeCollector] Reconnecting to add new symbol...');
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
      console.log(`[BinanceTradeCollector] Removed symbol: ${symbol}`);

      // 如果已连接，需要重新连接
      if (this.isConnected) {
        console.log('[BinanceTradeCollector] Reconnecting to update subscriptions...');
        this.stop();
        this.start();
      }
    }
  }
}

// 导出单例
export const binanceTradeCollector = new BinanceTradeCollector();
