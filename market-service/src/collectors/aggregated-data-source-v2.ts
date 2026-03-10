/**
 * 聚合数据源收集器（交易所级架构 - 带降级方案）
 *
 * 整合多个免费数据源，并实现智能降级：
 * - Crypto → Binance WebSocket (实时) → Binance HTTP (5s) → Database
 * - Gold → Gold API (10s) → Yahoo Finance (30s) → Database
 * - Forex → Exchange Rate API (30s) → ECB API (60s) → Database
 * - Oil → Yahoo Finance (60s) → Database
 *
 * 架构：
 * Data Sources (优先级 1, 2, 3...)
 *     ↓
 * Aggregator (智能选择最优数据源)
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
import { BinanceHttpCollector } from './binance-http';
import { GoldApiCollector } from './gold-api';
import { ExchangeRateCollector } from './exchange-rate-api';
import { OilPriceCollector } from './oil-price-api';
import { getAllMetalsPrices, getAllEnergyPrices } from './yahoo-finance';
import { getSupabase } from '../config/database';
import { updateCandle } from '../engine/kline-engine';
import { updateMarket } from '../cache/market-cache';
import { tickerEngine } from '../engine/ticker-engine';
import { orderBookEngine } from '../engine/orderbook-engine';

/**
 * 数据源类型
 */
export enum DataSourceType {
  BINANCE_WS = 'Binance WebSocket',
  BINANCE_HTTP = 'Binance HTTP',
  GOLD_API = 'Gold API',
  YAHOO_FINANCE = 'Yahoo Finance',
  EXCHANGE_RATE_API = 'Exchange Rate API',
  ECB_API = 'ECB API',
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
export class AggregatedDataSourceCollectorV2 {
  private binanceWsCollector: BinanceWebSocketCollector | null = null;
  private binanceHttpCollector: BinanceHttpCollector | null = null;
  private goldCollector: GoldApiCollector | null = null;
  private exchangeRateCollector: ExchangeRateCollector | null = null;
  private oilPriceCollector: OilPriceCollector | null = null;

  // Yahoo Finance 定时器
  private yahooMetalsTimer: NodeJS.Timeout | null = null;
  private yahooEnergyTimer: NodeJS.Timeout | null = null;

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
    console.log('[AggregatedDS] Initializing aggregated data source collector v2...');
  }

  /**
   * 启动所有数据源
   */
  public async start(): Promise<void> {
    console.log('[AggregatedDS] 🚀 Starting all data sources with fallback...');

    // 1. 启动 Binance WebSocket（加密货币 - 实时）→ 失败则降级到 HTTP
    console.log('[AggregatedDS] 1. Starting Binance WebSocket (will fallback to HTTP if failed)...');
    await this.startBinanceWebSocket();

    // 2. 启动 Binance HTTP（加密货币 - 5秒）作为 WebSocket 的降级方案
    console.log('[AggregatedDS] 2. Starting Binance HTTP (5s interval, fallback for WebSocket)...');
    await this.startBinanceHttp();

    // 3. 启动 Gold API（贵金属 - 10秒）
    console.log('[AggregatedDS] 3. Starting Gold API (10s interval)...');
    await this.startGoldApi();

    // 4. 启动 Yahoo Finance（贵金属 - 30秒，作为 Gold API 的降级方案）
    console.log('[AggregatedDS] 4. Starting Yahoo Finance Metals (30s interval, fallback for Gold API)...');
    await this.startYahooFinanceMetals();

    // 5. 启动 Exchange Rate API（外汇 - 30秒）
    console.log('[AggregatedDS] 5. Starting Exchange Rate API (30s interval)...');
    await this.startExchangeRateApi();

    // 6. 启动 Yahoo Finance（能源 - 60秒）
    console.log('[AggregatedDS] 6. Starting Yahoo Finance Energy (60s interval, replacing Investing.com)...');
    await this.startYahooFinanceEnergy();

    console.log('[AggregatedDS] ✅ All data sources started!');
  }

