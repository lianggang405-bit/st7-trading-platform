import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyTokenAndGetUserId } from '@/lib/auth-helper';

const supabase = getSupabaseClient();

// POST /api/app/withdraw - 提交出金申请
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      type,
      currencyId,
      withdrawAddress,
      amount,
      fee,
      arrivalAmount,
      remark,
    } = body;

    // 验证必填字段
    if (!type || !currencyId || !withdrawAddress || !amount) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // 验证 token 并获取用户 ID
    const userId = await verifyTokenAndGetUserId(request);

    // 查询用户钱包余额
    const { data: wallet, error: walletError } = await supabase
      .from('user_wallets')
      .select('*')
      .eq('user_id', parseInt(userId))
      .eq('account_type', 'formal')
      .single();

    if (walletError || !wallet) {
      return NextResponse.json({ 
        success: false, 
        error: 'Wallet not found' 
      }, { status: 404 });
    }

    // 验证余额
    const withdrawAmountNum = parseFloat(amount);
    const availableBalance = wallet.balance - wallet.frozen_balance;
    
    if (withdrawAmountNum > availableBalance) {
      return NextResponse.json({ 
        success: false, 
        error: 'Insufficient balance' 
      }, { status: 400 });
    }

    // 查询币种信息
    const { data: currency, error: currencyError } = await supabase
      .from('digital_currency_currencies')
      .select('*')
      .eq('id', parseInt(currencyId))
      .single();

    if (currencyError || !currency) {
      return NextResponse.json({ 
        success: false, 
        error: 'Currency not found' 
      }, { status: 404 });
    }

    // 创建出金申请记录 - 适配实际表结构
    const { data: withdrawal, error: insertError } = await supabase
      .from('withdrawal_requests')
      .insert({
        account: userId, // 使用 userId 作为 account
        currency: currency.name,
        withdrawal_address: withdrawAddress,
        withdrawal_amount: withdrawAmountNum,
        fee: fee || 0,
        actual_amount: arrivalAmount || withdrawAmountNum,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to create withdrawal request:', insertError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to create withdrawal request' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      withdrawal,
    });
  } catch (error) {
    console.error('Error in POST withdraw:', error);
    
    if (error instanceof Error && (error.message.includes('认证') || error.message.includes('令牌'))) {
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 401 });
    }
    
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
