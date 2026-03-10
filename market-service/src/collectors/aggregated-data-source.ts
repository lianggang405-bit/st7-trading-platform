/**
 * 聚合数据源收集器（交易所级架构）
 *
 * 整合多个免费数据源：
 * - Crypto → Binance WebSocket（实时）
 * - Gold → Gold API（10秒刷新）
 * - Forex → Exchange Rate API（30秒刷新）
 * - Oil → Investing.com（60秒刷新）
 * - Fallback → 数据库
 *
 * 架构：
 * Data Sources
 *     ↓
 * Aggregator
 *     ↓
 * Ticker Engine
 *     ↓
 * Kline Engine
 *     ↓
 * Database
 *     ↓
 * TradingView
 */

import { BinanceWebSocketCollector } from './binance-websocket';
import { GoldApiCollector } from './gold-api';
import { ExchangeRateCollector } from './exchange-rate-api';
import { OilPriceCollector } from './oil-price-api';
import { getSupabase } from '../config/database';
import { updateCandle } from '../engine/kline-engine';
import { updateMarket } from '../cache/market-cache';
// import * as TickerEngineModule from '../engine/ticker-engine';
// const tickerEngine = TickerEngineModule.tickerEngine;
import { orderBookEngine } from '../engine/orderbook-engine';

/**
 * 数据源类型
 */
export enum DataSourceType {
  BINANCE_WS = 'Binance WebSocket',
  GOLD_API = 'Gold API',
  EXCHANGE_RATE_API = 'Exchange Rate API',
  OIL_API = 'Oil Price API',
  DATABASE = 'Database',
  DEFAULT = 'Default'
}

/**
 * 价格数据
 */
export interface PriceData {
  symbol: string;
  price: number;
  source: DataSourceType;
  timestamp: number;
}

/**
 * 聚合数据源收集器
 */
export class AggregatedDataSourceCollector {
  private binanceCollector: BinanceWebSocketCollector | null = null;
  private goldCollector: GoldApiCollector | null = null;
  private exchangeRateCollector: ExchangeRateCollector | null = null;
  private oilPriceCollector: OilPriceCollector | null = null;

  // 价格缓存
  private priceCache: Map<string, PriceData> = new Map();

  // 数据源分类
  private cryptoSymbols: Set<string> = new Set([
    'BTCUSD', 'ETHUSD', 'SOLUSD', 'BNBUSD', 'XRPUSD', 'ADAUSD', 'DOGEUSD', 'AVAXUSD', 'LINKUSD', 'DOTUSD',
    'LTCUSD', 'MATICUSD', 'DOTUSD', 'AVAXUSD'
  ]);
  private goldSymbols: Set<string> = new Set(['XAUUSD', 'XAGUSD', 'XPTUSD', 'XPDUSD']);
  private forexSymbols: Set<string> = new Set([
    'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'EURAUD', 'EURGBP', 'EURJPY',
    'GBPAUD', 'GBPNZD', 'GBPJPY', 'AUDUSD', 'AUDJPY', 'NZDUSD', 'NZDJPY',
    'CADJPY', 'CHFJPY'
  ]);
  private oilSymbols: Set<string> = new Set(['USOIL', 'UKOIL', 'NGAS']);

  constructor() {
    console.log('[AggregatedDS] Initializing aggregated data source collector...');
  }

  /**
   * 启动所有数据源
   */
  public async start(): Promise<void> {
    console.log('[AggregatedDS] 🚀 Starting all data sources...');

    // 1. 启动 Binance WebSocket（加密货币 - 实时）
    console.log('[AggregatedDS] 1. Starting Binance WebSocket...');
    await this.startBinanceWebSocket();

    // 2. 启动 Gold API（贵金属 - 10秒）
    console.log('[AggregatedDS] 2. Starting Gold API (10s interval)...');
    await this.startGoldApi();

    // 3. 启动 Exchange Rate API（外汇 - 30秒）
    console.log('[AggregatedDS] 3. Starting Exchange Rate API (30s interval)...');
    await this.startExchangeRateApi();

    // 4. 启动 Oil Price API（能源 - 60秒）
    console.log('[AggregatedDS] 4. Starting Oil Price API (60s interval)...');
    await this.startOilPriceApi();

    console.log('[AggregatedDS] ✅ All data sources started!');
  }

