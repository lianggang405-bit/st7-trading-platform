/**
 * 历史数据生成器
 * 为所有交易对生成 7 天的 1 分钟 K 线历史数据
 */

import 'dotenv/config';
import { getSupabase } from '../src/config/database';

// 配置
const DAYS_TO_GENERATE = 1; // 先测试 1 天
const MINUTES_PER_DAY = 24 * 60;
const TOTAL_CANDLES = DAYS_TO_GENERATE * MINUTES_PER_DAY; // 1440

// 交易对起始价格
const SYMBOL_PRICES: Record<string, number> = {
  // 外汇
  'EURUSD': 1.09,
  'GBPUSD': 1.27,
  'USDJPY': 150.0,
  'CHFUSD': 1.13,
  'AUDUSD': 0.65,
  'NZDUSD': 0.61,
  'CADUSD': 0.73,

  // 黄金
  'XAUUSD': 5200.0,
  'XAGUSD': 88.5,
  'XPTUSD': 2210.0,
  'XPDUSD': 1694.0,

  // 原油
  'USOIL': 78.5,
  'UKOIL': 83.0,
  'NGAS': 2.1,
};

interface SymbolPrice {
  symbol: string;
  price: number;
}

/**
 * 生成随机波动
 * @param basePrice 基础价格
 * @param volatility 波动率（0.001 = 0.1%）
 */
function generateRandomPrice(basePrice: number, volatility = 0.002): number {
  const change = (Math.random() - 0.5) * 2 * volatility * basePrice;
  return basePrice + change;
}

/**
 * 生成 1 分钟 K 线数据
 * @param symbol 交易对
 * @param startPrice 起始价格
 * @param startTime 开始时间
 * @param count K 线数量
 */
function generate1mCandles(
  symbol: string,
  startPrice: number,
  startTime: number,
  count: number
): Array<{
  symbol: string;
  interval: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  open_time: string;
  close_time: string;
}> {
  const candles = [];
  let currentPrice = startPrice;
  let currentTime = startTime;

  for (let i = 0; i < count; i++) {
    // 生成开盘价（基于上一根的收盘价）
    const open = currentPrice;

    // 生成高低价（随机波动）
    const volatility = Math.random() * 0.001 + 0.0005; // 0.05% - 0.15%
    const high = open + Math.random() * volatility * open;
    const low = open - Math.random() * volatility * open;

    // 生成收盘价（在高低价之间）
    const close = low + Math.random() * (high - low);

    // 生成成交量（随机）
    const volume = Math.floor(Math.random() * 1000) + 100;

    // 时间戳（每 1 分钟）
    const openTimeMs = currentTime;
    const closeTimeMs = currentTime + 60 * 1000;

    candles.push({
      symbol,
      interval: '1m',
      open,
      high,
      low,
      close,
      volume,
      open_time: openTimeMs,
      close_time: closeTimeMs,
    });

    // 更新当前价格和时间
    currentPrice = close;
    currentTime += 60 * 1000;
  }

  return candles;
}

/**
 * 获取所有交易对和当前价格
 */
async function getSymbolsAndPrices(): Promise<SymbolPrice[]> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('symbols')
    .select('symbol');

  if (error) {
    console.error('Error fetching symbols:', error);
    return [];
  }

  return data.map((s: any) => {
    // 使用硬编码价格，如果没有则使用默认价格
    const price = SYMBOL_PRICES[s.symbol] || 100.0;
    return {
      symbol: s.symbol,
      price,
    };
  });
}

/**
 * 批量插入 K 线数据
 */
async function insertKlines(candles: any[]): Promise<void> {
  const supabase = getSupabase();

  // 分批插入，每批 500 条
  const batchSize = 500;

  for (let i = 0; i < candles.length; i += batchSize) {
    const batch = candles.slice(i, i + batchSize);

    const { error } = await supabase
      .from('klines')
      .upsert(batch, {
        onConflict: 'symbol,interval,open_time',
        ignoreDuplicates: false,
      });

    if (error) {
      console.error(`Error inserting batch ${i / batchSize}:`, error);
      throw error;
    }

    console.log(
      `✅ Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(candles.length / batchSize)} ` +
      `(${batch.length} candles)`
    );
  }
}

/**
 * 生成并插入历史数据
 */
async function generateHistoryData(): Promise<void> {
  console.log('🚀 Starting historical data generation...\n');

  // 1. 获取所有交易对和价格
  console.log('1️⃣ Fetching symbols and prices...');
  const symbols = await getSymbolsAndPrices();

  if (symbols.length === 0) {
    console.log('❌ No symbols found. Please ensure symbols table has data.');
    return;
  }

  console.log(`✅ Found ${symbols.length} symbols\n`);

  // 2. 计算开始时间（7 天前）
  const endTime = Date.now();
  const startTime = endTime - (DAYS_TO_GENERATE * 24 * 60 * 60 * 1000);

  console.log(
    `2️⃣ Generating ${TOTAL_CANDLES} 1m candles for each symbol ` +
    `(${DAYS_TO_GENERATE} days: ${new Date(startTime).toLocaleDateString()} - ${new Date(endTime).toLocaleDateString()})\n`
  );

  // 3. 为每个交易对生成数据
  for (const symbol of symbols) {
    console.log(`📊 Processing ${symbol.symbol} ($${symbol.price.toFixed(2)})...`);

    // 生成 1m K 线
    const candles = generate1mCandles(
      symbol.symbol,
      symbol.price,
      startTime,
      TOTAL_CANDLES
    );

    console.log(`   Generated ${candles.length} 1m candles`);

    // 插入数据库
    try {
      await insertKlines(candles);
      console.log(`   ✅ ${symbol.symbol} completed\n`);
    } catch (error) {
      console.error(`   ❌ ${symbol.symbol} failed:`, error);
    }
  }

  console.log('✅ Historical data generation completed!');
}

// 运行
generateHistoryData()
  .then(() => {
    console.log('\n✨ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
