import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
const supabase = getSupabaseClient();

// PUT /api/admin/contract/demo-orders/[id] - 更新模拟合约订单（支持更新 side 和 status）
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id);
    const body = await request.json();

    if (isNaN(orderId)) {
      return NextResponse.json({ success: false, error: 'Invalid order ID' }, { status: 400 });
    }

    // 允许更新 side (tradeType) 和 status 字段
    const updateData: any = {};

    // 验证并添加 side (tradeType)
    if (body.tradeType !== undefined) {
      if (body.tradeType === '买入' || body.tradeType === '卖出') {
        updateData.side = body.tradeType === '买入' ? 'long' : 'short';
      } else {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid tradeType. Must be "买入" or "卖出"',
          },
          { status: 400 }
        );
      }
    }

    // 验证并添加 status
    if (body.status !== undefined) {
      const statusMap: Record<string, string> = {
        '进行中': 'open',
        '已平仓': 'closed',
        '已取消': 'canceled',
      };
      const dbStatus = statusMap[body.status];
      if (dbStatus) {
        updateData.status = dbStatus;
      } else {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid status. Must be one of: 进行中, 已平仓, 已取消',
          },
          { status: 400 }
        );
      }
    }

    // 如果没有可更新的字段，返回错误
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No valid fields to update',
        },
        { status: 400 }
      );
    }

    updateData.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('demo_contract_orders')
      .update(updateData)
      .eq('id', orderId);

    if (error) {
      console.error('Failed to update demo contract order:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Demo contract order updated successfully' });
  } catch (error) {
    console.error('Error in PUT demo contract order:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/contract/demo-orders/[id] - 删除模拟合约订单
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
      return NextResponse.json({ success: false, error: 'Invalid order ID' }, { status: 400 });
    }

    const { error } = await supabase
      .from('demo_contract_orders')
      .delete()
      .eq('id', orderId);

    if (error) {
      console.error('Failed to delete demo contract order:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE demo contract order:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/admin/contract/demo-orders/[id] - 更新模拟合约订单
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id);
    const body = await request.json();

    if (isNaN(orderId)) {
      return NextResponse.json({ success: false, error: 'Invalid order ID' }, { status: 400 });
    }

    const { data: order, error } = await supabase
      .from('demo_contract_orders')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      console.error('Failed to update demo contract order:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error('Error in PATCH demo contract order:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/admin/contract/demo-orders/[id] - 获取单个模拟合约订单详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
      return NextResponse.json({ success: false, error: 'Invalid order ID' }, { status: 400 });
    }

    const { data: order, error } = await supabase
      .from('demo_contract_orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error) {
      console.error('Failed to fetch demo contract order:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error('Error in GET demo contract order:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
