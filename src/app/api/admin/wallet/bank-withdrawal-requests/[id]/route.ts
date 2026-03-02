import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - 获取单个银行卡提币申请详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from('bank_withdrawal_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching bank withdrawal request:', error);
      return NextResponse.json(
        { error: 'Bank withdrawal request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in GET /api/admin/wallet/bank-withdrawal-requests/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - 更新银行卡提币申请
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // 检查记录是否存在
    const { data: existing } = await supabase
      .from('bank_withdrawal_requests')
      .select('id')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: 'Bank withdrawal request not found' },
        { status: 404 }
      );
    }

    // 更新数据
    const { data, error } = await supabase
      .from('bank_withdrawal_requests')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating bank withdrawal request:', error);
      return NextResponse.json(
        { error: 'Failed to update bank withdrawal request' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in PATCH /api/admin/wallet/bank-withdrawal-requests/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - 删除银行卡提币申请
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 删除数据
    const { error } = await supabase
      .from('bank_withdrawal_requests')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting bank withdrawal request:', error);
      return NextResponse.json(
        { error: 'Failed to delete bank withdrawal request' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/admin/wallet/bank-withdrawal-requests/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
