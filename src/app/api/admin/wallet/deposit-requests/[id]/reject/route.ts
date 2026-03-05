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
    const { processedBy = 1, remark } = body; // 默认使用管理员 user_id = 1

    const updateData: any = {
      status: 'rejected',
      processed_by: processedBy,
      processed_at: new Date().toISOString(),
    };
    
    if (remark) {
      updateData.remark = remark;
    }

    // 执行更新
    const { data: depositRequest, error } = await supabase
      .from('deposit_requests')
      .update(updateData)
      .eq('id', requestId)
      .select()
      .maybeSingle();

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