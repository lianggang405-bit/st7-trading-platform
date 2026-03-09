import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

// 创建 Supabase 客户端（延迟初始化）
export function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    // 从环境变量读取配置
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env file.');
    }

    supabaseInstance = createClient(supabaseUrl, supabaseKey);
  }

  return supabaseInstance;
}

// 测试数据库连接
export async function testConnection(): Promise<boolean> {
  try {
    console.log('[Debug] testConnection called');
    console.log('[Debug] process.env.SUPABASE_URL:', process.env.SUPABASE_URL ? 'SET' : 'NOT SET');
    console.log('[Debug] process.env.SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET');

    const supabase = getSupabase();
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
