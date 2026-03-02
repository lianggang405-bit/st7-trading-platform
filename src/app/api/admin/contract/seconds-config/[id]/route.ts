import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
const supabase = getSupabaseClient();
// DELETE /api/admin/contract/seconds-config/[id] - 删除秒数设置
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const configId = parseInt(id);

    if (isNaN(configId)) {
      return NextResponse.json({ success: false, error: 'Invalid config ID' }, { status: 400 });
    }

    const { error } = await supabase
      .from('seconds_config')
      .delete()
      .eq('id', configId);

    if (error) {
      console.error('Failed to delete seconds config:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE seconds config:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/admin/contract/seconds-config/[id] - 更新秒数设置
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const configId = parseInt(id);
    const body = await request.json();

    if (isNaN(configId)) {
      return NextResponse.json({ success: false, error: 'Invalid config ID' }, { status: 400 });
    }

    // 将驼峰命名转换为下划线命名
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (body.seconds !== undefined) updateData.seconds = body.seconds;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.profitRate !== undefined) updateData.profit_rate = body.profitRate;
    if (body.maxAmount !== undefined) updateData.max_amount = body.maxAmount;
    if (body.minAmount !== undefined) updateData.min_amount = body.minAmount;

    const { data: config, error } = await supabase
      .from('seconds_config')
      .update(updateData)
      .eq('id', configId)
      .select()
      .single();

    if (error) {
      console.error('Failed to update seconds config:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, config });
  } catch (error) {
    console.error('Error in PATCH seconds config:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/admin/contract/seconds-config/[id] - 获取单个秒数设置详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const configId = parseInt(id);

    if (isNaN(configId)) {
      return NextResponse.json({ success: false, error: 'Invalid config ID' }, { status: 400 });
    }

    const { data: config, error } = await supabase
      .from('seconds_config')
      .select('*')
      .eq('id', configId)
      .single();

    if (error) {
      console.error('Failed to fetch seconds config:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, config });
  } catch (error) {
    console.error('Error in GET seconds config:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
