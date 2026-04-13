/**
 * 数据库表结构检查
 * 
 * 安全策略：仅开发环境可用
 */

import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { devOnlyHandler } from '@/lib/dev-check';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET - 检查所有可能的表
export const GET = devOnlyHandler(async (_req: NextRequest) => {
  try {
    const client = getSupabaseClient();

    // 检查所有可能的表
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
        const { data, error, count } = await client
          .from(table)
          .select('*', { count: 'exact', head: false })
          .limit(10);

        results[table] = {
          count: count || 0,
          sample: data || [],
          error: error?.message || null,
          exists: !error || error.code !== '42P01',
        };
      } catch (err: any) {
        results[table] = {
          count: 0,
          sample: [],
          error: err.message,
          exists: false,
        };
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error: any) {
    console.error('[Debug] check-all-tables error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
});
