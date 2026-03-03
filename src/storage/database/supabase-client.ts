import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.COZE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.COZE_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.COZE_SUPABASE_SERVICE_ROLE_KEY || '';

console.log('[Supabase] Configuration check:', {
  hasUrl: !!supabaseUrl,
  hasAnonKey: !!supabaseAnonKey,
  hasServiceKey: !!supabaseServiceKey,
  url: supabaseUrl,
  usingServiceKey: !!supabaseServiceKey,
});

// 优先使用 service_role key（服务端权限更高），否则使用 anon key
const apiKey = supabaseServiceKey || supabaseAnonKey;

// 创建 Supabase 客户端，添加必要的配置以避免 Schema 缓存问题
const supabaseClient: SupabaseClient = (supabaseUrl && apiKey)
  ? createClient(supabaseUrl, apiKey, {
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
export const isSupabaseEnabled = !!supabaseUrl && !!apiKey;
export const getSupabaseCredentials = () => ({
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
  serviceKey: supabaseServiceKey,
  usingServiceKey: !!supabaseServiceKey,
});
