import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.COZE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.COZE_SUPABASE_ANON_KEY || '';

// 创建 Supabase 客户端，添加必要的配置以避免 Schema 缓存问题
// 注意：如果缺少凭证，会创建一个无法使用的客户端，但类型系统中需要保证非 null
const supabaseClient: SupabaseClient = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, {
      db: {
        schema: 'public', // 明确指定使用 public schema
      },
      auth: {
        persistSession: false, // 服务端不需要持久化 session
        autoRefreshToken: false, // 服务端不需要自动刷新 token
      },
    })
  : createClient('http://localhost', 'placeholder', {
      db: { schema: 'public' },
      auth: { persistSession: false, autoRefreshToken: false },
    }) as any;

export const supabase = supabaseClient;
export const getSupabaseClient = () => supabaseClient;
export const isSupabaseEnabled = !!supabaseUrl && !!supabaseAnonKey;
export const getSupabaseCredentials = () => ({
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
});
