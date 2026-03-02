import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 鍒涘缓 Supabase 瀹㈡埛绔紙浣跨敤椤圭洰缁熶竴鐨勫鎴风閰嶇疆锛?// 寮哄埗绫诲瀷杞崲涓?SupabaseClient锛岄伩鍏嶅湪姣忎釜鏂囦欢涓兘杩涜绌哄€兼鏌?export const supabase = getSupabaseClient() as SupabaseClient;

// 瀵煎嚭閰嶇疆
export const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
};

