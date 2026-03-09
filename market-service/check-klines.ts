import { supabase } from './src/config/database';

async function checkKlines() {
  console.log('Checking klines table...\n');

  const { data, error } = await supabase
    .from('klines')
    .select('*')
    .order('open_time', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log('No data found in klines table');
    console.log('\n💡 Tip: Run the collector for at least 1 minute to generate K-lines.');
    console.log('   Command: npm run collector:mock');
    process.exit(0);
  }

  console.log(`Found ${data.length} K-line records:\n`);
  console.table(
    data.map((kline) => ({
      Symbol: kline.symbol,
      Interval: kline.interval,
      Open: kline.open.toFixed(2),
      High: kline.high.toFixed(2),
      Low: kline.low.toFixed(2),
      Close: kline.close.toFixed(2),
      Volume: kline.volume.toFixed(4),
      Time: new Date(kline.open_time).toLocaleString(),
    }))
  );

  console.log('\n✅ K-line chain verified: Mock Generator → Kline Engine → Supabase → klines table');
}

checkKlines();
