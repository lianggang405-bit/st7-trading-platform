import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcrypt';
import { findAccountByEmail } from '@/lib/demo-account-storage';
import { validateUser } from '@/lib/user-mock-data';

// POST - 验证用户登录
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: '邮箱和密码为必填项',
        },
        { status: 400 }
      );
    }

    // 优先从数据库查找
    let dbUser = null;
    let dbError = null;

    if (supabase) {
      const result = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      dbUser = result.data;
      dbError = result.error;
    } else {
      console.warn('[Validate API] Supabase client not initialized, skipping DB check');
    }

    console.log('[Validate API] Database query result:', { dbUser, dbError });

    if (dbUser) {
      // 验证密码
      const passwordMatch = await bcrypt.compare(password, dbUser.password_hash);
      console.log('[Validate API] Password match:', passwordMatch);

      if (passwordMatch) {
        // 更新最后登录时间
        if (supabase) {
          await supabase
            .from('users')
            .update({ last_login_at: new Date().toISOString() })
            .eq('id', dbUser.id);
        }

        return NextResponse.json({
          success: true,
          user: {
            id: dbUser.id,
            username: dbUser.username,
            email: dbUser.email,
            balance: dbUser.balance || 0,
            accountType: dbUser.account_type || 'demo',
            createdAt: dbUser.created_at,
          },
        });
      }
    }

    // 再从文件存储查找（管理端创建的账户）
    const fileAccount = findAccountByEmail(email);
    if (fileAccount && fileAccount.password === password) {
      return NextResponse.json({
        success: true,
        user: {
          id: fileAccount.id,
          username: fileAccount.email.split('@')[0],
          email: fileAccount.email,
          balance: fileAccount.balance,
          accountType: fileAccount.accountType,
          createdAt: fileAccount.createdAt,
        },
      });
    }

    // 最后从 Mock 数据查找（前端创建的账户）
    const mockUser = validateUser(email, password);
    if (mockUser) {
      return NextResponse.json({
        success: true,
        user: {
          id: mockUser.id,
          username: mockUser.email.split('@')[0],
          email: mockUser.email,
          balance: mockUser.balance,
          accountType: mockUser.accountType,
          createdAt: mockUser.createdAt,
        },
      });
    }

    // 都找不到
    return NextResponse.json(
      {
        success: false,
        error: '邮箱或密码错误',
      },
      { status: 401 }
    );
  } catch (error) {
    console.error('Failed to validate user:', error);
    return NextResponse.json(
      {
        success: false,
        error: '验证失败',
      },
      { status: 500 }
    );
  }
}
