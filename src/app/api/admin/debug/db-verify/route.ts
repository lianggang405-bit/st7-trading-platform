import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getSupabaseAdminClient } from '@/storage/database/supabase-admin-client';

// 强制动态渲染，确保不使用缓存
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const results: any = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      isProduction: process.env.NODE_ENV === 'production',
      variables: {
        // 检查并掩码显示环境变量
        NEXT_PUBLIC_SUPABASE_URL: mask(process.env.NEXT_PUBLIC_SUPABASE_URL),
        COZE_SUPABASE_URL: mask(process.env.COZE_SUPABASE_URL),
        NEXT_PUBLIC_SUPABASE_ANON_KEY: mask(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
        COZE_SUPABASE_ANON_KEY: mask(process.env.COZE_SUPABASE_ANON_KEY),
        SUPABASE_SERVICE_ROLE_KEY: mask(process.env.SUPABASE_SERVICE_ROLE_KEY),
        COZE_SUPABASE_SERVICE_ROLE_KEY: mask(process.env.COZE_SUPABASE_SERVICE_ROLE_KEY),
      }
    },
    clients: {
      anon: { initialized: false, connection: 'pending' },
      admin: { initialized: false, connection: 'pending' }
    },
    operations: {
      write: 'pending',
      read: 'pending',
      delete: 'pending'
    }
  };

  function mask(val: string | undefined) {
    if (!val) return 'MISSING (未配置)';
    if (val.length < 10) return 'PRESENT (太短，可能配置错误)';
    return `${val.substring(0, 8)}...${val.substring(val.length - 8)}`;
  }

  try {
    const supabase = getSupabaseClient();
    const supabaseAdmin = getSupabaseAdminClient();

    results.clients.anon.initialized = !!supabase;
    results.clients.admin.initialized = !!supabaseAdmin;

    // 1. Anon 客户端连接测试 (只读)
    if (supabase) {
      const { error: connError } = await supabase.from('users').select('id').limit(1);
      results.clients.anon.connection = connError ? `FAILED: ${connError.message}` : 'SUCCESS';
    }

    // 2. Admin 客户端连接测试
    if (supabaseAdmin) {
      const { error: adminConnError } = await supabaseAdmin.from('users').select('id').limit(1);
      results.clients.admin.connection = adminConnError ? `FAILED: ${adminConnError.message}` : 'SUCCESS';
    }

    // 3. 完整 CRUD 测试 (使用 Admin 客户端)
    if (supabaseAdmin) {
      const testEmail = `test-verify-${Date.now()}@example.com`;
      const testUsername = `VerifyUser_${Math.floor(Math.random() * 1000)}`;

      // 写入测试
      const { data: writeData, error: writeError } = await supabaseAdmin.from('users').insert({
        email: testEmail,
        password_hash: 'debug-hash',
        username: testUsername,
        account_type: 'demo'
      }).select();

      if (writeError) {
        results.operations.write = `FAILED: ${writeError.message}`;
      } else {
        results.operations.write = 'SUCCESS';
        
        // 读取测试
        const { data: readData, error: readError } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('email', testEmail)
          .single();
        
        results.operations.read = readError ? `FAILED: ${readError.message}` : 'SUCCESS';
        results.operations.read_data = readData;

        // 清理测试数据 (删除)
        const { error: deleteError } = await supabaseAdmin
          .from('users')
          .delete()
          .eq('email', testEmail);
        
        results.operations.delete = deleteError ? `FAILED: ${deleteError.message}` : 'SUCCESS';
      }
    }

    return NextResponse.json({ success: true, results });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      results
    }, { status: 500 });
  }
}
