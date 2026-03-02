import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcrypt';

// POST - 测试数据库连接和用户查询
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    console.log('[Test DB] Querying user:', email);

    // 查询用户
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email);

    console.log('[Test DB] Result:', { data, error });

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error,
      });
    }

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      users: data,
    });
  } catch (error) {
    console.error('[Test DB] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
