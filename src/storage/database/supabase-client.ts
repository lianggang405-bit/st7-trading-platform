import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 如果 Supabase 配置为空，返回 null
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const getSupabaseClient = () => supabase;

export const isSupabaseEnabled = !!supabase;

export const getSupabaseCredentials = () => ({
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
});
