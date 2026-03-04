import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
const supabase = getSupabaseClient();

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
      .select('*')
      .eq('id', requestId)
      .single();

    if (error) {
      console.error('Failed to fetch deposit request:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    if (!depositRequest) {
      return NextResponse.json({ success: false, error: 'Deposit request not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, request: depositRequest });
  } catch (error) {
    console.error('Error in GET deposit request:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/admin/wallet/deposit-requests/[id] - 更新充值申请状态
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const requestId = parseInt(id);
    const body = await request.json();
    const { status, remark, processedBy, amount, usdAmount } = body;

    if (isNaN(requestId)) {
      return NextResponse.json({ success: false, error: 'Invalid request ID' }, { status: 400 });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (remark) updateData.remark = remark;
    if (processedBy) updateData.processed_by = processedBy;
    if (amount !== undefined) updateData.amount = amount;
    if (usdAmount !== undefined) updateData.amount = usdAmount; // 简化处理
    
    // 如果状态是已完成或已拒绝，添加处理时间
    if (status === 'approved' || status === 'rejected' || status === 'completed' || status === 'cancelled') {
      updateData.processed_at = new Date().toISOString();
    }

    // 尝试执行更新，如果遇到 schema cache 错误则先刷新 schema cache 再重试
    let depositRequest: any;
    let error: any;
    
    // 第一次尝试
    const firstResult = await supabase
      .from('deposit_requests')
      .update(updateData)
      .eq('id', requestId)
      .select()
      .single();
    
    depositRequest = firstResult.data;
    error = firstResult.error;
    
    // 如果遇到 schema cache 错误，尝试刷新 schema cache 并重试
    if (error && error.message && error.message.includes('schema cache')) {
      console.log('[DepositRequests PATCH] Schema cache error detected, trying to refresh...');
      
      // 刷新 schema cache：通过执行一个简单的查询来刷新
      try {
        await supabase.from('deposit_requests').select('id').limit(1);
        console.log('[DepositRequests PATCH] Schema cache refreshed, retrying update...');
        
        // 重试更新
        const retryResult = await supabase
          .from('deposit_requests')
          .update(updateData)
          .eq('id', requestId)
          .select()
          .single();
        
        depositRequest = retryResult.data;
        error = retryResult.error;
      } catch (retryError: any) {
        console.error('[DepositRequests PATCH] Retry also failed:', retryError);
        // 保持原始错误
      }
    }

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

    // 尝试执行删除，如果遇到 schema cache 错误则先刷新 schema cache 再重试
    let error: any;
    
    // 第一次尝试
    const firstResult = await supabase
      .from('deposit_requests')
      .delete()
      .eq('id', requestId);
    
    error = firstResult.error;
    
    // 如果遇到 schema cache 错误，尝试刷新 schema cache 并重试
    if (error && error.message && error.message.includes('schema cache')) {
      console.log('[DepositRequests Delete] Schema cache error detected, trying to refresh...');
      
      // 刷新 schema cache：通过执行一个简单的查询来刷新
      try {
        await supabase.from('deposit_requests').select('id').limit(1);
        console.log('[DepositRequests Delete] Schema cache refreshed, retrying delete...');
        
        // 重试删除
        const retryResult = await supabase
          .from('deposit_requests')
          .delete()
          .eq('id', requestId);
        
        error = retryResult.error;
      } catch (retryError: any) {
        console.error('[DepositRequests Delete] Retry also failed:', retryError);
        // 保持原始错误
      }
    }

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