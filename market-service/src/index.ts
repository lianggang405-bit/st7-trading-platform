import dotenv from 'dotenv';
dotenv.config();

// 调试：打印环境变量
console.log('[Debug] SUPABASE_URL:', process.env.SUPABASE_URL ? 'SET' : 'NOT SET');
console.log('[Debug] SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET');

import express from 'express';
import cors from 'cors';
import { testConnection } from './config/database';
import { MockDataGenerator } from './collectors/mock';
import { flushCandles, getCachedCandlesCount } from './engine/kline-engine';
import { getCacheSize } from './cache/market-cache';
import { klineAggregator } from './engine/kline-aggregator';
import { tickerEngine } from './engine/ticker-engine';
import tradingviewRoutes from './tradingview/routes';

// 注意：BinanceTradeCollector 已实现，但在受限网络环境中无法使用
// 在有网络环境中，可以替换为：
// import { BinanceTradeCollector } from './collectors/binance-trade';
// const binanceCollector = new BinanceTradeCollector(['BTCUSDT', 'ETHUSDT', 'SOLUSDT']);
// binanceCollector.start();

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

  // 启动 Ticker Engine（24h 统计）
  console.log('2. Starting Ticker Engine (24h statistics)...');
  await tickerEngine.loadFromDatabase();

  console.log('');

  // 启动模拟数据生成器（受限网络环境，使用 Mock 数据）
  console.log('3. Starting mock data generator (BinanceTradeCollector available in production)...');
  const mockGenerator = new MockDataGenerator(3000);
  mockGenerator.start();

  console.log('');

  // 启动 K 线刷新定时任务（每 5 秒检查一次）
  console.log('4. Starting K-line flush timer (every 5s)...');
  setInterval(async () => {
    const cachedCount = getCachedCandlesCount();
    if (cachedCount > 0) {
      console.log(`[Timer] Flushing ${cachedCount} cached candles...`);
      await flushCandles();
    }
  }, 5000);

  console.log('');

  // 启动 K 线聚合引擎（每 30 秒聚合一次）
  console.log('5. Starting K-line aggregation engine (every 30s)...');
  klineAggregator.start();

  console.log('');

  // 启动 Express HTTP 服务器（TradingView API + Ticker API）
  console.log('4. Starting HTTP server (TradingView API)...');
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

  console.log('');
  console.log('✅ Market Collector Service is running!');
  console.log('📊 Collecting mock market data (production: BinanceTradeCollector available)');
  console.log('📈 Ticker Engine active (24h statistics)');
  console.log('🕯️  K-line engine active (1m interval)');
  console.log('🔄 K-line aggregation engine active (1m → 5m → 15m → 1h → 4h → 1d)');
  console.log('📡 WebSocket server running on port 8081');
  console.log('🌐 HTTP server running on port 3000');
  console.log('📊 TradingView API available at http://localhost:3000/tv');
  console.log('📊 Ticker API available at http://localhost:3000/ticker/24hr');
  console.log('💾 Market cache active');
  console.log('Press Ctrl+C to stop.\n');
}

// 运行主程序
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
