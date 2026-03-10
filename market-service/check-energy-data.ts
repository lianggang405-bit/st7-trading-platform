/**
 * 检查数据库中的能源数据
 */

import { getSupabase } from './src/config/database';

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function logSuccess(message: string) {
  console.log(`${COLORS.green}✅ ${message}${COLORS.reset}`);
}

function logError(message: string) {
  console.log(`${COLORS.red}❌ ${message}${COLORS.reset}`);
}

function logWarn(message: string) {
  console.log(`${COLORS.yellow}⚠️  ${message}${COLORS.reset}`);
}

function logInfo(message: string) {
  console.log(`${COLORS.blue}ℹ️  ${message}${COLORS.reset}`);
}

function logSection(message: string) {
  console.log(`\n${COLORS.cyan}============================================================`);
  console.log(`  ${message}`);
  console.log(`${'='.repeat(60)}${COLORS.reset}\n`);
}

async function checkEnergyData() {
  logSection('🔍 检查数据库中的能源数据');

  const supabase = getSupabase();

  // 1. 检查 K 线数据表
  logInfo('检查 K 线数据表...');

  const energySymbols = ['USOIL', 'UKOIL', 'NGAS'];

  for (const symbol of energySymbols) {
    logInfo(`检查 ${symbol} 的 K 线数据...`);

    const { data, error } = await supabase
      .from('klines')
      .select('open_time, open, high, low, close, volume')
      .eq('symbol', symbol)
      .order('open_time', { ascending: false })
      .limit(5);

    if (error) {
      logError(`${symbol}: 查询失败 - ${error.message}`);
    } else if (!data || data.length === 0) {
      logWarn(`${symbol}: 没有数据`);
    } else {
      logSuccess(`${symbol}: 找到 ${data.length} 条记录`);
      console.log(`  最新 K 线:`);
      data.forEach(kline => {
        console.log(`    时间: ${new Date(kline.open_time).toLocaleString()}`);
        console.log(`    价格: $${kline.close.toFixed(2)}`);
        console.log(`    成交量: ${kline.volume}`);
      });
    }
    console.log();
  }

  // 2. 检查统计表
  logInfo('检查 24h 统计表...');

  for (const symbol of energySymbols) {
    logInfo(`检查 ${symbol} 的统计数据...`);

    const { data, error } = await supabase
      .from('ticker_24h_stats')
      .select('*')
      .eq('symbol', symbol)
      .maybeSingle();

    if (error) {
      logError(`${symbol}: 查询失败 - ${error.message}`);
    } else if (!data) {
      logWarn(`${symbol}: 没有统计数据`);
    } else {
      logSuccess(`${symbol}: 有统计数据`);
      console.log(`  最新价格: $${data.last_price.toFixed(2)}`);
      console.log(`  24h 最高: $${data.high_price.toFixed(2)}`);
      console.log(`  24h 最低: $${data.low_price.toFixed(2)}`);
      console.log(`  24h 涨跌幅: ${data.price_change_percent.toFixed(2)}%`);
    }
    console.log();
  }

  // 3. 检查 OrderBook 数据
  logInfo('检查 OrderBook 数据...');

  for (const symbol of energySymbols) {
    logInfo(`检查 ${symbol} 的订单簿数据...`);

    const { data, error } = await supabase
      .from('orderbook')
      .select('bids, asks, timestamp')
      .eq('symbol', symbol)
      .maybeSingle();

    if (error) {
      logError(`${symbol}: 查询失败 - ${error.message}`);
    } else if (!data) {
      logWarn(`${symbol}: 没有订单簿数据`);
    } else {
      logSuccess(`${symbol}: 有订单簿数据`);
      console.log(`  买单数量: ${data.bids ? JSON.parse(data.bids as string).length : 0}`);
      console.log(`  卖单数量: ${data.asks ? JSON.parse(data.asks as string).length : 0}`);
    }
    console.log();
  }

  // 4. 检查 Market 数据
  logInfo('检查 Market 数据...');

  for (const symbol of energySymbols) {
    logInfo(`检查 ${symbol} 的市场数据...`);

    const { data, error } = await supabase
      .from('markets')
      .select('symbol, price, volume, price_change, price_change_percent, updated_at')
      .eq('symbol', symbol)
      .maybeSingle();

    if (error) {
      logError(`${symbol}: 查询失败 - ${error.message}`);
    } else if (!data) {
      logWarn(`${symbol}: 没有市场数据`);
    } else {
      logSuccess(`${symbol}: 有市场数据`);
      console.log(`  价格: $${data.price.toFixed(2)}`);
      console.log(`  涨跌幅: ${data.price_change_percent.toFixed(2)}%`);
      console.log(`  更新时间: ${new Date(data.updated_at).toLocaleString()}`);
    }
    console.log();
  }

  // 5. 统计能源数据总量
  logSection('📊 能源数据统计');

  let totalKlines = 0;
  let totalStats = 0;
  let totalOrderBooks = 0;
  let totalMarkets = 0;

  for (const symbol of energySymbols) {
    const { count } = await supabase
      .from('klines')
      .select('*', { count: 'exact', head: true })
      .eq('symbol', symbol);

    if (count) totalKlines += count;

    const { count: statsCount } = await supabase
      .from('ticker_24h_stats')
      .select('*', { count: 'exact', head: true })
      .eq('symbol', symbol);

    if (statsCount) totalStats += statsCount;

    const { count: orderbookCount } = await supabase
      .from('orderbook')
      .select('*', { count: 'exact', head: true })
      .eq('symbol', symbol);

    if (orderbookCount) totalOrderBooks += orderbookCount;

    const { count: marketCount } = await supabase
      .from('markets')
      .select('*', { count: 'exact', head: true })
      .eq('symbol', symbol);

    if (marketCount) totalMarkets += marketCount;
  }

  console.log(`K 线数据总数: ${totalKlines}`);
  console.log(`24h 统计总数: ${totalStats}`);
  console.log(`OrderBook 总数: ${totalOrderBooks}`);
  console.log(`Market 总数: ${totalMarkets}`);

  logSection('🎯 结论');

  if (totalKlines > 0) {
    logSuccess('数据库中有能源历史数据，可以用于降级方案');
  } else {
    logError('数据库中没有能源数据，需要添加模拟数据或寻找其他数据源');
  }
}

checkEnergyData().catch(console.error);
