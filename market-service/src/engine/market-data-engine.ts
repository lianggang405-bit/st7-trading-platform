/**
 * Market Data Engine - 市场数据引擎
 *
 * 这是整个行情系统的核心，负责：
 * 1. 连接 Binance WebSocket (@trade 流)
 * 2. 将 trade 数据传递给 Kline Engine 进行聚合
 * 3. 通过 Redis 缓存实时数据
 * 4. 通过 WebSocket 推送到前端
 *
 * 架构：
 * Binance WebSocket (@trade)
 *       ↓
 * Market Data Engine
 *       ↓
 * Kline Engine (聚合成 1m/5m/15m/1h/1d)
 *       ↓
 * Redis Cache (缓存)
 *       ↓
 * WebSocket Gateway (推送到前端)
 */

import { BinanceWebSocketCollector } from '../collectors/binance-websocket';
import { updateCandle } from './kline-engine';
import { getRedisClient, isRedisEnabled } from '../config/redis';

/* ─── 健康状态枚举 ────────────────────────────────────────── */

export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
  STOPPED = 'stopped',
}

/* ─── 健康报告接口 ────────────────────────────────────────── */

export interface HealthReport {
  status: HealthStatus;
  uptime: number;                    // 运行时间（秒）
  connectedAt: number | null;        // 连接时间戳
  lastUpdateAt: number | null;      // 最后更新时间戳
  subscribedSymbols: number;         // 订阅的交易对数量
  reconnectAttempts: number;        // 重连尝试次数
  errors: string[];                  // 最近的错误（最多 10 条）
}

/* ─── Market Data Engine 类 ───────────────────────────────── */

export class MarketDataEngine {
  private binanceWS: BinanceWebSocketCollector;
  private isRunning: boolean = false;
  private connectedAt: number | null = null;
  private lastUpdateAt: number | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private recentErrors: string[] = [];
  private reconnectTimer: NodeJS.Timeout | null = null;

  // 批量订阅的交易对列表
  private symbols: string[] = [
    'BTCUSDT',  // Bitcoin
    'ETHUSDT',  // Ethereum
    'BNBUSDT',  // Binance Coin
    'SOLUSDT',  // Solana
    'XRPUSDT',  // Ripple
    'DOGEUSDT', // Dogecoin
    'ADAUSDT',  // Cardano
    'AVAXUSDT', // Avalanche
    'LINKUSDT', // Chainlink
    'DOTUSDT',  // Polkadot
    'XAUUSDT',  // Gold (需要从其他源获取)
  ];

  constructor() {
    // 直接使用Binance格式符号，不再转换
    this.binanceWS = new BinanceWebSocketCollector(this.symbols);

    // 设置价格更新回调
    this.binanceWS.setPriceUpdateCallback((symbol, price) => {
      this.handlePriceUpdate(symbol, price);
    });
  }

  /* ─── 生命周期管理 ─────────────────────────────────────── */

  /**
   * 启动市场数据引擎
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      console.log('[MarketDataEngine] Already running');
      return;
    }

    console.log('[MarketDataEngine] 🚀 Starting...');
    console.log(`[MarketDataEngine] Subscribing to ${this.symbols.length} symbols: ${this.symbols.join(', ')}`);

    try {
      // 启动 Binance WebSocket
      await this.binanceWS.start();

      this.isRunning = true;
      this.connectedAt = Date.now();
      this.reconnectAttempts = 0;
      this.recentErrors = [];

      console.log('[MarketDataEngine] ✅ Started successfully');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.addError(`启动失败: ${errorMsg}`);
      console.error('[MarketDataEngine] ❌ Failed to start:', error);
      throw error;
    }
  }

  /**
   * 停止市场数据引擎
   */
  public stop(): void {
    if (!this.isRunning) {
      console.log('[MarketDataEngine] Already stopped');
      return;
    }

    console.log('[MarketDataEngine] 🛑 Stopping...');

    // 清除重连定时器
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // 停止 WebSocket 连接
    try {
      this.binanceWS.stop?.();
    } catch (error) {
      console.error('[MarketDataEngine] Error stopping WebSocket:', error);
    }

    this.isRunning = false;
    this.connectedAt = null;

    console.log('[MarketDataEngine] ✅ Stopped successfully');
  }

  /**
   * 重启引擎
   */
  public async restart(): Promise<void> {
    console.log('[MarketDataEngine] 🔄 Restarting...');
    this.stop();
    await this.start();
  }

  /* ─── 符号管理 ─────────────────────────────────────────── */

  /**
   * 添加交易对订阅
   */
  public addSymbol(symbol: string): boolean {
    const binanceSymbol = symbol.endsWith('USDT') ? symbol : `${symbol}USDT`;

    if (this.symbols.includes(binanceSymbol)) {
      console.log(`[MarketDataEngine] Symbol already subscribed: ${binanceSymbol}`);
      return false;
    }

    this.symbols.push(binanceSymbol);
    
    // 如果引擎正在运行，添加到 WebSocket
    if (this.isRunning) {
      try {
        this.binanceWS.addSymbol?.(binanceSymbol);
      } catch (error) {
        console.error(`[MarketDataEngine] Error adding symbol to WebSocket:`, error);
      }
    }

    console.log(`[MarketDataEngine] ✅ Added symbol: ${binanceSymbol}`);
    return true;
  }

