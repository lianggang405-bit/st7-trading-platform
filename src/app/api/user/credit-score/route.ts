import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - 获取当前用户的信用分
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

    // 查询用户信用分
    const { data: user, error } = await supabase
      .from('users')
      .select('credit_score')
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

    return NextResponse.json({
      success: true,
      creditScore: user.credit_score || 100,
    });
  } catch (error) {
    console.error('[CreditScore API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '服务器错误',
      },
      { status: 500 }
    );
  }
}
