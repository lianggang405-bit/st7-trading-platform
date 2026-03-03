import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient, getSupabaseCredentials } from '@/storage/database';

export async function GET(req: NextRequest) {
  try {
    const credentials = getSupabaseCredentials();
    const client = getSupabaseClient();

    console.log('[Test Supabase] Credentials:', {
      url: credentials.url,
      hasServiceKey: credentials.usingServiceKey,
      hasAnonKey: !!credentials.anonKey,
    });

    // 测试查询 applications 表
    const { data: applications, error: appsError } = await client
      .from('applications')
      .select('*')
      .limit(1);

    if (appsError) {
      console.error('[Test Supabase] Applications query error:', appsError);
      return NextResponse.json({
        success: false,
        error: 'Failed to query applications',
        details: appsError,
      }, { status: 500 });
    }

    // 测试查询 users 表
    const { data: users, error: usersError } = await client
      .from('users')
      .select('*')
      .limit(1);

    if (usersError) {
      console.error('[Test Supabase] Users query error:', usersError);
      return NextResponse.json({
        success: false,
        error: 'Failed to query users',
        details: usersError,
      }, { status: 500 });
    }

    // 测试插入（检查 id_card_front_url 和 id_card_back_url 字段）
    const { data: columns, error: columnsError } = await client
      .rpc('get_table_columns', { table_name: 'applications' });

    // 直接查询表结构
    const { data: tableInfo, error: tableError } = await client
      .from('applications')
      .select('id_card_front_url, id_card_back_url')
      .limit(1);

    console.log('[Test Supabase] Table columns test:', {
      hasData: !!tableInfo,
      error: tableError,
    });

    return NextResponse.json({
      success: true,
      message: 'Supabase connection successful',
      credentials: {
        url: credentials.url,
        usingServiceKey: credentials.usingServiceKey,
      },
      tables: {
        applications: {
          accessible: true,
          hasData: (applications || []).length > 0,
          sampleCount: (applications || []).length,
        },
        users: {
          accessible: true,
          hasData: (users || []).length > 0,
          sampleCount: (users || []).length,
        },
      },
      schema: {
        id_card_front_url_accessible: !tableError,
        id_card_back_url_accessible: !tableError,
        sample: tableInfo?.[0] || null,
      },
    });
  } catch (error) {
    console.error('[Test Supabase] Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      details: error,
    }, { status: 500 });
  }
}
