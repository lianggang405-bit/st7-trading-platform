import WebSocket, { WebSocketServer, WebSocket as WebSocketType } from 'ws';
import { getMarket, getAllMarkets, getKlineCache, getCacheSize } from '../cache/market-cache';
import { orderBookEngine } from '../engine/orderbook-engine';

/**
 * 订阅信息
 */
interface Subscription {
  symbol: string;
  interval: string;
}

/**
 * 客户端会话
 */
interface ClientSession extends WebSocketType {
  subscriptions: Set<string>;
  isAlive: boolean;
}

/**
 * WebSocket 行情服务器
 */
class MarketWebSocketServer {
  private wss: WebSocketServer;
  private port: number;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private broadcastInterval: NodeJS.Timeout | null = null;

  constructor(port: number = 8081) {
    this.port = port;
    this.wss = new WebSocketServer({ port });

    this.setupServer();
  }

  /**
   * 设置服务器
   */
  private setupServer(): void {
    console.log(`📡 WebSocket Market Server running on port ${this.port}`);

    this.wss.on('connection', (ws: ClientSession) => {
      this.handleConnection(ws);
    });

    // 心跳检测（每30秒）
    this.heartbeatInterval = setInterval(() => {
      this.wss.clients.forEach((ws: ClientSession) => {
        if (!ws.isAlive) {
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);

    // 广播实时行情（每1秒）
    this.broadcastInterval = setInterval(() => {
      this.broadcastTickers();
    }, 1000);
  }

  /**
   * 处理客户端连接
   */
  private handleConnection(ws: ClientSession): void {
    // const clientIp = ws.remoteAddress || 'unknown';
    const clientIp = 'unknown';
    console.log(`[WebSocket] Client connected: ${clientIp}`);

    // 初始化会话
    ws.subscriptions = new Set();
    ws.isAlive = true;

    // 发送欢迎消息
    ws.send(JSON.stringify({
      type: 'welcome',
      message: 'Connected to ST7 Trading Market Server',
      timestamp: Date.now()
    }));

    // 处理消息
    ws.on('message', (data: WebSocket.Data) => {
      this.handleMessage(ws, data);
    });

    // 处理心跳响应
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    // 处理错误
    ws.on('error', (error: Error) => {
      console.error(`[WebSocket] Client error: ${error.message}`);
    });

    // 处理关闭
    ws.on('close', () => {
      console.log(`[WebSocket] Client disconnected: ${clientIp}`);
      ws.subscriptions.clear();
    });
  }

  /**
   * 处理客户端消息
   */
  private handleMessage(ws: ClientSession, data: WebSocket.Data): void {
    try {
      const message = JSON.parse(data.toString());
      const { type, symbol, symbols, interval } = message;

      switch (type) {
        case 'subscribe':
          this.handleSubscribe(ws, symbol);
          break;

        case 'unsubscribe':
          this.handleUnsubscribe(ws, symbol);
          break;

        case 'subscribe_all':
          this.handleSubscribeAll(ws);
          break;

        case 'get_markets':
          this.handleGetMarkets(ws);
          break;

        case 'get_kline':
          this.handleGetKline(ws, symbol, interval || '1m');
          break;

        case 'get_orderbook':
          this.handleGetOrderBook(ws, symbol, interval || '20');
          break;

        default:
          console.warn(`[WebSocket] Unknown message type: ${type}`);
          this.sendError(ws, `Unknown message type: ${type}`);
      }
    } catch (error) {
      console.error('[WebSocket] Error handling message:', error);
      this.sendError(ws, 'Invalid message format');
    }
  }

  /**
   * 处理订阅单个交易对
   */
  private handleSubscribe(ws: ClientSession, symbol: string): void {
    if (!symbol) {
      this.sendError(ws, 'Symbol is required');
      return;
    }

    ws.subscriptions.add(symbol);
    console.log(`[WebSocket] Client subscribed to: ${symbol}`);

    // 立即发送当前行情
    const market = getMarket(symbol);
    if (market) {
      ws.send(JSON.stringify({
        type: 'ticker',
        data: market
      }));
    }

    // 确认订阅
    ws.send(JSON.stringify({
      type: 'subscribed',
      symbol
    }));
  }

  /**
   * 处理取消订阅
   */
  private handleUnsubscribe(ws: ClientSession, symbol: string): void {
    ws.subscriptions.delete(symbol);
    console.log(`[WebSocket] Client unsubscribed from: ${symbol}`);

    ws.send(JSON.stringify({
      type: 'unsubscribed',
      symbol
    }));
  }

  /**
   * 处理订阅所有交易对
   */
  private handleSubscribeAll(ws: ClientSession): void {
    const markets = getAllMarkets();
    const symbols = Object.keys(markets);

    symbols.forEach(symbol => {
      ws.subscriptions.add(symbol);
    });

    console.log(`[WebSocket] Client subscribed to all: ${symbols.length} symbols`);

    // 立即发送所有行情
    ws.send(JSON.stringify({
      type: 'tickers',
      data: markets
    }));

    // 确认订阅
    ws.send(JSON.stringify({
      type: 'subscribed_all',
      count: symbols.length
    }));
  }

  /**
   * 处理获取所有行情
   */
  private handleGetMarkets(ws: ClientSession): void {
    const markets = getAllMarkets();

    ws.send(JSON.stringify({
      type: 'tickers',
      data: markets,
      count: Object.keys(markets).length
    }));
  }

  /**
   * 处理获取K线
   */
  private handleGetKline(ws: ClientSession, symbol: string, interval: string): void {
    if (!symbol) {
      this.sendError(ws, 'Symbol is required');
      return;
    }

    const kline = getKlineCache(symbol, interval);

    ws.send(JSON.stringify({
      type: 'kline',
      symbol,
      interval,
      data: kline
    }));
  }

  /**
   * 处理获取订单簿
   */
  private handleGetOrderBook(ws: ClientSession, symbol: string, limitStr: string): void {
    if (!symbol) {
      this.sendError(ws, 'Symbol is required');
      return;
    }

    const limit = limitStr ? parseInt(limitStr) : 20;
    const orderBook = orderBookEngine.getOrderBook(symbol, limit);

    if (orderBook) {
      ws.send(JSON.stringify({
        type: 'orderbook',
        symbol,
        data: orderBook
      }));
    } else {
      this.sendError(ws, `OrderBook not found for symbol: ${symbol}`);
    }
  }

  /**
   * 广播实时行情
   */
  private broadcastTickers(): void {
    const markets = getAllMarkets();

    this.wss.clients.forEach((ws: ClientSession) => {
      // 只发送订阅的行情
      const subscribedMarkets: Record<string, any> = {};

      ws.subscriptions.forEach(symbol => {
        const market = markets[symbol];
        if (market) {
          subscribedMarkets[symbol] = market;
        }
      });

      // 如果有订阅的行情更新，发送给客户端
      if (Object.keys(subscribedMarkets).length > 0) {
        ws.send(JSON.stringify({
          type: 'ticker_update',
          data: subscribedMarkets,
          timestamp: Date.now()
        }));
      }
    });
  }

  /**
   * 发送错误消息
   */
  private sendError(ws: ClientSession, message: string): void {
    ws.send(JSON.stringify({
      type: 'error',
      message,
      timestamp: Date.now()
    }));
  }

  /**
   * 广播 K 线更新
   * 当 K 线数据变化时，立即推送给订阅该交易对的客户端
   */
  public broadcastKline(symbol: string, interval: string, candle: any): void {
    const message = JSON.stringify({
      type: 'kline_update',
      symbol,
      interval,
      data: candle,
      timestamp: Date.now()
    });

    this.wss.clients.forEach((ws: ClientSession) => {
      // 只推送给订阅该交易对的客户端
      if (ws.subscriptions.has(symbol)) {
        try {
          ws.send(message);
        } catch (error) {
          console.error(`[WebSocket] Error sending kline update to client: ${error}`);
        }
      }
    });
  }

  /**
   * 获取连接数
   */
  public getConnectionCount(): number {
    return this.wss.clients.size;
  }

  /**
   * 关闭服务器
   */
  public close(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    if (this.broadcastInterval) {
      clearInterval(this.broadcastInterval);
    }
    this.wss.close();
  }
}

// 创建并导出服务器实例
export const marketServer = new MarketWebSocketServer(8081);

/**
 * 广播 K 线更新（全局函数）
 * 供 KlineEngine 调用
 */
export function broadcastKline(symbol: string, interval: string, candle: any): void {
  marketServer.broadcastKline(symbol, interval, candle);
}

// 优雅退出
process.on('SIGINT', () => {
  console.log('\n[WebSocket] Shutting down...');
  marketServer.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n[WebSocket] Shutting down...');
  marketServer.close();
  process.exit(0);
});
