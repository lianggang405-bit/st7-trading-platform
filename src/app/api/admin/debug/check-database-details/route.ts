import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET - 检查数据库详细信息（索引、触发器、外键）
export async function GET() {
  try {
    const client = getSupabaseClient();

    // 查询所有表
    const { data: tables, error: tablesError } = await client
      .from('users')
      .select('id')
      .limit(1);

    if (tablesError) {
      return NextResponse.json(
        { success: false, error: tablesError.message },
        { status: 500 }
      );
    }

    // 使用 SQL 查询详细信息
    const { data: details, error: detailsError } = await client.rpc('get_database_details')
      .catch(() => ({ data: null, error: null }));

    // 返回基本信息
    return NextResponse.json({
      success: true,
      message: '请在 Supabase SQL Editor 中运行检查命令',
      checkCommands: {
        // 检查所有表
        tables: `
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
        `,
        // 检查触发器
        triggers: `
SELECT trigger_name, event_object_table, event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
        `,
        // 检查索引
        indexes: `
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
        `,
        // 检查外键约束
        foreignKeys: `
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;
        `,
      },
    });
  } catch (error: any) {
    console.error('[Check Database Details API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
