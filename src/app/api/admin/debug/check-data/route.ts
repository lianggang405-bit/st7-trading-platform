/**
 * 数据库数据检查
 * 
 * 安全策略：仅开发环境可用
 */

import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { devOnlyHandler } from '@/lib/dev-check';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET - 检查 Supabase 数据库中的数据
export const GET = devOnlyHandler(async (_req: NextRequest) => {
  try {
    const client = getSupabaseClient();

    // 检查各个表的数据
    const tables = ['users', 'applications', 'positions', 'credit_adjustments', 'market_adjustments', 'financial_records'];
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
});
