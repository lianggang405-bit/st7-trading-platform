import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyTokenAndGetUserId } from '@/lib/auth-helper';

const supabase = getSupabaseClient();

// GET /api/app/wallet/balance - 获取用户钱包余额
export async function GET(request: NextRequest) {
  try {
    // 验证 token 并获取用户 ID
    const userId = await verifyTokenAndGetUserId(request);

    // 查询用户钱包余额
    const { data: wallet, error } = await supabase
      .from('user_wallets')
      .select('*')
      .eq('user_id', parseInt(userId))
      .eq('account_type', 'formal')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Failed to fetch user wallet:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch balance' 
      }, { status: 500 });
    }

    // 如果钱包不存在，创建一个
    if (!wallet) {
      const { data: newWallet, error: createError } = await supabase
        .from('user_wallets')
        .insert({
          user_id: parseInt(userId),
          account_type: 'formal',
          balance: 0,
          frozen_balance: 0,
          total_deposit: 0,
          total_withdraw: 0,
          total_profit: 0,
          total_loss: 0,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) {
        console.error('Failed to create user wallet:', createError);
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to create wallet' 
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        balance: {
          usdt: newWallet.balance,
          frozen: newWallet.frozen_balance,
          total: newWallet.balance + newWallet.frozen_balance,
        },
      });
    }

    return NextResponse.json({
      success: true,
      balance: {
        usdt: wallet.balance,
        frozen: wallet.frozen_balance,
        total: wallet.balance + wallet.frozen_balance,
      },
    });
  } catch (error) {
    console.error('Error in GET wallet balance:', error);
    
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
