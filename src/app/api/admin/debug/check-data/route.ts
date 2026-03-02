import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET - 检查 Supabase 数据库中的数据
export async function GET() {
  try {
    const client = getSupabaseClient();

    // 检查各个表的数据
    const tables = ['users', 'applications', 'positions', 'credit_adjustments', 'market_adjustments'];
    const results: Record<string, any> = {};

    for (const table of tables) {
      const { data, error, count } = await client
        .from(table)
        .select('*', { count: 'exact', head: false })
        .limit(100);

      results[table] = {
        count: count || 0,
        sample: data || [],
        error: error?.message,
      };
    }

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('[Check Data API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
