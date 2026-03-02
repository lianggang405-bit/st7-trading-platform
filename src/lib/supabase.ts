import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 创建 Supabase 客户端（使用项目统一的客户端配置）
// 强制类型转换为 SupabaseClient，避免在每个文件中都进行空值检查
export const supabase = getSupabaseClient() as SupabaseClient;

// 导出配置
export const supabaseConfig = {
  url: process.env.COZE_SUPABASE_URL || '',
  key: process.env.COZE_SUPABASE_ANON_KEY || '',
};
