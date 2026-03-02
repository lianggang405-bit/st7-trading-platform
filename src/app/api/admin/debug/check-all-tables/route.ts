import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET - 检查所有可能的表
export async function GET() {
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
          exists: !error || error.code !== '42P01', // 42P01 = relation does not exist
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
  } catch (error) {
    console.error('[Check All Tables API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
