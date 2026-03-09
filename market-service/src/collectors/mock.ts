import { getSupabase } from '../config/database';
import { updateCandle } from '../engine/kline-engine';
import { updateMarket } from '../cache/market-cache';
import { tickerEngine } from '../engine/ticker-engine';
import { orderBookEngine } from '../engine/orderbook-engine';

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
  }

  /**
   * 启动生成器
   */
  public async start(): Promise<void> {
    console.log('[MockDataGenerator] Starting mock data generator');
    console.log('[MockDataGenerator] Symbols:', this.symbols.join(', '));
    console.log('[MockDataGenerator] Interval:', this.interval / 1000, 'seconds');

    // ✅ 从数据库读取最新的 K 线收盘价
    await this.initializePricesFromDatabase();

    // 立即生成一次
    this.generateData();

    // 设置定时任务
    this.timer = setInterval(() => {
      this.generateData();
    }, this.interval);
  }

  /**
   * 从数据库初始化价格（读取最后一个 K 线的收盘价）
   */
  private async initializePricesFromDatabase(): Promise<void> {
    try {
      const supabase = getSupabase();

      for (const symbol of this.symbols) {
        // ✅ 查询该交易对的最新 K 线（按 open_time DESC）
        const { data, error } = await supabase
          .from('klines')
          .select('close')
          .eq('symbol', symbol)
          .order('open_time', { ascending: false })
          .limit(1);

        if (error) {
          console.error(`[MockDataGenerator] Failed to fetch last candle for ${symbol}:`, error.message);
          // 使用默认价格
          const defaultPrice = this.getDefaultPrice(symbol);
          this.prices.set(symbol, defaultPrice);
          console.log(`[MockDataGenerator] Using default price for ${symbol}: $${defaultPrice.toFixed(2)}`);
        } else if (data && data.length > 0) {
          // ✅ 使用数据库中的最后一个 close 价格
          const lastClose = data[0].close;
          this.prices.set(symbol, lastClose);
          console.log(`[MockDataGenerator] ✅ Loaded last close for ${symbol}: $${lastClose.toFixed(2)}`);
        } else {
          // 没有历史数据，使用默认价格
          const defaultPrice = this.getDefaultPrice(symbol);
          this.prices.set(symbol, defaultPrice);
          console.log(`[MockDataGenerator] No history data for ${symbol}, using default price: $${defaultPrice.toFixed(2)}`);
        }
      }
    } catch (error) {
      console.error('[MockDataGenerator] Error initializing prices from database:', error);
      // 使用默认价格
      const defaultPrices = this.getDefaultPrices();
      defaultPrices.forEach((price, symbol) => {
        this.prices.set(symbol, price);
      });
    }
  }

  /**
   * 获取默认价格（数据库没有数据时使用）
   */
  private getDefaultPrice(symbol: string): number {
    const defaults = this.getDefaultPrices();
    return defaults.get(symbol) || 100;
  }

  /**
   * 获取所有默认价格
   */
  private getDefaultPrices(): Map<string, number> {
    const defaults = new Map<string, number>();
    defaults.set('BTCUSDT', 67000);
    defaults.set('ETHUSDT', 3400);
    defaults.set('SOLUSDT', 145);
    return defaults;
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
      // ✅ 使用随机漫步算法，基于上一笔价格小幅波动
      const currentPrice = this.prices.get(symbol) || 0;
      const price = currentPrice;

      // ✅ 减小波动幅度到 0.05%（0.0005），避免 1 分钟内剧烈波动
      // 对于 BTC，0.05% 约为 $33，这是合理的 1 分钟波动
      const changePercent = (Math.random() - 0.5) * 0.001; // -0.05% 到 +0.05%
      const newPrice = price * (1 + changePercent);

      // ✅ 确保价格不会变成负数或零
      const safePrice = Math.max(newPrice, price * 0.5);

      // 更新价格（用于下一次生成）
      this.prices.set(symbol, safePrice);

      // 写入数据库
      await this.updateTicker(symbol, safePrice);

      // 生成模拟 OrderBook
      this.generateMockOrderBook(symbol, safePrice);

      console.log(`[MockDataGenerator] 📊 ${symbol}: $${safePrice.toFixed(2)} (${(changePercent * 100).toFixed(3)}%)`);
    }
  }

  /**
   * 生成模拟订单簿数据
   */
  private generateMockOrderBook(symbol: string, price: number): void {
    const depth = 20; // 20档深度
    const priceStep = price * 0.0001; // 0.01% 价格步长

    const bids: [number, number][] = [];
    const asks: [number, number][] = [];

    // 生成买盘（从当前价格向下）
    for (let i = 0; i < depth; i++) {
      const bidPrice = price * (1 - (i + 1) * 0.0002);
      const bidQuantity = Math.random() * 10 + 0.1;
      bids.push([bidPrice, bidQuantity]);
    }

    // 生成卖盘（从当前价格向上）
    for (let i = 0; i < depth; i++) {
      const askPrice = price * (1 + (i + 1) * 0.0002);
      const askQuantity = Math.random() * 10 + 0.1;
      asks.push([askPrice, askQuantity]);
    }

    // 更新 OrderBook Engine
    orderBookEngine.updateOrderBook(symbol, bids, asks, Date.now());
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

      // 更新 K 线（1分钟）
      const volume = Math.random() * 10;
      updateCandle(symbol, price, '1m', volume);

      // 更新市场缓存（内存）
      updateMarket(symbol, price, volume);

      // 更新 24h 统计（Ticker Engine）
      tickerEngine.updateTrade(symbol, price, volume);

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