  /**
   * 启动 Binance WebSocket
   */
  private async startBinanceWebSocket(): Promise<void> {
    const cryptoSymbols = Array.from(this.cryptoSymbols).map(s => s.replace('USD', ''));
    
    this.binanceCollector = new BinanceWebSocketCollector(cryptoSymbols);

    // 设置价格更新回调
    // TODO: 修复 tickerEngine 调用问题后重新启用
    // this.binanceCollector.setPriceUpdateCallback((symbol, price) => {
    //   this.updatePrice(symbol, price, DataSourceType.BINANCE_WS);
    // });

    await this.binanceCollector.start();
  }

  /**
   * 启动 Gold API
   */
  private async startGoldApi(): Promise<void> {
    this.goldCollector = new GoldApiCollector(10000); // 10 秒

    // 启动收集器
    await this.goldCollector.start();

    // 定时同步到缓存
    // TODO: 修复 tickerEngine 调用问题后重新启用
    // setInterval(async () => {
    //   const prices = this.goldCollector?.getAllPrices();
    //   if (prices) {
    //     for (const [symbol, price] of prices) {
    //       this.updatePrice(symbol, price, DataSourceType.GOLD_API);
    //     }
    //   }
    // }, 10000); // 每 10 秒同步一次
  }

  /**
   * 启动 Exchange Rate API
   */
  private async startExchangeRateApi(): Promise<void> {
    this.exchangeRateCollector = new ExchangeRateCollector(30000); // 30 秒

    // 启动收集器
    await this.exchangeRateCollector.start();

    // 定时同步到缓存
    // TODO: 修复 tickerEngine 调用问题后重新启用
    // setInterval(async () => {
    //   const rates = this.exchangeRateCollector?.getAllRates();
    //   if (rates) {
    //     for (const [symbol, rate] of rates) {
    //       this.updatePrice(symbol, rate, DataSourceType.EXCHANGE_RATE_API);
    //     }
    //   }
    // }, 30000); // 每 30 秒同步一次
  }

  /**
   * 启动 Oil Price API
   */
  private async startOilPriceApi(): Promise<void> {
    this.oilPriceCollector = new OilPriceCollector(60000); // 60 秒

    // 启动收集器
    await this.oilPriceCollector.start();

    // 定时同步到缓存
    // TODO: 修复 tickerEngine 调用问题后重新启用
    // setInterval(async () => {
    //   const prices = this.oilPriceCollector?.getAllPrices();
    //   if (prices) {
    //     for (const [symbol, price] of prices) {
    //       this.updatePrice(symbol, price, DataSourceType.OIL_API);
    //     }
    //   }
    // }, 60000); // 每 60 秒同步一次
  }

  /**
   * 更新价格并同步到各个组件
   */
  private updatePrice(symbol: string, price: number, source: DataSourceType): void {
    // 更新缓存
    this.priceCache.set(symbol, {
      symbol,
      price,
      source,
      timestamp: Date.now()
    });

    // 更新 K 线引擎
    updateCandle(symbol, price);

    // 更新市场缓存
    updateMarket(symbol, {
      price,
      change: 0, // 需要单独计算 24h 涨跌幅
      volume: Math.random() * 1000,
    });

    // 更新 Ticker Engine（使用 updateTrade 方法）
    // TODO: 修复 tickerEngine 调用问题
    // tickerEngine.updateTrade(symbol, price, Math.random() * 10, price * Math.random() * 10);

    // 生成模拟 OrderBook
    this.generateMockOrderBook(symbol, price);

    // 打印日志（仅部分价格）
    if (Math.random() < 0.1) {
      console.log(`[AggregatedDS] ${symbol}: $${price.toFixed(2)} [${source}]`);
    }
  }

