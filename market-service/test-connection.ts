import { testConnection } from './src/config/database';

async function test() {
  console.log('Testing database connection...');
  const result = await testConnection();
  console.log('Result:', result ? 'SUCCESS ✅' : 'FAILED ❌');
  process.exit(result ? 0 : 1);
}

test();
