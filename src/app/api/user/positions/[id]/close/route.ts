import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST - 平仓
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: positionId } = await params;

    // 从 Authorization header 获取 token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          success: false,
          error: '未提供认证令牌',
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const match = token.match(/^token_(.+)_(\d+)$/);

    if (!match) {
      return NextResponse.json(
        {
          success: false,
          error: '无效的认证令牌',
        },
        { status: 401 }
      );
    }

    const userId = match[1];

    const { price } = await request.json();

    // 查询订单
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', positionId)
      .eq('user_id', userId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        {
          success: false,
          error: '持仓不存在',
        },
        { status: 404 }
      );
    }

    if (order.status !== 'open') {
      return NextResponse.json(
        {
          success: false,
          error: '持仓已平仓',
        },
        { status: 400 }
      );
    }

    // 计算盈亏
    const closePrice = price || order.price;
    let profit = 0;
    if (order.side === 'buy') {
      profit = (closePrice - order.price) * order.quantity;
    } else {
      profit = (order.price - closePrice) * order.quantity;
    }

    // 更新订单状态
    const { error: updateOrderError } = await supabase
      .from('orders')
      .update({
        status: 'closed',
        profit,
        closed_at: new Date().toISOString(),
      })
      .eq('id', positionId);

    if (updateOrderError) {
      console.error('[Close Position API] Error updating order:', updateOrderError);
      return NextResponse.json(
        {
          success: false,
          error: '平仓失败',
        },
        { status: 500 }
      );
    }

    // 更新用户余额
    const { data: user } = await supabase
      .from('users')
      .select('balance')
      .eq('id', userId)
      .single();

    if (user) {
      const newBalance = user.balance + order.margin + profit;
      await supabase
        .from('users')
        .update({ balance: newBalance })
        .eq('id', userId);
    }

    return NextResponse.json({
      success: true,
      data: {
        profit,
        closePrice,
        status: 'closed',
      },
    });
  } catch (error) {
    console.error('[Close Position API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '服务器错误',
      },
      { status: 500 }
    );
  }
}
