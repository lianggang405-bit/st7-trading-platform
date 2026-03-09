import { getSupabase } from './src/config/database';

async function checkCryptoSymbols() {
  console.log('Checking crypto symbols in database...\n');

  const supabase = getSupabase();

  // 获取所有symbols
  const { data: allSymbols, error: allError } = await supabase
    .from('symbols')
    .select('*');

  if (allError) {
    console.error('Error:', allError.message);
    process.exit(1);
  }

  console.log(`Total symbols: ${allSymbols.length}\n`);

  // 检查crypto类型的symbols
  const cryptoSymbols = allSymbols.filter(s => s.type === 'crypto');
  console.log(`Crypto symbols: ${cryptoSymbols.length}\n`);

  if (cryptoSymbols.length > 0) {
    console.table(cryptoSymbols);
  }

  // 检查是否有BTCUSDT、ETHUSDT、SOLUSDT
  const targetSymbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];
  console.log('\nChecking for specific symbols:\n');

  for (const symbol of targetSymbols) {
    const found = allSymbols.find(s => s.symbol === symbol);
    if (found) {
      console.log(`✅ ${symbol} found (type: ${found.type})`);
    } else {
      console.log(`❌ ${symbol} NOT found`);
    }
  }
}

checkCryptoSymbols();
