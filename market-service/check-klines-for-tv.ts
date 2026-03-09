import { getSupabase } from './src/config/database';

async function checkKlines() {
  console.log('Checking klines table...\n');

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('klines')
    .select('*')
    .order('open_time', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log('No data found in klines table');
    console.log('\n💡 Run the collector for at least 1 minute to generate K-lines.');
    console.log('   Command: npm run dev');
    process.exit(0);
  }

  console.log(`Found ${data.length} recent K-line records:\n`);
  console.table(data.map((kline) => ({
    Symbol: kline.symbol,
    Interval: kline.interval,
    Open: kline.open.toFixed(2),
    High: kline.high.toFixed(2),
    Low: kline.low.toFixed(2),
    Close: kline.close.toFixed(2),
    OpenTime: kline.open_time,
  })));

  // 检查最新的时间戳
  const latest = data[0];
  const latestTime = latest.open_time;
  const now = Date.now();
  const timeDiff = (now - latestTime) / 1000 / 60; // 分钟

  console.log(`\nLatest K-line time: ${new Date(latestTime).toISOString()}`);
  console.log(`Time difference: ${timeDiff.toFixed(2)} minutes`);
  console.log(`Now: ${new Date(now).toISOString()}`);

  // 生成一个测试查询
  const fromTime = latestTime - 60 * 60 * 1000; // 1小时前
  const toTime = now;
  const fromSec = Math.floor(fromTime / 1000);
  const toSec = Math.floor(toTime / 1000);

  console.log(`\nTest query URL:`);
  console.log(`http://localhost:3000/tv/history?symbol=${latest.symbol}&resolution=1&from=${fromSec}&to=${toSec}`);
}

checkKlines();
