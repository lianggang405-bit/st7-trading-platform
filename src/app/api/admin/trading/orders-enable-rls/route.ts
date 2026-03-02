import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// POST - 禁用 orders 表的 RLS
export async function POST() {
  try {
    const response = await fetch('https://brfzboxaxknlypapwajy.supabase.co/rest/v1/rpc/exec_sql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'sb_publishable_3FOyR_TdA-_zwg4K-8Feqg_Lka84e0o',
        'Authorization': 'Bearer sb_publishable_3FOyR_TdA-_zwg4K-8Feqg_Lka84e0o',
      },
      body: JSON.stringify({
        sql: `ALTER TABLE orders DISABLE ROW LEVEL SECURITY;`
      })
    });

    const result = await response.json();

    // 添加 RLS 策略（允许所有操作，仅用于测试）
    const policyResponse = await fetch('https://brfzboxaxknlypapwajy.supabase.co/rest/v1/rpc/exec_sql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'sb_publishable_3FOyR_TdA-_zwg4K-8Feqg_Lka84e0o',
        'Authorization': 'Bearer sb_publishable_3FOyR_TdA-_zwg4K-8Feqg_Lka84e0o',
      },
      body: JSON.stringify({
        sql: `
          DROP POLICY IF EXISTS "Enable all access for users" ON orders;
          CREATE POLICY "Enable all access for users" ON orders
          FOR ALL
          USING (true)
          WITH CHECK (true);
        `
      })
    });

    const policyResult = await policyResponse.json();

    return NextResponse.json({
      success: true,
      message: 'RLS 已禁用并添加策略',
      details: {
        rlsResult: result,
        policyResult: policyResult
      }
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
