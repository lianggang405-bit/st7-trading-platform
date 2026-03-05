import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
const supabase = getSupabaseClient();

// POST /api/admin/wallet/deposit-requests/[id]/approve - 审核通过充值申请
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const requestId = parseInt(id);

    if (isNaN(requestId)) {
      return NextResponse.json({ success: false, error: 'Invalid request ID' }, { status: 400 });
    }

    const body = await request.json();
    const { processedBy = 1 } = body; // 默认使用管理员 user_id = 1

    console.log('[DepositRequests Approve] Approving request:', requestId);

    // 1. 查询充值申请详情
    const { data: depositRequest, error: fetchError } = await supabase
      .from('deposit_requests')
      .select('*')
      .eq('id', requestId)
      .maybeSingle();

    console.log('[DepositRequests Approve] Fetch result:', {
      requestId,
      found: !!depositRequest,
      fetchError
    });

    if (fetchError) {
      console.error('[DepositRequests Approve] Database error:', fetchError);
      return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
    }

    if (!depositRequest) {
      console.error('[DepositRequests Approve] Deposit request not found for ID:', requestId);
      return NextResponse.json({ success: false, error: 'Deposit request not found' }, { status: 404 });
    }

    if (depositRequest.status === 'approved') {
      console.log('[DepositRequests Approve] Request already approved');
      return NextResponse.json({ success: true, request: depositRequest });
    }

    // 2. 计算入金金额（USDT 等同于 USD，入多少算多少）
    const usdAmount = parseFloat(depositRequest.amount);

    console.log('[DepositRequests Approve] Processing amount:', {
      currency: depositRequest.currency,
      usdAmount
    });

    // 3. 更新充值申请状态
    const { data: updatedRequest, error: updateError } = await supabase
      .from('deposit_requests')
      .update({
        status: 'approved',
        processed_by: processedBy,
        processed_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .select()
      .maybeSingle();

    if (updateError) {
      console.error('[DepositRequests Approve] Failed to update deposit request:', updateError);
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    // 5. 更新用户钱包余额
    // 先查找 formal 账户的钱包，如果没有则创建
    let walletData: any;
    let walletError: any;

    // 查找 formal 账户
    const formalWalletResult = await supabase
      .from('user_wallets')
      .select('*')
      .eq('user_id', depositRequest.user_id)
      .eq('account_type', 'formal')
      .maybeSingle();

    walletData = formalWalletResult.data;
    walletError = formalWalletResult.error;

    if (walletError && walletError.code !== 'PGRST116') {
      // PGRST116 是"找不到记录"的错误，这是正常的
      console.error('[DepositRequests Approve] Error fetching formal wallet:', walletError);
      return NextResponse.json({ success: false, error: walletError.message }, { status: 500 });
    }

    if (!walletData) {
      // 如果没有 formal 账户，创建一个
      console.log('[DepositRequests Approve] No formal wallet found, creating one...');
      const { data: newWallet, error: createError } = await supabase
        .from('user_wallets')
        .insert({
          user_id: depositRequest.user_id,
          account_type: 'formal',
          balance: 0,
          frozen_balance: 0,
          total_deposit: 0,
          total_withdraw: 0,
          total_profit: 0,
          total_loss: 0,
          status: 'active',
        })
        .select()
        .single();

      if (createError || !newWallet) {
        console.error('[DepositRequests Approve] Failed to create formal wallet:', createError);
        // 回滚充值申请状态
        await supabase
          .from('deposit_requests')
          .update({ status: 'pending', processed_by: null, processed_at: null })
          .eq('id', requestId);
        return NextResponse.json({ success: false, error: 'Failed to create user wallet' }, { status: 500 });
      }

      walletData = newWallet;
      console.log('[DepositRequests Approve] Formal wallet created:', walletData.id);
    }

    const newBalance = parseFloat(walletData.balance) + usdAmount;
    const newTotalDeposit = parseFloat(walletData.total_deposit) + usdAmount;

    console.log('[DepositRequests Approve] Updating wallet:', {
      userId: depositRequest.user_id,
      oldBalance: walletData.balance,
      usdAmount,
      newBalance,
      oldTotalDeposit: walletData.total_deposit,
      newTotalDeposit
    });

    const { error: balanceUpdateError } = await supabase
      .from('user_wallets')
      .update({
        balance: newBalance,
        total_deposit: newTotalDeposit,
        updated_at: new Date().toISOString(),
      })
      .eq('id', walletData.id);

    if (balanceUpdateError) {
      console.error('[DepositRequests Approve] Failed to update wallet balance:', balanceUpdateError);
      // 回滚充值申请状态
      await supabase
        .from('deposit_requests')
        .update({ status: 'pending', processed_by: null, processed_at: null })
        .eq('id', requestId);
      return NextResponse.json({ success: false, error: balanceUpdateError.message }, { status: 500 });
    }

    console.log('[DepositRequests Approve] Successfully approved and updated balance');
    return NextResponse.json({ 
      success: true, 
      request: updatedRequest,
      usdAmount,
      newBalance
    });
  } catch (error) {
    console.error('Error in approve deposit request:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