  /**
   * 移除交易对订阅
   */
  public removeSymbol(symbol: string): boolean {
    const binanceSymbol = symbol.endsWith('USDT') ? symbol : `${symbol}USDT`;

    const index = this.symbols.indexOf(binanceSymbol);
    if (index === -1) {
      console.log(`[MarketDataEngine] Symbol not found: ${binanceSymbol}`);
      return false;
    }

    this.symbols.splice(index, 1);

    // 如果引擎正在运行，从 WebSocket 移除
    if (this.isRunning) {
      try {
        this.binanceWS.removeSymbol?.(binanceSymbol);
      } catch (error) {
        console.error(`[MarketDataEngine] Error removing symbol from WebSocket:`, error);
      }
    }

    console.log(`[MarketDataEngine] ✅ Removed symbol: ${binanceSymbol}`);
    return true;
  }

  /**
   * 获取订阅的交易对列表
   */
  public getSymbols(): string[] {
    return [...this.symbols];
  }

  /* ─── 健康检查与重连 ─────────────────────────────────── */

  /**
   * 获取健康报告
   */
  public getHealthReport(): HealthReport {
    let status = HealthStatus.HEALTHY;

    if (!this.isRunning) {
      status = HealthStatus.STOPPED;
    } else if (this.recentErrors.length > 0 || this.reconnectAttempts > 0) {
      status = HealthStatus.DEGRADED;
    } else if (this.lastUpdateAt && Date.now() - this.lastUpdateAt > 60000) {
      // 超过 60 秒没有更新，认为不健康
      status = HealthStatus.UNHEALTHY;
    }

    return {
      status,
      uptime: this.connectedAt ? Math.floor((Date.now() - this.connectedAt) / 1000) : 0,
      connectedAt: this.connectedAt,
      lastUpdateAt: this.lastUpdateAt,
      subscribedSymbols: this.symbols.length,
      reconnectAttempts: this.reconnectAttempts,
      errors: [...this.recentErrors],
    };
  }

  /**
   * 检查是否需要重连
   */
  public shouldReconnect(): boolean {
    if (!this.isRunning) {
      return false;
    }
    
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('[MarketDataEngine] Max reconnect attempts reached');
      return false;
    }

    // 如果超过 30 秒没有更新，尝试重连
    if (this.lastUpdateAt && Date.now() - this.lastUpdateAt > 30000) {
      return true;
    }

    return false;
  }

  /**
   * 尝试重连
   */
  public async reconnect(): Promise<boolean> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('[MarketDataEngine] Max reconnect attempts reached, giving up');
      return false;
    }

    this.reconnectAttempts++;
    console.log(`[MarketDataEngine] 🔄 Reconnecting... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    try {
      await this.restart();
      console.log('[MarketDataEngine] ✅ Reconnected successfully');
      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.addError(`重连失败 (${this.reconnectAttempts}/${this.maxReconnectAttempts}): ${errorMsg}`);
      console.error(`[MarketDataEngine] ❌ Reconnect failed:`, error);

      // 调度下一次重连
      this.scheduleReconnect();
      return false;
    }
  }

  /**
   * 调度重连
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return;
    }

    // 指数退避：1s, 2s, 4s, 8s, 16s
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 16000);

    console.log(`[MarketDataEngine] Scheduling reconnect in ${delay}ms...`);
    
    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      await this.reconnect();
    }, delay);
  }

  /* ─── 内部方法 ─────────────────────────────────────────── */

  /**
   * 处理价格更新
   */
  private handlePriceUpdate(symbol: string, price: number): void {
    this.lastUpdateAt = Date.now();

    // 1. 更新 Kline Engine (会自动聚合成 1m/5m/15m K线)
    updateCandle(symbol, price);

    // 2. 缓存到 Redis (最新价格)
    this.cachePriceToRedis(symbol, price);

    // 3. KlineEngine 会自动通过 WebSocket 推送 K线更新
  }

  /**
   * 缓存价格到 Redis
   */
  private cachePriceToRedis(symbol: string, price: number): void {
    if (!isRedisEnabled()) {
      return;
    }

    try {
      const redis = getRedisClient();
      const key = `price:${symbol}`;

      // 缓存 5 秒
      redis.setex(key, 5, price.toString());

      // 每 100 次更新打印一次日志（避免刷屏）
      if (Math.random() < 0.01) {
        console.log(`[MarketDataEngine] Cached price: ${symbol} = ${price.toFixed(2)}`);
      }
    } catch (error) {
      console.error('[MarketDataEngine] Error caching price to Redis:', error);
    }
  }

  /**
   * 添加错误记录
   */
  private addError(message: string): void {
    const timestamp = new Date().toISOString();
    this.recentErrors.unshift(`[${timestamp}] ${message}`);
    
    // 保留最近 10 条错误
    if (this.recentErrors.length > 10) {
      this.recentErrors = this.recentErrors.slice(0, 10);
    }
  }
}

// 创建并导出全局实例
export const marketDataEngine = new MarketDataEngine();
