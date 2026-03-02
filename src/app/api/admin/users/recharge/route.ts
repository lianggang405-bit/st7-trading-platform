import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST - 用户充值
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, amount, type } = body;

    // 验证必填字段
    if (!userId || !amount || !type) {
      return NextResponse.json(
        { success: false, error: 'UserId, amount, and type are required' },
        { status: 400 }
      );
    }

    // 验证金额
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // 检查用户是否存在
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // 更新用户余额
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        balance: user.balance + amountNum,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating user balance:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to recharge' },
        { status: 500 }
      );
    }

    // TODO: 可以在这里记录充值交易日志

    return NextResponse.json({
      success: true,
      data: {
        userId,
        amount: amountNum,
        type,
        newBalance: updatedUser.balance,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/admin/users/recharge:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
