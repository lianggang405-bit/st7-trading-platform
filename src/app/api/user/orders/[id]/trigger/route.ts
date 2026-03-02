import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * POST - 触发挂单（将 pending 状态变为 open 状态）
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const orderId = resolvedParams.id;

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

    // 获取订单信息
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !order) {
      return NextResponse.json(
        {
          success: false,
          error: '订单不存在',
        },
        { status: 404 }
      );
    }

    // 检查订单状态
    if (order.status !== 'pending') {
      return NextResponse.json(
        {
          success: false,
          error: '订单状态不正确，只能触发 pending 状态的订单',
        },
        { status: 400 }
      );
    }

    // 获取当前市场价格（从请求体）
    const { currentPrice } = await request.json();

    // 验证触发条件
    let shouldTrigger = false;
    if (order.side === 'buy') {
      // 买单：当前价格 <= 挂单价格
      shouldTrigger = currentPrice <= order.price;
    } else {
      // 卖单：当前价格 >= 挂单价格
      shouldTrigger = currentPrice >= order.price;
    }

    if (!shouldTrigger) {
      return NextResponse.json(
        {
          success: false,
          error: '触发条件未满足',
        },
        { status: 400 }
      );
    }

    // 更新订单状态为 open，并更新成交价格
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'open',
        price: currentPrice, // 使用实际成交价格
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .eq('user_id', userId);

    if (updateError) {
      console.error('[Order Trigger API] Error:', updateError);
      return NextResponse.json(
        {
          success: false,
          error: '触发订单失败',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '订单触发成功',
      data: {
        orderId,
        status: 'open',
        price: currentPrice,
      },
    });
  } catch (error) {
    console.error('[Order Trigger API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '服务器错误',
      },
      { status: 500 }
    );
  }
}
