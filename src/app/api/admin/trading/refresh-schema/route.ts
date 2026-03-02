import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// POST - 刷新schema并测试
export async function POST() {
  try {
    const supabase = getSupabaseClient();

    // 尝试使用SQL查询表是否存在
    const { data, error } = await supabase
      .rpc('exec_sql', {
        sql: 'SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\' AND table_name = \'trading_pairs\''
      });

    console.log('Exec SQL result:', data, error);

    // 尝试直接查询trading_pairs表
    const { data: pairsData, error: pairsError } = await supabase
      .from('trading_pairs')
      .select('*')
      .limit(1);

    console.log('Pairs data:', pairsData, 'Pairs error:', pairsError);

    return NextResponse.json({
      success: true,
      execSqlResult: data,
      execSqlError: error,
      pairsData,
      pairsError,
    });
  } catch (error) {
    console.error('刷新schema失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '刷新schema失败',
        details: error,
      },
      { status: 500 }
    );
  }
}
