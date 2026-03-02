import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcrypt';

// POST - 用户注册
export async function POST(request: NextRequest) {
  try {
    const { email, password, accountType = 'demo' } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: '邮箱和密码为必填项',
        },
        { status: 400 }
      );
    }

    console.log('[Register API] Supabase URL:', supabase.supabaseUrl);

    // 检查邮箱是否已存在
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    console.log('[Register API] Existing user check:', existingUser);

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: '邮箱已被注册',
        },
        { status: 400 }
      );
    }

    // 加密密码
    const passwordHash = await bcrypt.hash(password, 10);

    // 根据账户类型设置初始余额
    const initialBalance = accountType === 'demo' ? 100000 : 0;

    // 生成用户名
    const username = email.split('@')[0];

    console.log('[Register API] Inserting user:', { email, username, account_type: accountType, balance: initialBalance });

    // 插入用户
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          email,
          password_hash: passwordHash,
          username,
          account_type: accountType,
          balance: initialBalance,
          user_level: '1',
          status: '正常',
          is_demo: accountType === 'demo',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    console.log('[Register API] Insert result:', { success: !!data, error: error, data: data });

    if (error) {
      console.error('[Register API] Error creating user:', error);
      return NextResponse.json(
        {
          success: false,
          error: '注册失败',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        userId: data.id,
        email: data.email,
        balance: data.balance,
        accountType: data.account_type,
        createdAt: data.created_at,
      },
    });
  } catch (error) {
    console.error('[Register API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '服务器错误',
      },
      { status: 500 }
    );
  }
}
