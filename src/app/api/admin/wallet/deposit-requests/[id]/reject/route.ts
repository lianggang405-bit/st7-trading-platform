import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
const supabase = getSupabaseClient();

// POST /api/admin/wallet/deposit-requests/[id]/reject - 审核拒绝充值申请
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
    const { processedBy = 'admin', remark } = body;

    const updateData: any = {
      status: 'rejected',
      processed_by: processedBy,
      processed_at: new Date().toISOString(),
    };
    
    if (remark) {
      updateData.remark = remark;
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
      console.log('[DepositRequests Reject] Schema cache error detected, trying to refresh...');
      
      // 刷新 schema cache：通过执行一个简单的查询来刷新
      try {
        await supabase.from('deposit_requests').select('id').limit(1);
        console.log('[DepositRequests Reject] Schema cache refreshed, retrying update...');
        
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
        console.error('[DepositRequests Reject] Retry also failed:', retryError);
        // 保持原始错误
      }
    }

    if (error) {
      console.error('Failed to reject deposit request:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, request: depositRequest });
  } catch (error) {
    console.error('Error in reject deposit request:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}