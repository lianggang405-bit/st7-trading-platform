import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/storage/database/supabase-admin-client';
import { getBatchRealPrices } from '@/lib/market-data-source';

// GET - 获取持仓列表
export async function GET(request: NextRequest) {
  const supabase = getSupabaseAdminClient();

  try {
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

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // status: 'open' | 'pending' | 'closed' | null (all)

    // 构建查询
    let query = supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId);

    // 如果指定了状态，过滤；否则查询所有状态
    if (status) {
      query = query.eq('status', status);
    }

    const { data: positions, error } = await query
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Positions API] Error:', error);
      return NextResponse.json(
        {
          success: false,
          error: '查询持仓失败',
        },
        { status: 500 }
      );
    }

    // 获取所有持仓的 symbol
    const symbols = positions ? Array.from(new Set(positions.map((p: any) => p.symbol))) : [];
    
    // 批量获取实时价格
    const currentPrices = await getBatchRealPrices(symbols);

    // 格式化持仓数据
    const formattedPositions = positions?.map((pos: any) => {
      const currentPrice = currentPrices[pos.symbol] || pos.price;
      const openPrice = pos.price;
      const volume = pos.quantity;
      const isLong = pos.side === 'buy';
      
      // 计算盈亏: (当前价格 - 开仓价格) * 数量 * (做多为1，做空为-1)
      let profit = (currentPrice - openPrice) * volume * (isLong ? 1 : -1);
      
      return {
        id: pos.id,
        symbol: pos.symbol,
        side: pos.side,
        volume: pos.quantity,
        openPrice: pos.price,
        currentPrice: currentPrice, 
        profit: profit,
        openTime: pos.created_at,
        leverage: pos.leverage || 1,
        margin: pos.margin || 0,
      };
    }) || [];

    return NextResponse.json({
      success: true,
      data: formattedPositions,
    });
  } catch (error) {
    console.error('[Positions API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '服务器错误',
      },
      { status: 500 }
    );
  }
}