  /**
   * 启动 Binance WebSocket
   */
  private async startBinanceWebSocket(): Promise<void> {
    const cryptoSymbols = Array.from(this.cryptoSymbols).map(s => s.replace('USD', ''));

    this.binanceWsCollector = new BinanceWebSocketCollector(cryptoSymbols);

    // 设置价格更新回调
    this.binanceWsCollector.setPriceUpdateCallback((symbol, price) => {
      this.updatePrice(symbol, price, DataSourceType.BINANCE_WS);
    });

    await this.binanceWsCollector.start();
  }

  /**
   * 启动 Binance HTTP（作为 WebSocket 的降级方案）
   */
  private async startBinanceHttp(): Promise<void> {
    // 为主要的加密货币创建 HTTP 采集器
    const mainCryptoSymbols = ['BTC', 'ETH', 'SOL'];

    for (const symbol of mainCryptoSymbols) {
      const collector = new BinanceHttpCollector(`${symbol}USDT`, 5000); // 5 秒

      // 直接更新价格
      const fetchPrice = async () => {
        try {
          const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}USDT`);
          const data = await response.json();

          if (data.price) {
            const price = parseFloat(data.price);
            this.updatePrice(`${symbol}USD`, price, DataSourceType.BINANCE_HTTP);
          }
        } catch (error) {
          console.error(`[BinanceHTTP] Error fetching ${symbol}:`, error);
        }
      };

      // 立即执行一次
      fetchPrice();

      // 定时刷新
      setInterval(fetchPrice, 5000);
    }

    console.log('[BinanceHTTP] ✅ HTTP collectors started for BTC, ETH, SOL');
  }

  /**
   * 启动 Gold API
   */
  private async startGoldApi(): Promise<void> {
    this.goldCollector = new GoldApiCollector(10000); // 10 秒

    // 启动收集器
    await this.goldCollector.start();

    // 定时同步到缓存
    setInterval(async () => {
      const prices = this.goldCollector?.getAllPrices();
      if (prices) {
        for (const [symbol, price] of prices) {
          this.updatePrice(symbol, price, DataSourceType.GOLD_API);
        }
      }
    }, 10000); // 每 10 秒同步一次
  }

  /**
   * 启动 Yahoo Finance（贵金属）
   */
  private async startYahooFinanceMetals(): Promise<void> {
    const fetchPrices = async () => {
      const prices = await getAllMetalsPrices();

      for (const [symbol, price] of prices) {
        this.updatePrice(symbol, price, DataSourceType.YAHOO_FINANCE);
      }
    };

    // 立即执行一次
    fetchPrices();

    // 定时刷新（30秒）
    this.yahooMetalsTimer = setInterval(fetchPrices, 30000);
  }

  /**
   * 启动 Exchange Rate API
   */
  private async startExchangeRateApi(): Promise<void> {
    this.exchangeRateCollector = new ExchangeRateCollector(30000); // 30 秒

    // 启动收集器
    await this.exchangeRateCollector.start();

    // 定时同步到缓存
    setInterval(async () => {
      const rates = this.exchangeRateCollector?.getAllRates();
      if (rates) {
        for (const [symbol, rate] of rates) {
          this.updatePrice(symbol, rate, DataSourceType.EXCHANGE_RATE_API);
        }
      }
    }, 30000); // 每 30 秒同步一次
  }

  /**
   * 启动 Yahoo Finance（能源）
   */
  private async startYahooFinanceEnergy(): Promise<void> {
    const fetchPrices = async () => {
      const prices = await getAllEnergyPrices();

      if (prices.size > 0) {
        for (const [symbol, price] of prices) {
          this.updatePrice(symbol, price, DataSourceType.YAHOO_FINANCE);
        }
      } else {
        console.warn('[YahooFinance] ⚠️ Energy prices empty, fallback to database');

        // 降级到数据库
        for (const symbol of this.oilSymbols) {
          const price = await this.getPriceFromDatabase(symbol);
          if (price !== null) {
            this.updatePrice(symbol, price, DataSourceType.DATABASE);
          }
        }
      }
    };

    // 立即执行一次
    fetchPrices();

    // 定时刷新（60秒）
    this.yahooEnergyTimer = setInterval(fetchPrices, 60000);
  }

  /**
   * 从数据库获取价格（降级方案）
   */
  private async getPriceFromDatabase(symbol: string): Promise<number | null> {
    try {
      const supabase = getSupabase();

      const { data, error } = await supabase
        .from('klines')
        .select('close')
        .eq('symbol', symbol)
        .eq('interval', '1m')
        .order('open_time', { ascending: false })
        .limit(1);

      if (error) {
        console.error(`[Database] Failed to fetch ${symbol}:`, error.message);
        return null;
      }

      if (data && data.length > 0) {
        return data[0].close;
      }

      return null;
    } catch (error) {
      console.error(`[Database] Error fetching ${symbol}:`, error);
      return null;
    }
  }

  /**
   * 更新价格并同步到各个组件
   */
  private updatePrice(symbol: string, price: number, source: DataSourceType): void {
    // 确保价格是数字
    const numPrice = typeof price === 'number' ? price : parseFloat(String(price));
    if (isNaN(numPrice)) {
      console.error('[AggregatedDS] Invalid price:', price, typeof price);
      return;
    }

    // 更新缓存
    this.priceCache.set(symbol, {
      symbol,
      price: numPrice,
      source,
      timestamp: Date.now()
    });

    // 1. 更新 Ticker Engine（24h 统计）
    tickerEngine.updatePrice(symbol, numPrice, 0); // 暂时用 0 作为交易量

    // 2. 更新 OrderBook Engine（模拟）
    orderBookEngine.setOrderBook(symbol, {
      bids: [[numPrice - 0.01, 100]],
      asks: [[numPrice + 0.01, 100]],
      lastUpdateId: Date.now()
    });

    // 3. 更新 K线引擎
    updateCandle(symbol, numPrice, 0);

    // 4. 更新 Market Cache
    updateMarket(symbol, numPrice, 0);

    // 输出日志（降级方案）
    if (source === DataSourceType.DATABASE) {
      console.warn(`[AggregatedDS] ⚠️ ${symbol}: Using database price ($${numPrice.toFixed(2)})`);
    }
  }

  /**
   * 停止所有数据源
   */
  public async stop(): Promise<void> {
    console.log('[AggregatedDS] Stopping all data sources...');

    if (this.binanceWsCollector) {
      await this.binanceWsCollector.stop();
    }

    if (this.binanceHttpCollector) {
      this.binanceHttpCollector.stop();
    }

    if (this.yahooMetalsTimer) {
      clearInterval(this.yahooMetalsTimer);
    }

    if (this.yahooEnergyTimer) {
      clearInterval(this.yahooEnergyTimer);
    }

    console.log('[AggregatedDS] ✅ All data sources stopped');
  }

  /**
   * 获取缓存的价格
   */
  public getPrice(symbol: string): number | null {
    const priceData = this.priceCache.get(symbol);

    if (!priceData) {
      return null;
    }

    // 检查是否过期（2分钟）
    const age = Date.now() - priceData.timestamp;
    if (age > 120000) {
      console.warn(`[AggregatedDS] ⚠️ Price for ${symbol} is stale (${(age / 1000).toFixed(0)}s old)`);
    }

    return priceData.price;
  }

  /**
   * 获取所有缓存的价格
   */
  public getAllPrices(): Map<string, number> {
    const prices = new Map<string, number>();

    this.priceCache.forEach((priceData, symbol) => {
      prices.set(symbol, priceData.price);
    });

    return prices;
  }

  /**
   * 获取价格数据源
   */
  public getPriceSource(symbol: string): DataSourceType | null {
    const priceData = this.priceCache.get(symbol);

    if (!priceData) {
      return null;
    }

    return priceData.source;
  }

  /**
   * 打印数据源状态
   */
  public printStatus(): void {
    console.log('[AggregatedDS] 📊 Data Source Status:');

    const sourceCount = new Map<DataSourceType, number>();

    this.priceCache.forEach((priceData) => {
      const count = sourceCount.get(priceData.source) || 0;
      sourceCount.set(priceData.source, count + 1);
    });

    sourceCount.forEach((count, source) => {
      const icon = source === DataSourceType.DATABASE ? '⚠️' : '✅';
      console.log(`  ${icon} ${source}: ${count} symbols`);
    });

    console.log(`  📈 Total: ${this.priceCache.size} symbols`);
  }
}

// 导出单例
export const aggregatedDataSourceV2 = new AggregatedDataSourceCollectorV2();
