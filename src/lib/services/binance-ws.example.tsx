/**
 * Binance WebSocket 服务使用示例
 *
 * 本文件展示如何使用 Binance WebSocket 服务
 */

import { binanceWS } from './binance-ws';
import BinanceWebSocketService, {
  ConnectionState,
  Subscription,
  MarketTicker,
  Kline,
} from './binance-ws';

// ==================== 示例 1: 基本连接 ====================

function example1_basicConnection() {
  console.log('=== 示例 1: 基本连接 ===');

  // 监听连接状态变化
  binanceWS.onConnection((state) => {
    console.log('Connection state:', state);
  });

  // 监听错误
  binanceWS.onError((error) => {
    console.error('Error:', error);
  });

  // 连接到 Binance WebSocket
  binanceWS.connect();
}

// ==================== 示例 2: 订阅实时行情 ====================

function example2_subscribeToTicker() {
  console.log('=== 示例 2: 订阅实时行情 ===');

  // 订阅 BTCUSDT 和 ETHUSDT 的实时行情
  const subscription: Subscription = {
    type: 'ticker',
    symbols: ['BTCUSDT', 'ETHUSDT'],
  };

  // 添加消息处理器
  binanceWS.onMessage('24hrTicker', (data: MarketTicker) => {
    console.log(`Ticker Update: ${data.symbol}`);
    console.log(`  Price: ${data.lastPrice}`);
    console.log(`  Change: ${data.priceChangePercent}%`);
    console.log(`  Volume: ${data.volume}`);
  });

  // 订阅
  binanceWS.subscribe(subscription);
}

// ==================== 示例 3: 订阅 K 线数据 ====================

function example3_subscribeToKline() {
  console.log('=== 示例 3: 订阅 K 线数据 ===');

  // 订阅 BTCUSDT 的 1 分钟 K 线
  const subscription: Subscription = {
    type: 'kline',
    symbols: ['BTCUSDT'],
    interval: '1m',
  };

  // 添加消息处理器
  binanceWS.onMessage('kline', (data: Kline) => {
    console.log(`Kline Update: ${data.symbol}`);
    console.log(`  Interval: ${data.interval}`);
    console.log(`  Open: ${data.open}`);
    console.log(`  High: ${data.high}`);
    console.log(`  Low: ${data.low}`);
    console.log(`  Close: ${data.close}`);
    console.log(`  Volume: ${data.volume}`);
  });

  // 订阅
  binanceWS.subscribe(subscription);
}

// ==================== 示例 4: 订阅深度数据 ====================

function example4_subscribeToDepth() {
  console.log('=== 示例 4: 订阅深度数据 ===');

  // 订阅 BTCUSDT 的深度数据
  const subscription: Subscription = {
    type: 'depth',
    symbols: ['BTCUSDT'],
  };

  // 添加消息处理器
  binanceWS.onMessage('depthUpdate', (data) => {
    console.log('Depth Update:', data);
  });

  // 订阅
  binanceWS.subscribe(subscription);
}

// ==================== 示例 5: 订阅实时交易 ====================

function example5_subscribeToTrade() {
  console.log('=== 示例 5: 订阅实时交易 ===');

  // 订阅 BTCUSDT 的实时交易
  const subscription: Subscription = {
    type: 'trade',
    symbols: ['BTCUSDT'],
  };

  // 添加消息处理器
  binanceWS.onMessage('trade', (data) => {
    console.log('Trade Update:', data);
  });

  // 订阅
  binanceWS.subscribe(subscription);
}

// ==================== 示例 6: 取消订阅 ====================

function example6_unsubscribe() {
  console.log('=== 示例 6: 取消订阅 ===');

  const subscription: Subscription = {
    type: 'ticker',
    symbols: ['BTCUSDT'],
  };

  // 取消订阅
  binanceWS.unsubscribe(subscription);
}

// ==================== 示例 7: 断开连接 ====================

function example7_disconnect() {
  console.log('=== 示例 7: 断开连接 ===');

  // 断开连接
  binanceWS.disconnect();
}

// ==================== 示例 8: 自定义配置 ====================

function example8_customConfig() {
  console.log('=== 示例 8: 自定义配置 ===');

  // 创建自定义配置的实例
  const customService = new BinanceWebSocketService({
    endpoint: 'testnet', // 使用测试网
    apiKey: 'your-api-key',
    secretKey: 'your-secret-key',
    autoReconnect: true,
    pingInterval: 15000, // 15秒
    pongTimeout: 50000, // 50秒
  });

  // 使用自定义服务
  customService.connect();
}

// ==================== 示例 9: 完整流程 ====================

async function example9_completeFlow() {
  console.log('=== 示例 9: 完整流程 ===');

  // 1. 设置事件监听器
  binanceWS.onConnection((state) => {
    console.log('Connection state changed:', state);

    if (state === 'connected') {
      // 连接成功后订阅
      const subscription: Subscription = {
        type: 'ticker',
        symbols: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'],
      };
      binanceWS.subscribe(subscription);
    }
  });

  binanceWS.onMessage('24hrTicker', (data: MarketTicker) => {
    console.log(`${data.symbol}: $${data.lastPrice} (${data.priceChangePercent}%)`);
  });

  // 2. 连接
  binanceWS.connect();

  // 3. 等待一段时间
  await new Promise(resolve => setTimeout(resolve, 30000));

  // 4. 取消订阅
  binanceWS.unsubscribe({
    type: 'ticker',
    symbols: ['SOLUSDT'],
  });

  // 5. 断开连接
  await new Promise(resolve => setTimeout(resolve, 5000));
  binanceWS.disconnect();
}

// ==================== 示例 10: React Hook ====================

import { useEffect, useState, useRef } from 'react';

function useBinanceWebSocket(symbols: string[]) {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [tickers, setTickers] = useState<Record<string, MarketTicker>>({});
  const serviceRef = useRef<BinanceWebSocketService | null>(null);

  useEffect(() => {
    // 创建服务实例
    const service = new BinanceWebSocketService({
      autoReconnect: true,
    });

    serviceRef.current = service;

    // 监听连接状态
    service.onConnection((state) => {
      setConnectionState(state);
    });

    // 监听行情数据
    service.onMessage('24hrTicker', (data: MarketTicker) => {
      setTickers(prev => ({
        ...prev,
        [data.symbol]: data,
      }));
    });

    // 连接
    service.connect();

    // 订阅
    const subscription: Subscription = {
      type: 'ticker',
      symbols,
    };
    service.subscribe(subscription);

    // 清理
    return () => {
      service.unsubscribe(subscription);
      service.disconnect();
    };
  }, [symbols]);

  return { connectionState, tickers };
}

// 使用示例
function TradingDashboard() {
  const { connectionState, tickers } = useBinanceWebSocket(['BTCUSDT', 'ETHUSDT']);

  return (
    <div>
      <h1>Trading Dashboard</h1>
      <p>Connection: {connectionState}</p>
      <div>
        {Object.entries(tickers).map(([symbol, ticker]) => (
          <div key={symbol}>
            <h3>{symbol}</h3>
            <p>Price: ${ticker.lastPrice}</p>
            <p>Change: {ticker.priceChangePercent}%</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== 导出示例 ====================

export {
  example1_basicConnection,
  example2_subscribeToTicker,
  example3_subscribeToKline,
  example4_subscribeToDepth,
  example5_subscribeToTrade,
  example6_unsubscribe,
  example7_disconnect,
  example8_customConfig,
  example9_completeFlow,
  useBinanceWebSocket,
  TradingDashboard,
};
