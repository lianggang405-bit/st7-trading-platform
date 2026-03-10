import dotenv from 'dotenv';
dotenv.config();

// 调试：打印环境变量
console.log('[Debug] SUPABASE_URL:', process.env.SUPABASE_URL ? 'SET' : 'NOT SET');
console.log('[Debug] SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET');
console.log('[Debug] REDIS_URL:', process.env.REDIS_URL || 'redis://localhost:6379');

import express from 'express';
import cors from 'cors';
import { testConnection } from './config/database';
import { initRedisCache } from './cache/redis-cache';
import { aggregatedDataSource } from './collectors/aggregated-data-source';
import { flushCandles, getCachedCandlesCount, generateFlatCandles } from './engine/kline-engine';
import { getCacheSize } from './cache/market-cache';

import { tickerEngine } from './engine/ticker-engine';
import { orderBookEngine } from './engine/orderbook-engine';
import tradingviewRoutes from './tradingview/routes';

// 启动 WebSocket 行情服务器（会自动启动）
import './ws/market-server';

/**
 * 行情采集服务主入口
 */
async function main() {
  console.log('🚀 Starting Market Collector Service...\n');

  // 测试数据库连接
  console.log('1. Testing database connection...');
  const isConnected = await testConnection();

  if (!isConnected) {
    console.error('❌ Database connection failed. Please check your configuration.');
    process.exit(1);
  }

  console.log('');

  // 初始化 Redis 缓存
  console.log('2. Initializing Redis Cache...');
  await initRedisCache();

  console.log('');

  // 启动 Ticker Engine（24h 统计）
  console.log('3. Starting Ticker Engine (24h statistics)...');
  await tickerEngine.loadFromDatabase();

  console.log('');

  // 启动聚合数据源收集器（交易所级架构）
  console.log('4. Starting Aggregated Data Source (Crypto/Gold/Forex/Oil)...');
  console.log('   - Crypto   → Binance WebSocket (Real-time)');
  console.log('   - Gold     → Gold API (10s)');
  console.log('   - Forex    → Exchange Rate API (30s)');
  console.log('   - Oil      → Oil Price API (60s)');
  console.log('   - Fallback → Database');
  await aggregatedDataSource.start();

  console.log('');

  // 启动 K 线刷新定时任务（每 5 秒检查一次）
  // 新版本 K 线引擎支持同时更新 1m、5m、15m，无需单独的聚合引擎
  console.log('5. Starting K-line flush timer (every 5s) with 1m/5m/15m support...');
  setInterval(async () => {
    // 先生成平盘K线，确保所有交易对都有连续的K线数据
    generateFlatCandles();
    
    const cachedCount = getCachedCandlesCount();
    if (cachedCount > 0) {
      await flushCandles();
    }
  }, 5000);

  console.log('');

  // 启动 Express HTTP 服务器（TradingView API + Ticker API）
  console.log('6. Starting HTTP server (TradingView API)...');
  const app = express();
  const port = 3000;

  // 中间件
  app.use(cors());
  app.use(express.json());

  // 注册 TradingView API 路由
  app.use('/tv', tradingviewRoutes);

  // Ticker API - 24h 统计
  app.get('/ticker/24hr', (req, res) => {
    const { symbol } = req.query;

    if (symbol) {
      // 获取单个交易对的24h统计
      const ticker = tickerEngine.getTicker(symbol as string);
      if (ticker) {
        res.json(ticker);
      } else {
        res.status(404).json({
          error: `Ticker not found for symbol: ${symbol}`
        });
      }
    } else {
      // 获取所有交易对的24h统计
      res.json(tickerEngine.getAllTickers());
    }
  });

  // OrderBook API - 深度数据
  app.get('/orderbook', (req, res) => {
    const { symbol, limit } = req.query;

    if (symbol) {
      // 获取单个交易对的深度数据
      const limitNum = limit ? parseInt(limit as string) : undefined;
      const orderBook = orderBookEngine.getOrderBook(symbol as string, limitNum);

      if (orderBook) {
        res.json(orderBook);
      } else {
        res.status(404).json({
          error: `OrderBook not found for symbol: ${symbol}`
        });
      }
    } else {
      // 获取所有交易对的深度数据
      const limitNum = limit ? parseInt(limit as string) : undefined;
      res.json(orderBookEngine.getAllOrderBooks(limitNum));
    }
  });

  // 健康检查接口
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: Date.now(),
      services: {
        websocket: 8081,
        http: port,
        database: 'connected'
      }
    });
  });

  // 启动 HTTP 服务器
  app.listen(port, () => {
    console.log(`🌐 HTTP server listening on port ${port}`);
    console.log(`📊 TradingView API available at http://localhost:${port}/tv`);
  });

  // 显示市场缓存状态（每 30 秒）
  setInterval(() => {
    const cacheSize = getCacheSize();
    console.log(`[Market Cache] 📊 Cached markets: ${cacheSize}`);
  }, 30000);

  // 显示 Redis 缓存状态（每 60 秒）
  setInterval(async () => {
    const { getCacheStats } = await import('./cache/redis-cache');
    const stats = await getCacheStats();
    console.log(`[Redis Cache] 📊 Stats: ${stats.ticker} tickers, ${stats.orderbook} orderbooks, ${stats.market} markets (total: ${stats.total})`);
  }, 60000);

  console.log('');
  console.log('✅ Market Collector Service is running!');
  console.log('📊 Aggregated Data Source (Crypto/Gold/Forex/Oil)');
  console.log('📈 Ticker Engine active (24h statistics)');
  console.log('📚 OrderBook Engine active (depth data)');
  console.log('🕯️  K-line engine active (1m/5m/15m intervals with flat candle generation)');
  console.log('💾 Redis Cache active (ticker/orderbook/market)');
  console.log('💾 Market cache active (in-memory)');
  console.log('📡 WebSocket server running on port 8081');
  console.log('🌐 HTTP server running on port 3000');
  console.log('📊 TradingView API available at http://localhost:3000/tv');
  console.log('📊 Ticker API available at http://localhost:3000/ticker/24hr');
  console.log('📚 OrderBook API available at http://localhost:3000/orderbook');
  console.log('');
  console.log('🔄 Data Source Refresh Rates:');
  console.log('   - Crypto (Binance WS):  Real-time');
  console.log('   - Gold (Gold API):      10 seconds');
  console.log('   - Forex (ExchangeRate): 30 seconds');
  console.log('   - Oil (Oil Price):     60 seconds');
  console.log('');
  console.log('Press Ctrl+C to stop.\n');
}

// 运行主程序
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
