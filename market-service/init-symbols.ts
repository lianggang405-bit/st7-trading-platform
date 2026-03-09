import { getSupabase } from './src/config/database';

async function checkSymbols() {
  console.log('Checking symbols table...\n');

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('symbols')
    .select('*')
    .limit(10);

  if (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log('⚠️  Symbols table is empty! Need to insert symbols first.');
    console.log('\nInserting default symbols...\n');

    // 插入默认交易对
    const defaultSymbols = [
      { symbol: 'BTCUSDT', name: 'Bitcoin', type: 'crypto', base_asset: 'BTC', quote_asset: 'USDT', price_precision: 2, volume_precision: 8 },
      { symbol: 'ETHUSDT', name: 'Ethereum', type: 'crypto', base_asset: 'ETH', quote_asset: 'USDT', price_precision: 2, volume_precision: 8 },
      { symbol: 'SOLUSDT', name: 'Solana', type: 'crypto', base_asset: 'SOL', quote_asset: 'USDT', price_precision: 2, volume_precision: 8 },
    ];

    const { error: insertError } = await supabase
      .from('symbols')
      .insert(defaultSymbols);

    if (insertError) {
      console.error('Failed to insert symbols:', insertError.message);
      process.exit(1);
    }

    console.log('✅ Default symbols inserted successfully!\n');
  } else {
    console.log(`Found ${data.length} symbols:\n`);

    // 检查是否有crypto交易对
    const cryptoSymbols = data.filter(s => s.type === 'crypto');
    if (cryptoSymbols.length === 0) {
      console.log('⚠️  No crypto symbols found! Inserting BTCUSDT, ETHUSDT, SOLUSDT...\n');

      const defaultSymbols = [
        { symbol: 'BTCUSDT', name: 'Bitcoin', type: 'crypto', base_asset: 'BTC', quote_asset: 'USDT', price_precision: 2, volume_precision: 8 },
        { symbol: 'ETHUSDT', name: 'Ethereum', type: 'crypto', base_asset: 'ETH', quote_asset: 'USDT', price_precision: 2, volume_precision: 8 },
        { symbol: 'SOLUSDT', name: 'Solana', type: 'crypto', base_asset: 'SOL', quote_asset: 'USDT', price_precision: 2, volume_precision: 8 },
      ];

      const { error: insertError } = await supabase
        .from('symbols')
        .insert(defaultSymbols);

      if (insertError) {
        console.error('Failed to insert crypto symbols:', insertError.message);
        process.exit(1);
      }

      console.log('✅ Crypto symbols inserted successfully!\n');
    }

    console.table(data);
  }
}

checkSymbols();
