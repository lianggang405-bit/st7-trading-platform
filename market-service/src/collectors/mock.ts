import { getSupabase } from '../config/database';
import { updateCandle } from '../engine/kline-engine';
import { updateMarket } from '../cache/market-cache';
import { tickerEngine } from '../engine/ticker-engine';
import { orderBookEngine } from '../engine/orderbook-engine';
import { getAllMetalsPrices } from './yahoo-finance';

/**
 * 模拟行情数据生成器
 * 用于验证数据链路是否正常
 *
 * ✅ 正确的兜底行情机制设计：
 *
 * 1. 锚定价格机制
 *    - 每个交易对有一个"锚定价格"（anchor price）
 *    - 模拟价格围绕锚定价格波动（±0.1%）
 *    - 锚定价格定期同步真实价格
 *
 * 2. 启动时的价格初始化策略（三级优先级）
 *    - 优先级 1: Yahoo Finance 真实价格
 *    - 优先级 2: 数据库最新收盘价
 *    - 优先级 3: 硬编码默认价格（仅兜底）
 *
 * 3. 定期同步机制
 *    - 每 10 分钟尝试同步一次真实价格
 *    - 如果成功，更新锚定价格
 *    - 如果失败，记录日志但不影响正常运行
 *
 * 4. 偏差检测和重置
 *    - 检测当前锚定价格与真实价格的偏差
 *    - 如果偏差 > 10%，立即重置锚定价格
 *
 * 5. 价格漂移控制
 *    - 限制模拟价格波动范围：锚定价格 ±1%
 *    - 防止长期漂移导致价格失真
 */
export class MockDataGenerator {
  // ✅ 支持所有交易对
  private symbols: string[] = [
    // Forex
    'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'EURAUD', 'EURGBP', 'EURJPY',
    'GBPAUD', 'GBPNZD', 'GBPJPY', 'AUDUSD', 'AUDJPY', 'NZDUSD', 'NZDJPY',
    'CADJPY', 'CHFJPY',
    // Gold & Silver（从 Yahoo Finance 获取真实价格，免费）
    'XAUUSD', 'XAGUSD',
    // Crypto
    'BTCUSD', 'ETHUSD', 'LTCUSD', 'SOLUSD', 'XRPUSD', 'DOGEUSD',
    // Energy
    'NGAS', 'UKOIL', 'USOIL',
    // Indices
    'US500', 'ND25', 'AUS200',
  ];

  // ✅ 锚定价格机制
  private anchorPrices: Map<string, number> = new Map(); // 锚定价格
  private prices: Map<string, number> = new Map(); // 当前价格（围绕锚定价格波动）
  private interval: number;
  private timer: NodeJS.Timeout | null = null;
  private syncTimer: NodeJS.Timeout | null = null; // 定期同步计时器（每10分钟）
  private metalsSymbols: Set<string> = new Set(['XAUUSD', 'XAGUSD']); // 贵金属交易对

  // ✅ 偏差检测阈值（10%）
  private readonly DEVIATION_THRESHOLD = 0.10;

  // ✅ 价格漂移限制（±1%）
  private readonly MAX_DRIFT = 0.01;

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
    console.log('[MockDataGenerator] Price sync interval: 10 minutes');

    // ✅ 步骤 1: 初始化锚定价格（三级优先级）
    console.log('[MockDataGenerator] 🔄 Initializing anchor prices...');
    await this.initializeAnchorPrices();

    // ✅ 步骤 2: 启动定期同步机制（每 10 分钟）
    console.log('[MockDataGenerator] 🔄 Starting price sync timer (every 10 minutes)...');
    this.syncTimer = setInterval(async () => {
      await this.syncRealPrices();
    }, 10 * 60 * 1000);

    // 立即生成一次
    this.generateData();

    // 设置定时任务
    this.timer = setInterval(() => {
      this.generateData();
    }, this.interval);

