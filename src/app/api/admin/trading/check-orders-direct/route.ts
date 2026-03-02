import { NextResponse } from 'next/server';

// GET - 直接检查 orders 表是否存在
export async function GET() {
  try {
    const response = await fetch('https://brfzboxaxknlypapwajy.supabase.co/rest/v1/rpc/exec_sql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'sb_publishable_3FOyR_TdA-_zwg4K-8Feqg_Lka84e0o',
        'Authorization': 'Bearer sb_publishable_3FOyR_TdA-_zwg4K-8Feqg_Lka84e0o',
      },
      body: JSON.stringify({
        sql: `
          SELECT
            table_name,
            (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'orders') as column_count
          FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'orders'
        `
      })
    });

    const result = await response.json();

    if (result && result.length > 0) {
      return NextResponse.json({
        success: true,
        exists: true,
        table: result[0]
      });
    } else {
      return NextResponse.json({
        success: true,
        exists: false,
        message: 'orders 表不存在'
      });
    }

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
