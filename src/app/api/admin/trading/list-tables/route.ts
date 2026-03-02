import { NextResponse } from 'next/server';

// POST - 列出所有表
export async function POST() {
  try {
    const { getSupabaseCredentials } = await import('@/storage/database/supabase-client');
    const { url, anonKey } = getSupabaseCredentials();

    // 使用SQL API查询所有表
    const sqlApiUrl = `${url}/rest/v1/rpc/query`;

    const sql = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;

    const response = await fetch(sqlApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
      },
      body: JSON.stringify({ query: sql }),
    });

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('查询表失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '查询表失败',
        details: error,
      },
      { status: 500 }
    );
  }
}
