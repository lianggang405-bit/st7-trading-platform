import { getSupabase } from './src/config/database';

async function addCryptoSymbols() {
  console.log('Adding crypto symbols...\n');

  const supabase = getSupabase();

  // 插入crypto交易对（使用表中的实际列）
  const cryptoSymbols = [
    {
      symbol: 'BTCUSDT',
      name: 'Bitcoin / USDT',
      type: 'crypto',
      base_asset: 'BTC',
      quote_asset: 'USDT',
      price_precision: 2,
      status: 1,
      source: 'mock_data'
    },
    {
      symbol: 'ETHUSDT',
      name: 'Ethereum / USDT',
      type: 'crypto',
      base_asset: 'ETH',
      quote_asset: 'USDT',
      price_precision: 2,
      status: 1,
      source: 'mock_data'
    },
    {
      symbol: 'SOLUSDT',
      name: 'Solana / USDT',
      type: 'crypto',
      base_asset: 'SOL',
      quote_asset: 'USDT',
      price_precision: 2,
      status: 1,
      source: 'mock_data'
    },
  ];

  const { error: insertError } = await supabase
    .from('symbols')
    .insert(cryptoSymbols);

  if (insertError) {
    console.error('Failed to insert crypto symbols:', insertError.message);
    process.exit(1);
  }

  console.log('✅ Crypto symbols inserted successfully!\n');

  // 验证插入
  const { data, error } = await supabase
    .from('symbols')
    .select('*')
    .eq('type', 'crypto');

  if (error) {
    console.error('Failed to verify:', error.message);
  } else {
    console.log('Crypto symbols in database:');
    console.table(data);
  }
}

addCryptoSymbols();