// POST - 开仓
export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdminClient();

  try {
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

    const { symbol, side, volume, price, orderType = 'market', leverage = 1 } = await request.json();

    // 验证必填字段
    if (!symbol || !side || !volume || !price) {
      return NextResponse.json(
        {
          success: false,
          error: '缺少必填字段',
        },
        { status: 400 }
      );
    }

    // 计算保证金
    const margin = (price * volume * 0.1) / leverage;

    // 检查是否为模拟账户 token
    const isDemo = token.includes('demo');

    // 模拟账户处理逻辑
    if (isDemo) {
      // 动态导入 demo-account-storage 以避免在非必要时加载
      const { findAccountByEmail, updateAccountBalance } = await import('@/lib/demo-account-storage');
      
      // 模拟账户 token 格式通常包含 email
      let userEmail = '';
      const demoMatch = token.match(/^token_demo_(.+)_(\d+)$/);
      if (demoMatch) {
        userEmail = demoMatch[1];
      }

      // 1. 尝试从数据库查找持久化的模拟账户
      const { data: dbDemoUser } = await supabase
        .from('users')
        .select('id, email, balance')
        .eq('email', userEmail)
        .eq('is_demo', true)
        .single();

      if (dbDemoUser) {
        if (dbDemoUser.balance < margin) {
          return NextResponse.json(
            {
              success: false,
              error: '余额不足',
            },
            { status: 400 }
          );
        }

        // 更新数据库中的模拟账户余额
        const { error: updateError } = await supabase
          .from('users')
          .update({ balance: dbDemoUser.balance - margin })
          .eq('id', dbDemoUser.id);

        if (updateError) {
          console.error('[Positions API] Error updating demo balance:', updateError);
          return NextResponse.json(
            {
              success: false,
              error: '扣除保证金失败',
            },
            { status: 500 }
          );
        }

        // 创建模拟订单并写入数据库
        const orderId = `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // 根据订单类型设置状态
        const orderStatus = orderType === 'market' ? 'open' : 'pending';

        const { data: order, error: insertError } = await supabase
          .from('orders')
          .insert([
            {
              id: orderId,
              user_id: dbDemoUser.id,
              email: dbDemoUser.email || userEmail,
              symbol,
              side,
              order_type: orderType,
              quantity: volume,
              price,
              leverage,
              status: orderStatus,
              profit: 0,
              margin,
              created_at: new Date().toISOString(),
            },
          ])
          .select()
          .single();

        if (insertError) {
          console.error('[Positions API] Error creating demo order:', insertError);
          // 回滚余额
          await supabase.from('users').update({ balance: dbDemoUser.balance }).eq('id', dbDemoUser.id);
          return NextResponse.json(
            {
              success: false,
              error: '创建模拟订单失败',
            },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          data: {
            id: order.id,
            symbol: order.symbol,
            side: order.side,
            volume: order.quantity,
            openPrice: order.price,
            currentPrice: order.price,
            profit: 0,
            openTime: order.created_at,
            leverage: order.leverage,
            margin: order.margin,
          },
        });
      }

      // 2. 如果数据库没找到，说明模拟账户不存在，需要创建
      // 先创建模拟账户，然后创建订单
      const { data: newUser, error: createUserError } = await supabase
        .from('users')
        .insert([
          {
            id: userId,
            email: userEmail,
            balance: 100000, // 初始余额 100000 USDT
            is_demo: true,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (createUserError || !newUser) {
        console.error('[Positions API] Error creating demo user:', createUserError);
        return NextResponse.json(
          {
            success: false,
            error: '创建模拟账户失败',
          },
          { status: 500 }
        );
      }

      // 检查余额
      if (newUser.balance < margin) {
        return NextResponse.json(
          {
            success: false,
            error: '余额不足',
          },
          { status: 400 }
        );
      }

      // 更新数据库中的模拟账户余额
      const { error: updateError } = await supabase
        .from('users')
        .update({ balance: newUser.balance - margin })
        .eq('id', newUser.id);

      if (updateError) {
        console.error('[Positions API] Error updating demo balance:', updateError);
        return NextResponse.json(
          {
            success: false,
            error: '扣除保证金失败',
          },
          { status: 500 }
        );
      }

      // 创建模拟订单并写入数据库
      const orderId = `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // 根据订单类型设置状态
      const orderStatus = orderType === 'market' ? 'open' : 'pending';

      const { data: order, error: insertError } = await supabase
        .from('orders')
        .insert([
          {
            id: orderId,
            user_id: newUser.id,
            email: newUser.email || userEmail,
            symbol,
            side,
            order_type: orderType,
            quantity: volume,
            price,
            leverage,
            status: orderStatus,
            profit: 0,
            margin,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (insertError) {
        console.error('[Positions API] Error creating demo order:', insertError);
        // 回滚余额
        await supabase.from('users').update({ balance: newUser.balance }).eq('id', newUser.id);
        return NextResponse.json(
          {
            success: false,
            error: '创建模拟订单失败',
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          id: order.id,
          symbol: order.symbol,
          side: order.side,
          volume: order.quantity,
          openPrice: order.price,
          currentPrice: order.price,
          profit: 0,
          openTime: order.created_at,
          leverage: order.leverage,
          margin: order.margin,
        },
      });
    }

    // 检查用户余额是否足够 (真实账户)
    const { data: user } = await supabase
      .from('users')
      .select('balance, email')
      .eq('id', userId)
      .single();

    if (!user || user.balance < margin) {
      return NextResponse.json(
        {
          success: false,
          error: '余额不足',
        },
        { status: 400 }
      );
    }

    // 扣除保证金
    const { error: updateError } = await supabase
      .from('users')
      .update({ balance: user.balance - margin })
      .eq('id', userId);

    if (updateError) {
      console.error('[Positions API] Error updating balance:', updateError);
      return NextResponse.json(
        {
          success: false,
          error: '扣除保证金失败',
        },
        { status: 500 }
      );
    }

    // 创建订单
    const orderId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 根据订单类型设置状态
    // 市价单直接成交，限价单等待价格触发
    const orderStatus = orderType === 'market' ? 'open' : 'pending';

    const { data: order, error } = await supabase
      .from('orders')
      .insert([
        {
          id: orderId,
          user_id: userId,
          email: user.email || '',
          symbol,
          side,
          order_type: orderType,
          quantity: volume,
          price,
          leverage,
          status: orderStatus,
          profit: 0,
          margin,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('[Positions API] Error creating order:', error);
      // 回滚余额
      await supabase.from('users').update({ balance: user.balance }).eq('id', userId);
      return NextResponse.json(
        {
          success: false,
          error: '创建订单失败',
        },
        { status: 500 }
      );
    }

    // 返回订单信息
    return NextResponse.json({
      success: true,
      data: {
        id: order.id,
        symbol: order.symbol,
        side: order.side,
        volume: order.quantity,
        openPrice: order.price,
        currentPrice: order.price,
        profit: 0,
        openTime: order.created_at,
        leverage: order.leverage,
        margin: order.margin,
      },
    });
  } catch (error) {
    console.error('[Positions API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '服务器错误',
      },
      { status: 500 }
    );
  }
}
