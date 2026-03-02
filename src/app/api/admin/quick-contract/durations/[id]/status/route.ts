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
    const { status } = body;

    if (!status || !['active', 'inactive'].includes(status)) {
      return NextResponse.json(
        { success: false, error: '无效的状态值' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('quick_contract_durations')
      .update({ status })
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
    console.error('Toggle quick contract duration status error:', error);
    return NextResponse.json(
      { success: false, error: '更新状态失败' },
      { status: 500 }
    );
  }
}
