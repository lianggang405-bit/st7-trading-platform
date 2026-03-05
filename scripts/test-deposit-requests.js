const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.COZE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.COZE_SUPABASE_SERVICE_ROLE_KEY || '';

console.log('Supabase URL:', supabaseUrl);
console.log('Service Key:', supabaseServiceKey ? 'SET' : 'NOT SET');

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: { schema: 'public' },
  auth: { persistSession: false, autoRefreshToken: false },
});

async function testQuery() {
  console.log('Querying all deposit_requests...');
  const { data, error } = await supabase
    .from('deposit_requests')
    .select('*');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Total records:', data.length);
  console.log('IDs:', data.map(r => r.id).sort((a, b) => b - a));
  console.log('First record:', data[0]);

  // Try to find ID 11
  const record11 = data.find(r => r.id === 11);
  console.log('Record 11:', record11);
}

testQuery().catch(console.error);
