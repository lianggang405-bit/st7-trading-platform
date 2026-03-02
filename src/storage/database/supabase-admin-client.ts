import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.COZE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.COZE_SUPABASE_SERVICE_ROLE_KEY || '';

// 如果 Supabase 配置为空，返回 null，但在类型系统中强制转换为 SupabaseClient 以避免类型错误
export const supabaseAdmin = (supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null) as unknown as SupabaseClient;

export const isSupabaseAdminEnabled = !!supabaseAdmin;

export const getSupabaseAdminClient = () => supabaseAdmin;
