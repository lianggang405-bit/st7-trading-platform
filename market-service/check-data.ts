import { getSupabase } from './src/config/database';

async function checkData() {
  console.log('Checking tickers table...\n');

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('tickers')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log('No data found in tickers table');
    process.exit(0);
  }

  console.log(`Found ${data.length} records:\n`);
  console.table(data);

  console.log('\n✅ Data chain verified: Mock Generator → Supabase → tickers table');
}

checkData();
