import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - 获取用户信息（用于同步）
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    // 从数据库查询用户信息
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
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        balance: user.balance || 0,
        accountType: user.account_type,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    console.error('[Get User By ID API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '服务器错误',
      },
      { status: 500 }
    );
  }
}
