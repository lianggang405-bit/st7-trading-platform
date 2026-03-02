import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - 获取当前用户信息
export async function GET(request: NextRequest) {
  try {
    // 从 Authorization header 获取 token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          success: false,
          error: '未提供认证令牌',
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // 简单的 token 验证（实际项目中应该使用更安全的方式）
    // 这里我们假设 token 格式是 "token_<user_id>_<timestamp>"
    const match = token.match(/^token_(.+)_(\d+)$/);
    if (!match) {
      return NextResponse.json(
        {
          success: false,
          error: '无效的认证令牌',
        },
        { status: 401 }
      );
    }

    const userId = match[1];

    // 从数据库查询用户信息
    if (!supabase) {
       console.error('[Get User API] Supabase client not initialized');
       return NextResponse.json(
         {
           success: false,
           error: '系统配置错误：数据库连接失败',
         },
         { status: 500 }
       );
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return NextResponse.json(
        {
          success: false,
          error: '用户不存在',
        },
        { status: 404 }
      );
    }

    // 返回用户信息
    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        balance: user.balance || 0,
        accountType: user.account_type,
        createdAt: user.created_at,
        lastLoginAt: user.last_login_at,
        userLevel: user.user_level,
        status: user.status,
      },
    });
  } catch (error) {
    console.error('[Get User API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '服务器错误',
      },
      { status: 500 }
    );
  }
}
