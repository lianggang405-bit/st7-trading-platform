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

/**
 * Market Data Engine 类
 */
export class MarketDataEngine {
  private binanceWS: BinanceWebSocketCollector;
  private isRunning: boolean = false;

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

      console.log('[MarketDataEngine] ✅ Started successfully');
    } catch (error) {
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

    // TODO: 实现 BinanceWebSocketCollector.stop() 方法
    // this.binanceWS.stop();

    this.isRunning = false;

    console.log('[MarketDataEngine] ✅ Stopped successfully');
  }

  /**
   * 处理价格更新
   *
   * 当收到 Binance trade 数据时：
   * 1. 更新 Kline Engine (聚合成多周期K线)
   * 2. 缓存到 Redis (价格缓存)
   * 3. 自动推送到前端 (通过 KlineEngine 的 broadcastKline)
   */
  private handlePriceUpdate(symbol: string, price: number): void {
    // 1. 更新 Kline Engine (会自动聚合成 1m/5m/15m K线)
    updateCandle(symbol, price);

    // 2. 缓存到 Redis (最新价格)
    this.cachePriceToRedis(symbol, price);

    // 3. KlineEngine 会自动通过 WebSocket 推送 K线更新
  }

  /**
   * 缓存价格到 Redis
   *
   * key: price:BTCUSD
   * TTL: 5s
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
   * 从 Redis 获取价格
   */
  public async getPriceFromRedis(symbol: string): Promise<number | null> {
    if (!isRedisEnabled()) {
      return null;
    }

    try {
      const redis = getRedisClient();
      const key = `price:${symbol}`;
      const price = await redis.get(key);

      if (price) {
        return parseFloat(price);
      }

      return null;
    } catch (error) {
      console.error('[MarketDataEngine] Error getting price from Redis:', error);
      return null;
    }
  }

  /**
   * 添加交易对订阅
   */
  public addSymbol(symbol: string): void {
    const binanceSymbol = symbol.endsWith('USDT') ? symbol : `${symbol}USDT`;

    if (!this.symbols.includes(binanceSymbol)) {
      // TODO: 实现 BinanceWebSocketCollector.addSymbol() 方法
      // this.binanceWS.addSymbol(binanceSymbol);

      this.symbols.push(binanceSymbol);
      console.log(`[MarketDataEngine] Added symbol: ${binanceSymbol}`);
    }
  }

  /**
   * 移除交易对订阅
   */
  public removeSymbol(symbol: string): void {
    const binanceSymbol = symbol.endsWith('USDT') ? symbol : `${symbol}USDT`;

    const index = this.symbols.indexOf(binanceSymbol);
    if (index > -1) {
      // TODO: 实现 BinanceWebSocketCollector.removeSymbol() 方法
      // this.binanceWS.removeSymbol(binanceSymbol);

      this.symbols.splice(index, 1);
      console.log(`[MarketDataEngine] Removed symbol: ${binanceSymbol}`);
    }
  }

  /**
   * 获取订阅的交易对列表
   */
  public getSymbols(): string[] {
    return this.symbols.map(s => s.replace('USDT', 'USD'));
  }
}

// 创建并导出全局实例
export const marketDataEngine = new MarketDataEngine();
