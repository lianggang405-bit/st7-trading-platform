import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET - 检查 Supabase 表结构完整性
export async function GET() {
  try {
    const client = getSupabaseClient();

    // 检查各个表的存在性和结构
    const tables = [
      'users',
      'applications',
      'positions',
      'orders',
      'credit_adjustments',
      'market_adjustments',
      'trading_pairs',
      'trading_bots',
    ];

    const results: Record<string, any> = {};

    for (const table of tables) {
      try {
        // 检查表是否存在
        const { data: tableData, error: tableError } = await client
          .from(table)
          .select('*')
          .limit(1);

        // 尝试获取表结构（通过查询 system tables） (暂时注释掉，避免构建错误且返回值未被使用)
        // const { data: columnsData, error: columnsError } = await client.rpc('get_table_structure', {
        //   table_name: table,
        // }).catch(() => ({ data: null, error: null }));

        results[table] = {
          exists: !tableError || (tableError.code !== '42P01' && tableError.code !== 'PGRST116'),
          count: tableData?.length || 0,
          error: tableError?.message || null,
          errorCode: tableError?.code || null,
        };
      } catch (err: any) {
        results[table] = {
          exists: false,
          count: 0,
          error: err.message,
        };
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('[Check Tables Structure API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
