import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
const supabase = getSupabaseClient();
// DELETE /api/admin/wallet/financial-records/[id] - 删除财务记录
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const recordId = parseInt(id);

    if (isNaN(recordId)) {
      return NextResponse.json({ success: false, error: 'Invalid record ID' }, { status: 400 });
    }

    const { error } = await supabase
      .from('financial_records')
      .delete()
      .eq('id', recordId);

    if (error) {
      console.error('Failed to delete financial record:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE financial record:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/admin/wallet/financial-records/[id] - 更新财务记录
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const recordId = parseInt(id);
    const body = await request.json();

    if (isNaN(recordId)) {
      return NextResponse.json({ success: false, error: 'Invalid record ID' }, { status: 400 });
    }

    // 将驼峰命名转换为下划线命名
    const updateData: any = {};

    if (body.account !== undefined) updateData.account = body.account;
    if (body.beforeBalance !== undefined) updateData.before_balance = body.beforeBalance;
    if (body.amount !== undefined) updateData.amount = body.amount;
    if (body.afterBalance !== undefined) updateData.after_balance = body.afterBalance;
    if (body.source !== undefined) updateData.source = body.source;
    if (body.remark !== undefined) updateData.remark = body.remark;

    const { data: record, error } = await supabase
      .from('financial_records')
      .update(updateData)
      .eq('id', recordId)
      .select()
      .single();

    if (error) {
      console.error('Failed to update financial record:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, record });
  } catch (error) {
    console.error('Error in PATCH financial record:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/admin/wallet/financial-records/[id] - 获取单个财务记录详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const recordId = parseInt(id);

    if (isNaN(recordId)) {
      return NextResponse.json({ success: false, error: 'Invalid record ID' }, { status: 400 });
    }

    const { data: record, error } = await supabase
      .from('financial_records')
      .select('*')
      .eq('id', recordId)
      .single();

    if (error) {
      console.error('Failed to fetch financial record:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // 转换数据格式
    const formattedRecord = {
      id: record.id,
      account: record.account,
      beforeBalance: record.before_balance,
      amount: record.amount,
      afterBalance: record.after_balance,
      source: record.source,
      remark: record.remark,
      createdAt: record.created_at,
    };

    return NextResponse.json({ success: true, record: formattedRecord });
  } catch (error) {
    console.error('Error in GET financial record:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
