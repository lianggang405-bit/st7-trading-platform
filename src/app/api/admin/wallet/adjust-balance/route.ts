import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
const supabase = getSupabaseClient();
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletId, amount, type, reason } = body;

    if (!walletId || !amount || !type || !reason) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { success: false, error: '调整金额必须大于0' },
        { status: 400 }
      );
    }

    // 获取钱包信息
    const { data: wallet, error: walletError } = await supabase
      .from('user_wallets')
      .select('*')
      .eq('id', walletId)
      .single();

    if (walletError || !wallet) {
      return NextResponse.json(
        { success: false, error: '钱包不存在' },
        { status: 404 }
      );
    }

    // 计算新余额
    const newBalance = type === 'add'
      ? wallet.balance + amount
      : wallet.balance - amount;

    if (newBalance < 0) {
      return NextResponse.json(
        { success: false, error: '余额不足' },
        { status: 400 }
      );
    }

    // 使用事务更新钱包余额并创建财务记录
    const { error: updateError } = await supabase.rpc('adjust_user_balance', {
      p_wallet_id: walletId,
      p_amount: type === 'add' ? amount : -amount,
      p_reason: reason,
      p_operation_type: type === 'add' ? 'admin_add' : 'admin_subtract',
    });

    if (updateError) {
      console.error('Adjust balance error:', updateError);
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '余额调整成功',
    });
  } catch (error) {
    console.error('Adjust balance error:', error);
    return NextResponse.json(
      { success: false, error: '调整余额失败' },
      { status: 500 }
    );
  }
}