  /**
   * 生成模拟订单簿
   */
  private generateMockOrderBook(symbol: string, price: number): void {
    const depth = 20;
    const priceStep = price * 0.0001;

    const bids: [number, number][] = [];
    const asks: [number, number][] = [];

    for (let i = 0; i < depth; i++) {
      const bidPrice = price - (i + 1) * priceStep;
      const askPrice = price + (i + 1) * priceStep;
      const quantity = Math.random() * 10000;

      bids.push([bidPrice, quantity]);
      asks.push([askPrice, quantity]);
    }

    orderBookEngine.setOrderBook(symbol, { bids, asks });
  }

  /**
   * 获取价格（带降级策略）
   */
  public async getPrice(symbol: string): Promise<number> {
    // 1. 检查缓存
    const cached = this.priceCache.get(symbol);
    if (cached && Date.now() - cached.timestamp < 60000) { // 1 分钟内有效
      return cached.price;
    }

    // 2. 根据数据源类型获取
    if (this.cryptoSymbols.has(symbol) && this.binanceCollector) {
      const price = this.binanceCollector.getPrice(symbol);
      if (price) return price;
    }

    if (this.goldSymbols.has(symbol) && this.goldCollector) {
      const price = this.goldCollector.getPrice(symbol);
      if (price) return price;
    }

    if (this.forexSymbols.has(symbol) && this.exchangeRateCollector) {
      const rate = this.exchangeRateCollector.getRate(symbol);
      if (rate) return rate;
    }

    if (this.oilSymbols.has(symbol) && this.oilPriceCollector) {
      const price = this.oilPriceCollector.getPrice(symbol);
      if (price) return price;
    }

    // 3. 降级到数据库
    const dbPrice = await this.getPriceFromDatabase(symbol);
    if (dbPrice) {
      return dbPrice;
    }

    // 4. 使用默认价格
    return this.getDefaultPrice(symbol);
  }

  /**
   * 从数据库获取价格
   */
  private async getPriceFromDatabase(symbol: string): Promise<number | null> {
    try {
      const supabase = getSupabase();

      const { data, error } = await supabase
        .from('klines')
        .select('close')
        .eq('symbol', symbol)
        .order('open_time', { ascending: false })
        .limit(1);

      if (error) {
        console.error(`[AggregatedDS] ❌ Failed to fetch ${symbol} from database:`, error.message);
        return null;
      }

      if (data && data.length > 0) {
        console.log(`[AggregatedDS] ✅ ${symbol}: $${data[0].close.toFixed(2)} [Database]`);
        return data[0].close;
      }

      return null;
    } catch (error) {
      console.error(`[AggregatedDS] ❌ Error fetching ${symbol} from database:`, error);
      return null;
    }
  }

  /**
   * 获取默认价格
   */
  private getDefaultPrice(symbol: string): number {
    const defaults: Record<string, number> = {
      'BTCUSD': 67000,
      'ETHUSD': 3500,
      'XAUUSD': 5100,
      'XAGUSD': 33,
      'EURUSD': 1.08,
      'USOIL': 75,
    };

    return defaults[symbol] || 100;
  }

  /**
   * 停止所有数据源
   */
  public stop(): void {
    console.log('[AggregatedDS] Stopping all data sources...');

    if (this.binanceCollector) {
      this.binanceCollector.stop();
    }

    console.log('[AggregatedDS] Stopped');
  }

  /**
   * 获取所有缓存的价格
   */
  public getAllPrices(): Map<string, PriceData> {
    return new Map(this.priceCache);
  }
}

/**
 * 导出单例
 */
export const aggregatedDataSource = new AggregatedDataSourceCollector();
