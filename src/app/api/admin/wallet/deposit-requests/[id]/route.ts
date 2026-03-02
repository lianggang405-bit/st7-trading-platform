import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
const supabase = getSupabaseClient();
// DELETE /api/admin/wallet/deposit-requests/[id] - 删除充值申请
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
      .from('deposit_requests')
      .delete()
      .eq('id', requestId);

    if (error) {
      console.error('Failed to delete deposit request:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE deposit request:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/admin/wallet/deposit-requests/[id] - 更新充值申请
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

    // 构建更新数据
    const updateData: any = {};

    if (body.amount !== undefined) updateData.amount = body.amount;
    if (body.usdAmount !== undefined) updateData.amount = body.usdAmount; // 简化处理
    if (body.status !== undefined) {
      updateData.status = body.status;
      updateData.processed_at = new Date().toISOString();
    }
    if (body.processedBy !== undefined) updateData.processed_by = body.processedBy;

    const { data: depositRequest, error } = await supabase
      .from('deposit_requests')
      .update(updateData)
      .eq('id', requestId)
      .select()
      .single();

    if (error) {
      console.error('Failed to update deposit request:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, request: depositRequest });
  } catch (error) {
    console.error('Error in PATCH deposit request:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/admin/wallet/deposit-requests/[id] - 获取单个充值申请详情
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

    const { data: depositRequest, error } = await supabase
      .from('deposit_requests')
      .select(`
        id,
        user_id,
        type,
        currency,
        amount,
        tx_hash,
        proof_image,
        status,
        remark,
        created_at,
        processed_at,
        users (
          email
        )
      `)
      .eq('id', requestId)
      .single();

    if (error) {
      console.error('Failed to fetch deposit request:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // 转换数据格式
    const formattedRequest = {
      id: depositRequest.id,
      account: depositRequest.users?.[0]?.email || '',
      email: depositRequest.users?.[0]?.email || '',
      currency: depositRequest.currency,
      paymentAddress: depositRequest.tx_hash || '-',
      amount: depositRequest.amount,
      usdAmount: depositRequest.amount, // 简化处理
      proofImage: depositRequest.proof_image || '',
      status: depositRequest.status,
      createdAt: depositRequest.created_at,
      updatedAt: depositRequest.processed_at || depositRequest.created_at,
      type: depositRequest.type,
      txHash: depositRequest.tx_hash,
    };

    return NextResponse.json({ success: true, request: formattedRequest });
  } catch (error) {
    console.error('Error in GET deposit request:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
