import WebSocket from 'ws';

/**
 * WebSocket 测试客户端
 */
class WebSocketTestClient {
  private ws: WebSocket;
  private url: string;

  constructor(url: string = 'ws://localhost:8081') {
    this.url = url;
    this.ws = new WebSocket(url);
  }

  /**
   * 启动测试
   */
  public start(): void {
    console.log('🧪 Starting WebSocket Test Client...\n');

    this.ws.on('open', () => {
      console.log('✅ Connected to WebSocket server\n');
      this.runTests();
    });

    this.ws.on('message', (data: WebSocket.Data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(message);
      } catch (error) {
        console.log('📩 Raw message:', data.toString());
      }
    });

    this.ws.on('error', (error: Error) => {
      console.error('❌ WebSocket error:', error.message);
      process.exit(1);
    });

    this.ws.on('close', () => {
      console.log('\n🔌 Disconnected from server');
      process.exit(0);
    });
  }

  /**
   * 运行测试用例
   */
  private runTests(): void {
    console.log('📋 Running tests...\n');

    // 测试 1: 订阅单个交易对
    setTimeout(() => {
      console.log('Test 1: Subscribe to BTCUSDT');
      this.ws.send(JSON.stringify({
        type: 'subscribe',
        symbol: 'BTCUSDT'
      }));
    }, 1000);

    // 测试 2: 订阅所有交易对
    setTimeout(() => {
      console.log('\nTest 2: Subscribe to all markets');
      this.ws.send(JSON.stringify({
        type: 'subscribe_all'
      }));
    }, 5000);

    // 测试 3: 获取所有行情
    setTimeout(() => {
      console.log('\nTest 3: Get all markets');
      this.ws.send(JSON.stringify({
        type: 'get_markets'
      }));
    }, 8000);

    // 测试 4: 获取 K 线
    setTimeout(() => {
      console.log('\nTest 4: Get BTCUSDT 1m K-line');
      this.ws.send(JSON.stringify({
        type: 'get_kline',
        symbol: 'BTCUSDT',
        interval: '1m'
      }));
    }, 11000);

    // 测试 5: 取消订阅
    setTimeout(() => {
      console.log('\nTest 5: Unsubscribe from BTCUSDT');
      this.ws.send(JSON.stringify({
        type: 'unsubscribe',
        symbol: 'BTCUSDT'
      }));
    }, 14000);

    // 结束测试
    setTimeout(() => {
      console.log('\n✅ All tests completed!');
      console.log('Closing connection in 5 seconds...');
      setTimeout(() => {
        this.ws.close();
      }, 5000);
    }, 18000);
  }

  /**
   * 处理消息
   */
  private handleMessage(message: any): void {
    switch (message.type) {
      case 'welcome':
        console.log('👋 Server:', message.message);
        break;

      case 'ticker':
        console.log('📊 Ticker:', message.data.symbol, '$' + message.data.price.toFixed(2));
        break;

      case 'ticker_update':
        const symbols = Object.keys(message.data);
        console.log('🔄 Ticker Update:', symbols.join(', '));
        break;

      case 'tickers':
        console.log('📈 All Tickers:', Object.keys(message.data).length, 'symbols');
        break;

      case 'subscribed':
        console.log('✅ Subscribed to:', message.symbol);
        break;

      case 'subscribed_all':
        console.log('✅ Subscribed to all:', message.count, 'symbols');
        break;

      case 'unsubscribed':
        console.log('❌ Unsubscribed from:', message.symbol);
        break;

      case 'kline':
        if (message.data) {
          console.log('🕯️  K-line:', message.data.symbol, 'O=' + message.data.open.toFixed(2), 'C=' + message.data.close.toFixed(2));
        } else {
          console.log('🕯️  K-line: No data available yet');
        }
        break;

      case 'error':
        console.error('❌ Error:', message.message);
        break;

      default:
        console.log('📩 Unknown message type:', message.type);
    }
  }
}

// 启动测试客户端
const client = new WebSocketTestClient('ws://localhost:8081');
client.start();
