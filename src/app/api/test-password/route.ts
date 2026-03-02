import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcrypt';

// POST - 测试密码验证
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    console.log('[Test Password] Testing password for:', email);

    // 查询用户
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
      });
    }

    console.log('[Test Password] User found:', user.email);
    console.log('[Test Password] Password hash:', user.password_hash);

    // 验证密码
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    console.log('[Test Password] Password match:', passwordMatch);

    return NextResponse.json({
      success: true,
      passwordMatch,
      userId: user.id,
      email: user.email,
    });
  } catch (error) {
    console.error('[Test Password] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
