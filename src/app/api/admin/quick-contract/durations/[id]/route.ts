import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
const supabase = getSupabaseClient();
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const idNum = parseInt(id);
    const body = await request.json();
    const { duration, payoutRate, minAmount, maxAmount, status, sort } = body;

    const updateData: any = {};
    if (duration) updateData.duration = duration;
    if (payoutRate !== undefined) updateData.payout_rate = payoutRate;
    if (minAmount !== undefined) updateData.min_amount = minAmount;
    if (maxAmount !== undefined) updateData.max_amount = maxAmount;
    if (status) updateData.status = status;
    if (sort !== undefined) updateData.sort = sort;

    const { data, error } = await supabase
      .from('quick_contract_durations')
      .update(updateData)
      .eq('id', idNum)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      config: data,
    });
  } catch (error) {
    console.error('Update quick contract duration error:', error);
    return NextResponse.json(
      { success: false, error: '更新秒数配置失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const idNum = parseInt(id);

    const { error } = await supabase
      .from('quick_contract_durations')
      .delete()
      .eq('id', idNum);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Delete quick contract duration error:', error);
    return NextResponse.json(
      { success: false, error: '删除秒数配置失败' },
      { status: 500 }
    );
  }
}
