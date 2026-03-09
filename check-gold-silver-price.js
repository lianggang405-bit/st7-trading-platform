const { createClient } = require('@supabase/supabase-js');

// 从环境变量读取配置
const supabaseUrl = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SUPABASE_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkGoldSilverPrice() {
  console.log('📊 检查黄金白银的数据库价格...\n');

  const symbols = ['XAUUSD', 'XAGUSD'];

  for (const symbol of symbols) {
    console.log(`🔍 ${symbol}:`);

    // 获取最新的 K 线数据
    const { data: klines, error } = await supabase
      .from('klines')
      .select('*')
      .eq('symbol', symbol)
      .order('open_time', { ascending: false })
      .limit(1);

    if (error) {
      console.log(`  ❌ 查询失败: ${error.message}\n`);
    } else if (klines && klines.length > 0) {
      const kline = klines[0];
      console.log(`  ✅ 最新 K 线: ${new Date(kline.open_time).toLocaleString()}`);
      console.log(`  📈 收盘价: $${kline.close.toFixed(2)}`);
      console.log(`  📊 开盘价: $${kline.open.toFixed(2)}`);
      console.log(`  🆙 最高价: $${kline.high.toFixed(2)}`);
      console.log(`  📉 最低价: $${kline.low.toFixed(2)}\n`);
    } else {
      console.log(`  ℹ️ 没有历史数据，将使用默认价格\n`);
    }
  }

  console.log('📋 默认价格:');
  console.log(`  XAUUSD: $2750.00（2025年1月实际价格）`);
  console.log(`  XAGUSD: $33.50（2025年1月实际价格）`);
}

checkGoldSilverPrice();
