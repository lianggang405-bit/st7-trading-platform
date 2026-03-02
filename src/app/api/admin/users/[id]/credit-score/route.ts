import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import adminFetch from '@/lib/admin-fetch';

// GET - 获取指定用户的信用分
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 验证用户是否存在
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, username, credit_score')
      .eq('id', id)
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
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        creditScore: user.credit_score || 100,
      },
    });
  } catch (error) {
    console.error('[Admin CreditScore API] GET Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '服务器错误',
      },
      { status: 500 }
    );
  }
}

// PATCH - 更新指定用户的信用分
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { creditScore, reason } = await request.json();

    // 验证必填字段
    if (creditScore === undefined || creditScore === null) {
      return NextResponse.json(
        {
          success: false,
          error: '信用分不能为空',
        },
        { status: 400 }
      );
    }

    // 验证信用分范围
    if (typeof creditScore !== 'number' || creditScore < 0 || creditScore > 1000) {
      return NextResponse.json(
        {
          success: false,
          error: '信用分必须在 0-1000 之间',
        },
        { status: 400 }
      );
    }

    // 验证用户是否存在
    const { data: user, error: checkError } = await supabase
      .from('users')
      .select('id, email, username, credit_score')
      .eq('id', id)
      .single();

    if (checkError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: '用户不存在',
        },
        { status: 404 }
      );
    }

    const oldCreditScore = user.credit_score || 100;

    // 更新信用分
    const { error: updateError } = await supabase
      .from('users')
      .update({
        credit_score: creditScore,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      console.error('[Admin CreditScore API] Update Error:', updateError);
      return NextResponse.json(
        {
          success: false,
          error: '更新信用分失败',
        },
        { status: 500 }
      );
    }

    // 记录操作日志（可选）
    console.log(`[CreditScore] User ${user.email} credit score changed from ${oldCreditScore} to ${creditScore}. Reason: ${reason || 'N/A'}`);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        creditScore,
      },
      message: `信用分已从 ${oldCreditScore} 更新为 ${creditScore}`,
    });
  } catch (error) {
    console.error('[Admin CreditScore API] PATCH Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '服务器错误',
      },
      { status: 500 }
    );
  }
}
