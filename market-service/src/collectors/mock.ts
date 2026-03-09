import { supabase } from '../config/database';

/**
 * 模拟行情数据生成器
 * 用于验证数据链路是否正常
 */
export class MockDataGenerator {
  private symbols: string[] = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];
  private prices: Map<string, number> = new Map();
  private interval: number;
  private timer: NodeJS.Timeout | null = null;

  constructor(interval: number = 3000) {
    this.interval = interval;

    // 初始化基础价格
    this.prices.set('BTCUSDT', 67000);
    this.prices.set('ETHUSDT', 3400);
    this.prices.set('SOLUSDT', 145);
  }

  /**
   * 启动生成器
   */
  public start(): void {
    console.log('[MockDataGenerator] Starting mock data generator');
    console.log('[MockDataGenerator] Symbols:', this.symbols.join(', '));
    console.log('[MockDataGenerator] Interval:', this.interval / 1000, 'seconds');

    // 立即生成一次
    this.generateData();

    // 设置定时任务
    this.timer = setInterval(() => {
      this.generateData();
    }, this.interval);
  }

  /**
   * 停止生成器
   */
  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log('[MockDataGenerator] Stopped mock data generator');
    }
  }

  /**
   * 生成模拟数据
   */
  private async generateData(): Promise<void> {
    for (const symbol of this.symbols) {
      // 模拟价格波动（-1% 到 +1%）
      const currentPrice = this.prices.get(symbol) || 0;
      const changePercent = (Math.random() - 0.5) * 0.02; // -1% 到 +1%
      const newPrice = currentPrice * (1 + changePercent);

      // 更新价格
      this.prices.set(symbol, newPrice);

      // 写入数据库
      await this.updateTicker(symbol, newPrice);

      console.log(`[MockDataGenerator] 📊 ${symbol}: $${newPrice.toFixed(2)} (${(changePercent * 100).toFixed(2)}%)`);
    }
  }

  /**
   * 更新 tickers 表
   */
  private async updateTicker(symbol: string, price: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('tickers')
        .upsert({
          symbol,
          price,
          bid: price * 0.999, // 模拟买价
          ask: price * 1.001, // 模拟卖价
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'symbol'
        });

      if (error) {
        console.error(`[MockDataGenerator] Failed to update ticker:`, error.message);
      } else {
        console.log(`[MockDataGenerator] ✅ Updated ticker: ${symbol} = $${price.toFixed(2)}`);
      }
    } catch (error) {
      console.error('[MockDataGenerator] Error updating ticker:', error);
    }
  }
}

// 如果直接运行此文件
if (require.main === module) {
  const generator = new MockDataGenerator(3000);
  generator.start();

  // 优雅退出
  process.on('SIGINT', () => {
    console.log('\n[MockDataGenerator] Received SIGINT, shutting down...');
    generator.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n[MockDataGenerator] Received SIGTERM, shutting down...');
    generator.stop();
    process.exit(0);
  });
}
