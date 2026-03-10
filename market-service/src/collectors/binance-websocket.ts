/**
 * Binance WebSocket 收集器（加密货币实时数据）
 *
 * 官网: https://www.binance.com
 * 
 * 特点：
 * - 完全免费
 * - 实时价格
 * - 无限请求
 * - 交易所官方
 * - 延迟极低
 * 
 * 支持：
 * - BTC, ETH, SOL 等 1000+ 币
 */

import WebSocket from 'ws';

const BINANCE_WS_URL = 'wss://stream.binance.com:9443/ws';

/**
 * Binance WebSocket 交易事件数据格式
 */
interface BinanceTradeEvent {
  e: string; // Event type
  E: number; // Event time
  s: string; // Symbol (e.g., BTCUSDT)
  p: string; // Price
  q: string; // Quantity
  b: number; // Buyer order ID
  a: number; // Seller order ID
  T: number; // Trade time
  m: boolean; // Is buyer the market maker?
  M: boolean; // Ignore
}

/**
 * 转换 Binance 符号到系统符号
 */
function binanceSymbolToSystem(symbol: string): string {
  return symbol.replace('USDT', 'USD');
}

/**
 * 转换系统符号到 Binance 符号
 */
function systemSymbolToBinance(symbol: string): string {
  return symbol.replace('USD', 'USDT');
}

/**
 * Binance WebSocket 收集器类
 */
export class BinanceWebSocketCollector {
  private ws: WebSocket | null = null;
  private symbols: string[];
  private prices: Map<string, number> = new Map();
  private reconnectInterval: number = 5000; // 重连间隔 5 秒
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  /**
   * 价格更新回调函数
   */
  private onPriceUpdate: ((symbol: string, price: number) => void) | null = null;

  constructor(symbols: string[] = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'AVAX', 'LINK', 'DOT']) {
    // 转换为 Binance 格式（添加 USDT 后缀）
    this.symbols = symbols.map(s => s.endsWith('USDT') ? s : `${s}USDT`);
  }

  /**
   * 设置价格更新回调
   */
  public setPriceUpdateCallback(callback: (symbol: string, price: number) => void): void {
    this.onPriceUpdate = callback;
  }

  /**
   * 启动 WebSocket 连接
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      console.log('[BinanceWS] Already running');
      return;
    }

    console.log('[BinanceWS] Starting...');
    console.log(`[BinanceWS] Symbols: ${this.symbols.join(', ')}`);

    this.isRunning = true;
    await this.connect();
  }

  /**
   * 建立 WebSocket 连接
   */
  private async connect(): Promise<void> {
    try {
      // 构建订阅流
      const streams = this.symbols.map(s => `${s.toLowerCase()}@trade`).join('/');

      const url = `${BINANCE_WS_URL}/${streams}`;

      console.log(`[BinanceWS] Connecting to: ${url}`);

      this.ws = new WebSocket(url);

      this.ws.on('open', () => {
        console.log('[BinanceWS] ✅ Connected');
        
        // 清除重连计时器
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        try {
          const message: BinanceTradeEvent = JSON.parse(data.toString());
          this.handleTradeMessage(message);
        } catch (error) {
          console.error('[BinanceWS] Error parsing message:', error);
        }
      });

      this.ws.on('error', (error) => {
        console.error('[BinanceWS] ❌ WebSocket error:', error);
      });

      this.ws.on('close', (code: number, reason: Buffer) => {
        console.log(`[BinanceWS] ⚠️ Disconnected: ${code} - ${reason.toString()}`);

        // 自动重连
        if (this.isRunning) {
          this.scheduleReconnect();
        }
      });

    } catch (error) {
      console.error('[BinanceWS] ❌ Connection failed:', error);
      
      if (this.isRunning) {
        this.scheduleReconnect();
      }
    }
  }

  /**
   * 处理交易消息
   */
  private handleTradeMessage(message: BinanceTradeEvent): void {
    if (message.e !== 'trade') {
      return;
    }

    const systemSymbol = binanceSymbolToSystem(message.s);
    const price = parseFloat(message.p);

    if (isNaN(price)) {
      return;
    }

    // 更新价格缓存
    this.prices.set(systemSymbol, price);

    // 触发回调
    if (this.onPriceUpdate) {
      this.onPriceUpdate(systemSymbol, price);
    }

    // 每 100 笔交易打印一次日志（避免刷屏）
    if (Math.random() < 0.01) {
      console.log(`[BinanceWS] ${systemSymbol}: $${price.toFixed(2)}`);
    }
  }

  /**
   * 计划重连
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return;
    }

    console.log(`[BinanceWS] 🔄 Reconnecting in ${this.reconnectInterval / 1000}s...`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, this.reconnectInterval);
  }

  /**
   * 获取缓存的价格
   */
  public getPrice(symbol: string): number | null {
    return this.prices.get(symbol) || null;
  }

  /**
   * 获取所有缓存的价格
   */
  public getAllPrices(): Map<string, number> {
    return new Map(this.prices);
  }

  /**
   * 停止收集器
   */
  public stop(): void {
    console.log('[BinanceWS] Stopping...');

    this.isRunning = false;

    // 清除重连计时器
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // 关闭 WebSocket
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    console.log('[BinanceWS] Stopped');
  }

  /**
   * 检查是否正在运行
   */
  public isActive(): boolean {
    return this.isRunning && this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

/**
 * 快捷函数：创建并启动 Binance WebSocket 收集器
 */
export async function startBinanceWebSocket(
  symbols: string[],
  onPriceUpdate?: (symbol: string, price: number) => void
): Promise<BinanceWebSocketCollector> {
  const collector = new BinanceWebSocketCollector(symbols);

  if (onPriceUpdate) {
    collector.setPriceUpdateCallback(onPriceUpdate);
  }

  await collector.start();

  return collector;
}
