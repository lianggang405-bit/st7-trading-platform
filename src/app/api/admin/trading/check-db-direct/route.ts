import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET - 直接查询数据库绕过 REST API 缓存
export async function GET() {
  try {
    const supabase = getSupabaseClient();

    // 方法1：直接使用 SQL 查询
    const { data: sqlResult, error: sqlError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT COUNT(*) as count FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'trading_pairs'
      `
    });

    if (sqlResult && sqlResult.length > 0) {
      return NextResponse.json({
        success: true,
        method: 'sql_query',
        exists: sqlResult[0].count > 0,
        message: sqlResult[0].count > 0 ? '表已存在' : '表不存在'
      });
    }

    // 方法2：尝试直接查询表
    const { data: directResult, error: directError } = await supabase
      .from('trading_pairs')
      .select('id')
      .limit(1);

    if (directError && directError.code === 'PGRST205') {
      return NextResponse.json({
        success: true,
        method: 'direct_query',
        exists: false,
        error: directError.message
      });
    }

    return NextResponse.json({
      success: true,
      method: 'direct_query',
      exists: true,
      hasData: directResult && directResult.length > 0
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
