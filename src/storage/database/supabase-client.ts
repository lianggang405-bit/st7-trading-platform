import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.COZE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.COZE_SUPABASE_ANON_KEY || '';

// 如果 Supabase 配置为空，返回 null，但在类型系统中强制转换为 SupabaseClient 以避免类型错误
export const supabase = (supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null) as unknown as SupabaseClient;

export const getSupabaseClient = () => supabase;

export const isSupabaseEnabled = !!supabase;

export const getSupabaseCredentials = () => ({
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
});
