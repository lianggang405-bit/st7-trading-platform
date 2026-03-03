import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAdminToken } from '@/lib/admin-auth';

// PATCH - 更新品种
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adminToken = request.cookies.get('admin_token')?.value ||
                      request.headers.get('authorization')?.replace('Bearer ', '');

    // 验证管理员权限
    const admin = verifyAdminToken(adminToken || '');
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      symbol,
      currency_id,
      is_visible,
      min_order_size,
      max_order_size,
      contract_fee,
    } = body;

    const supabase = getSupabaseClient();

    // 构建更新数据对象
    const updateData: any = {};
    if (symbol !== undefined) updateData.symbol = symbol;
    if (currency_id !== undefined) updateData.currency_id = currency_id;
    if (is_visible !== undefined) updateData.is_visible = is_visible;
    if (min_order_size !== undefined) updateData.min_order_size = min_order_size;
    if (max_order_size !== undefined) updateData.max_order_size = max_order_size;
    if (contract_fee !== undefined) updateData.contract_fee = contract_fee;

    // 如果修改了symbol，检查是否与其他交易对冲突
    if (symbol) {
      const { data: existing } = await supabase
        .from('trading_pairs')
        .select('id')
        .eq('symbol', symbol)
        .neq('id', parseInt(id))
        .single();

      if (existing) {
        return NextResponse.json(
          { error: 'Symbol already exists' },
          { status: 409 }
        );
      }
    }

    // 更新交易对
    const { data, error } = await supabase
      .from('trading_pairs')
      .update(updateData)
      .eq('id', parseInt(id))
      .select()
      .single();

    if (error) {
      console.error('[Update Symbol] Error:', error);
      return NextResponse.json(
        { error: 'Failed to update symbol' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Symbol not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '品种更新成功',
      symbol: data,
    });
  } catch (error) {
    console.error('[Update Symbol] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - 删除品种
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adminToken = request.cookies.get('admin_token')?.value ||
                      request.headers.get('authorization')?.replace('Bearer ', '');

    // 验证管理员权限
    const admin = verifyAdminToken(adminToken || '');
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseClient();

    // 删除交易对
    const { error } = await supabase
      .from('trading_pairs')
      .delete()
      .eq('id', parseInt(id));

    if (error) {
      console.error('[Delete Symbol] Error:', error);
      return NextResponse.json(
        { error: 'Failed to delete symbol' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '品种删除成功',
    });
  } catch (error) {
    console.error('[Delete Symbol] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
