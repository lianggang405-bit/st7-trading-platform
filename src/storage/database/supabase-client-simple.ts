import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.COZE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.COZE_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.COZE_SUPABASE_SERVICE_ROLE_KEY || '';

// 使用服务角色密钥
export const supabase = (supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null) as unknown as SupabaseClient;

export const getSupabaseClient = () => supabase;

export const isSupabaseEnabled = !!supabase;

export const getSupabaseCredentials = () => ({
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
  serviceKey: supabaseServiceKey,
});

// 获取 API 密钥（用于直接 REST API 调用）
export const getApiKey = () => supabaseServiceKey || supabaseAnonKey;
