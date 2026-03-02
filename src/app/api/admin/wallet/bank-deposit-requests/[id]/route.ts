import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// DELETE /api/admin/wallet/bank-deposit-requests/[id] - 删除银行卡充币申请
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const requestId = parseInt(id);

    if (isNaN(requestId)) {
      return NextResponse.json({ success: false, error: 'Invalid request ID' }, { status: 400 });
    }

    const { error } = await supabase
      .from('bank_deposit_requests')
      .delete()
      .eq('id', requestId);

    if (error) {
      console.error('Failed to delete bank deposit request:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE bank deposit request:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/admin/wallet/bank-deposit-requests/[id] - 更新银行卡充币申请
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const requestId = parseInt(id);
    const body = await request.json();

    if (isNaN(requestId)) {
      return NextResponse.json({ success: false, error: 'Invalid request ID' }, { status: 400 });
    }

    // 将驼峰命名转换为下划线命名
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (body.account !== undefined) updateData.account = body.account;
    if (body.bankName !== undefined) updateData.bank_name = body.bankName;
    if (body.cardNumber !== undefined) updateData.card_number = body.cardNumber;
    if (body.cardHolder !== undefined) updateData.card_holder = body.cardHolder;
    if (body.amount !== undefined) updateData.amount = body.amount;
    if (body.currency !== undefined) updateData.currency = body.currency;
    if (body.status !== undefined) updateData.status = body.status;

    const { data: bankDepositRequest, error } = await supabase
      .from('bank_deposit_requests')
      .update(updateData)
      .eq('id', requestId)
      .select()
      .single();

    if (error) {
      console.error('Failed to update bank deposit request:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, request: bankDepositRequest });
  } catch (error) {
    console.error('Error in PATCH bank deposit request:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/admin/wallet/bank-deposit-requests/[id] - 获取单个银行卡充币申请详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const requestId = parseInt(id);

    if (isNaN(requestId)) {
      return NextResponse.json({ success: false, error: 'Invalid request ID' }, { status: 400 });
    }

    const { data: bankDepositRequest, error } = await supabase
      .from('bank_deposit_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (error) {
      console.error('Failed to fetch bank deposit request:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // 转换数据格式
    const formattedRequest = {
      id: bankDepositRequest.id,
      account: bankDepositRequest.account,
      bankName: bankDepositRequest.bank_name,
      cardNumber: bankDepositRequest.card_number,
      cardHolder: bankDepositRequest.card_holder,
      amount: bankDepositRequest.amount,
      currency: bankDepositRequest.currency,
      status: bankDepositRequest.status,
      createdAt: bankDepositRequest.created_at,
      updatedAt: bankDepositRequest.updated_at,
    };

    return NextResponse.json({ success: true, request: formattedRequest });
  } catch (error) {
    console.error('Error in GET bank deposit request:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
