import axios from 'axios';
import { getSupabase } from '../config/database';

/**
 * Binance HTTP API 行情采集器
 * 使用 REST API 获取价格（兼容性更好）
 */
export class BinanceHttpCollector {
  private symbol: string;
  private interval: number; // 采集间隔（毫秒）
  private timer: NodeJS.Timeout | null = null;

  constructor(symbol: string = 'BTCUSDT', interval: number = 5000) {
    this.symbol = symbol;
    this.interval = interval;
  }

  /**
   * 启动采集器
   */
  public start(): void {
    console.log(`[BinanceHttpCollector] Starting HTTP collector for ${this.symbol}`);
    console.log(`[BinanceHttpCollector] Fetch interval: ${this.interval / 1000}s`);

    // 立即执行一次
    this.fetchPrice();

    // 设置定时任务
    this.timer = setInterval(() => {
      this.fetchPrice();
    }, this.interval);
  }

  /**
   * 停止采集器
   */
  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log(`[BinanceHttpCollector] Stopped collector for ${this.symbol}`);
    }
  }

  /**
   * 获取价格
   */
  private async fetchPrice(): Promise<void> {
    try {
      const url = `https://api.binance.com/api/v3/ticker/price?symbol=${this.symbol}`;

      const response = await axios.get(url, {
        timeout: 5000
      });

      const { symbol, price } = response.data;

      console.log(`[BinanceHttpCollector] 📊 ${symbol}: $${parseFloat(price).toFixed(2)}`);

      // 更新数据库
      await this.updateTicker(symbol, parseFloat(price));

    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(`[BinanceHttpCollector] ❌ API error: ${error.message}`);
        if (error.response) {
          console.error(`[BinanceHttpCollector] Status: ${error.response.status}`);
        }
      } else {
        console.error('[BinanceHttpCollector] Error:', error);
      }
    }
  }

  /**
   * 更新 tickers 表
   */
  private async updateTicker(symbol: string, price: number): Promise<void> {
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('tickers')
        .upsert({
          symbol,
          price,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'symbol'
        });

      if (error) {
        console.error(`[BinanceHttpCollector] Failed to update ticker:`, error.message);
      } else {
        console.log(`[BinanceHttpCollector] ✅ Updated ticker: ${symbol} = $${price.toFixed(2)}`);
      }
    } catch (error) {
      console.error('[BinanceHttpCollector] Error updating ticker:', error);
    }
  }
}

// 如果直接运行此文件
if (require.main === module) {
  const collector = new BinanceHttpCollector('BTCUSDT', 5000);
  collector.start();

  // 优雅退出
  process.on('SIGINT', () => {
    console.log('\n[BinanceHttpCollector] Received SIGINT, shutting down...');
    collector.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n[BinanceHttpCollector] Received SIGTERM, shutting down...');
    collector.stop();
    process.exit(0);
  });
}
