import WebSocket from 'ws';
import { getSupabase } from '../config/database';
import { TickerData, BinanceTradeMessage } from '../types';

/**
 * Binance 行情采集器
 * 获取 BTCUSDT 实时价格
 */
export class BinanceCollector {
  private ws: WebSocket | null = null;
  private symbol: string = 'BTCUSDT';
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  constructor(symbol: string = 'BTCUSDT') {
    this.symbol = symbol;
  }

  /**
   * 启动采集器
   */
  public start(): void {
    console.log(`[BinanceCollector] Starting collector for ${this.symbol}`);
    this.connect();
  }

  /**
   * 停止采集器
   */
  public stop(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      console.log(`[BinanceCollector] Stopped collector for ${this.symbol}`);
    }
  }

  /**
   * 连接 Binance WebSocket
   */
  private connect(): void {
    const wsUrl = `wss://stream.binance.com:9443/ws/${this.symbol.toLowerCase()}@trade`;

    console.log(`[BinanceCollector] Connecting to ${wsUrl}`);

    this.ws = new WebSocket(wsUrl);

    this.ws.on('open', () => {
      console.log(`[BinanceCollector] ✅ Connected to Binance WebSocket`);
      this.reconnectAttempts = 0;
    });

    this.ws.on('message', async (data: WebSocket.Data) => {
      await this.handleMessage(data);
    });

    this.ws.on('error', (error: Error) => {
      console.error(`[BinanceCollector] ❌ WebSocket error:`, error.message);
    });

    this.ws.on('close', () => {
      console.log(`[BinanceCollector] WebSocket connection closed`);
      this.handleReconnect();
    });
  }

  /**
   * 处理 WebSocket 消息
   */
  private async handleMessage(data: WebSocket.Data): Promise<void> {
    try {
      const msg: BinanceTradeMessage = JSON.parse(data.toString());

      // 解析价格
      const price = parseFloat(msg.p);
      const volume = parseFloat(msg.q);

      console.log(`[BinanceCollector] 📊 ${this.symbol}: $${price.toFixed(2)} (Vol: ${volume})`);

      // 更新 tickers 表
      await this.updateTicker(this.symbol, price, volume);

      // TODO: 更新 market_cache 表（待创建）
      // await this.updateMarketCache(this.symbol, price);

    } catch (error) {
      console.error('[BinanceCollector] Error handling message:', error);
    }
  }

  /**
   * 更新 tickers 表
   */
  private async updateTicker(symbol: string, price: number, volume: number): Promise<void> {
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('tickers')
        .upsert({
          symbol,
          price,
          volume,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'symbol'
        });

      if (error) {
        console.error('[BinanceCollector] Failed to update ticker:', error.message);
      } else {
        console.log(`[BinanceCollector] ✅ Updated ticker: ${symbol} = $${price.toFixed(2)}`);
      }
    } catch (error) {
      console.error('[BinanceCollector] Error updating ticker:', error);
    }
  }

  /**
   * 处理重连
   */
  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`[BinanceCollector] Max reconnection attempts (${this.maxReconnectAttempts}) reached. Stopping.`);
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // 指数退避，最大 30 秒

    console.log(`[BinanceCollector] Attempting to reconnect in ${delay / 1000}s (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      this.connect();
    }, delay);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  const collector = new BinanceCollector('BTCUSDT');
  collector.start();

  // 优雅退出
  process.on('SIGINT', () => {
    console.log('\n[BinanceCollector] Received SIGINT, shutting down...');
    collector.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n[BinanceCollector] Received SIGTERM, shutting down...');
    collector.stop();
    process.exit(0);
  });
}