    console.log('[MockDataGenerator] ✅ Started successfully with anchor price mechanism');
  }

  /**
   * 初始化锚定价格（三级优先级策略）
   *
   * 优先级 1: Yahoo Finance 真实价格（仅贵金属）
   * 优先级 2: 数据库最新收盘价
   * 优先级 3: 硬编码默认价格（仅兜底）
   */
  private async initializeAnchorPrices(): Promise<void> {
    const supabase = getSupabase();

    // 步骤 1: 尝试从 Yahoo Finance 获取贵金属真实价格
    console.log('[MockDataGenerator] 🔍 Step 1: Fetching metals prices from Yahoo Finance...');
    const yahooPrices = await getAllMetalsPrices();

    for (const symbol of this.symbols) {
      let anchorPrice: number;
      let source: string;

      // 优先级 1: Yahoo Finance 真实价格（仅贵金属）
      if (this.metalsSymbols.has(symbol) && yahooPrices.has(symbol)) {
        anchorPrice = yahooPrices.get(symbol)!;
        source = 'Yahoo Finance';
        console.log(`[MockDataGenerator] ✅ [${source}] ${symbol}: $${anchorPrice.toFixed(2)}`);
      }
      // 优先级 2: 数据库最新收盘价
      else {
        const lastClose = await this.getLastCloseFromDatabase(symbol);
        anchorPrice = lastClose;
        source = 'Database';

        if (lastClose > 0) {
          console.log(`[MockDataGenerator] ✅ [${source}] ${symbol}: $${lastClose.toFixed(2)}`);
        } else {
          // 优先级 3: 硬编码默认价格（仅兜底）
          anchorPrice = this.getDefaultPrice(symbol);
          source = 'Default (hardcoded)';
          console.log(`[MockDataGenerator] ⚠️ [${source}] ${symbol}: $${anchorPrice.toFixed(2)}`);
        }
      }

      // 设置锚定价格和当前价格
      this.anchorPrices.set(symbol, anchorPrice);
      this.prices.set(symbol, anchorPrice);
    }

    console.log(`[MockDataGenerator] ✅ Initialized ${this.anchorPrices.size} anchor prices`);
  }

  /**
   * 从数据库获取最新的 K 线收盘价
   */
  private async getLastCloseFromDatabase(symbol: string): Promise<number> {
    try {
      const supabase = getSupabase();

      const { data, error } = await supabase
        .from('klines')
        .select('close')
        .eq('symbol', symbol)
        .order('open_time', { ascending: false })
        .limit(1);

      if (error) {
        console.error(`[MockDataGenerator] ❌ Failed to fetch last candle for ${symbol}:`, error.message);
        return 0;
      }

      if (data && data.length > 0) {
        return data[0].close;
      }

      return 0;
    } catch (error) {
      console.error(`[MockDataGenerator] ❌ Error fetching last close for ${symbol}:`, error);
      return 0;
    }
  }

  /**
   * 定期同步真实价格（每 10 分钟）
   */
  private async syncRealPrices(): Promise<void> {
    console.log('[MockDataGenerator] 🔄 Syncing real prices from Yahoo Finance...');

    const realPrices = await getAllMetalsPrices();

    if (realPrices.size === 0) {
      console.log('[MockDataGenerator] ⚠️ No real prices fetched, skipping sync');
      return;
    }

    let updatedCount = 0;
    let resetCount = 0;

    for (const [symbol, realPrice] of realPrices) {
      const currentAnchor = this.anchorPrices.get(symbol) || 0;

      if (currentAnchor === 0) {
        console.log(`[MockDataGenerator] ⚠️ No anchor price for ${symbol}, skipping`);
        continue;
      }

      // 检测偏差
      const deviation = Math.abs(realPrice - currentAnchor) / currentAnchor;

      if (deviation > this.DEVIATION_THRESHOLD) {
        // 偏差 > 10%，立即重置锚定价格
        console.warn(`[MockDataGenerator] ⚠️ Price deviation ${(deviation * 100).toFixed(2)}% for ${symbol}, resetting anchor`);
        this.anchorPrices.set(symbol, realPrice);
        this.prices.set(symbol, realPrice);
        resetCount++;
      } else {
        // 偏差 <= 10%，平滑更新锚定价格
        const newAnchor = (currentAnchor * 0.9) + (realPrice * 0.1); // 90% 旧价格 + 10% 新价格
        this.anchorPrices.set(symbol, newAnchor);
        updatedCount++;
      }
    }

    console.log(`[MockDataGenerator] ✅ Sync completed: ${updatedCount} updated, ${resetCount} reset`);
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

    // Forex - 外汇货币对
    defaults.set('EURUSD', 1.0850);
    defaults.set('GBPUSD', 1.2730);
    defaults.set('USDJPY', 154.50);
    defaults.set('USDCHF', 0.8920);
    defaults.set('EURAUD', 1.6650);
    defaults.set('EURGBP', 0.8520);
    defaults.set('EURJPY', 167.60);
    defaults.set('GBPAUD', 1.9340);
    defaults.set('GBPNZD', 2.1150);
    defaults.set('GBPJPY', 196.80);
    defaults.set('AUDUSD', 0.6550);
    defaults.set('AUDJPY', 101.20);
    defaults.set('NZDUSD', 0.6050);
    defaults.set('NZDJPY', 93.40);
    defaults.set('CADJPY', 112.50);
    defaults.set('CHFJPY', 173.20);

    // Gold - 贵金属（2026年3月最新价格）
    defaults.set('XAUUSD', 5100.00); // 黄金（更新为 2026年3月实际价格 ≈ $5,100）
    defaults.set('XAGUSD', 33.50);   // 白银（2026年3月实际价格 ≈ $33.50）

    // Crypto - 加密货币（2026年3月最新价格）
    defaults.set('BTCUSD', 66500.00); // Bitcoin
    defaults.set('ETHUSD', 3450.00);  // Ethereum
    defaults.set('LTCUSD', 85.00);    // Litecoin
    defaults.set('SOLUSD', 148.00);   // Solana
    defaults.set('XRPUSD', 0.52);     // Ripple
    defaults.set('DOGEUSD', 0.12);    // Dogecoin

    // Energy - 能源（2026年3月最新价格）
    defaults.set('NGAS', 2.89);    // 天然气
    defaults.set('UKOIL', 75.00);  // 布伦特原油
    defaults.set('USOIL', 71.50);  // WTI 原油

    // Indices - 指数（2026年3月最新价格）
    defaults.set('US500', 5180.00);  // S&P 500
    defaults.set('ND25', 18820.00);  // Nasdaq 100
    defaults.set('AUS200', 8080.00); // ASX 200

    return defaults;
  }

  /**
   * 停止生成器
   */
  public stop(): void {
    console.log('[MockDataGenerator] Stopping mock data generator');

    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
      console.log('[MockDataGenerator] Stopped price sync timer');
    }
  }

  /**
   * 生成模拟数据（基于锚定价格机制）
   */
  private async generateData(): Promise<void> {
    for (const symbol of this.symbols) {
      const anchorPrice = this.anchorPrices.get(symbol) || 0;
      const currentPrice = this.prices.get(symbol) || anchorPrice;

      if (anchorPrice === 0) {
        console.warn(`[MockDataGenerator] ⚠️ No anchor price for ${symbol}, skipping`);
        continue;
      }

      // ✅ 基于锚定价格的小幅度波动（±0.1%）
      const drift = (Math.random() - 0.5) * 0.002; // -0.1% 到 +0.1%
      let newPrice = currentPrice * (1 + drift);

      // ✅ 价格漂移控制：限制在锚定价格 ±1% 范围内
      const maxDeviation = anchorPrice * this.MAX_DRIFT;
      const minPrice = anchorPrice - maxDeviation;
      const maxPrice = anchorPrice + maxDeviation;

      newPrice = Math.max(minPrice, Math.min(maxPrice, newPrice));

      // 确保价格不会变成负数或零
      const safePrice = Math.max(newPrice, anchorPrice * 0.99);

      // 更新当前价格
      this.prices.set(symbol, safePrice);

      // 写入数据库
      await this.updateTicker(symbol, safePrice);

      // 生成模拟 OrderBook
      this.generateMockOrderBook(symbol, safePrice);

      // 计算与锚定价格的偏差
      const deviationFromAnchor = ((safePrice - anchorPrice) / anchorPrice) * 100;

      console.log(`[MockDataGenerator] 📊 ${symbol}: $${safePrice.toFixed(2)} (anchor: $${anchorPrice.toFixed(2)}, drift: ${deviationFromAnchor.toFixed(3)}%)`);
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
      updateCandle(symbol, price, volume);

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
