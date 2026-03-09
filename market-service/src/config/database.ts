import { createClient, SupabaseClient } from '@supabase/supabase-js';

// 从环境变量读取配置
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env file.');
}

// 创建 Supabase 客户端
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

// 测试数据库连接
export async function testConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('symbols')
      .select('count')
      .limit(1);

    if (error) {
      console.error('[Database] Connection test failed:', error.message);
      return false;
    }

    console.log('[Database] Connection test successful');
    return true;
  } catch (error) {
    console.error('[Database] Connection test error:', error);
    return false;
  }
}
