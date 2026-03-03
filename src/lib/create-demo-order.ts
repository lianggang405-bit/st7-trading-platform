import { SupabaseClient } from '@supabase/supabase-js';

/**
 * 创建模拟账户订单
 * 
 * 统一的模拟账户订单创建逻辑，避免代码重复
 */
export async function createDemoOrder(
  supabase: SupabaseClient,
  userId: string,
  userEmail: string,
  symbol: string,
  side: string,
  volume: number,
  price: number,
  orderType: string,
  leverage: number,
  margin: number
) {
  console.log('[createDemoOrder] Creating demo order:', { 
    userId, userEmail, symbol, side, volume, price, orderType, leverage, margin 
  });

  // 查找或创建模拟账户
  let dbDemoUser = null;
  const { data: existingUser } = await supabase
    .from('users')
    .select('id, email, balance')
    .eq('email', userEmail)
    .eq('is_demo', true)
    .single();

  if (existingUser) {
    dbDemoUser = existingUser;
    console.log('[createDemoOrder] Found existing demo user:', dbDemoUser.id);
  } else {
    // 创建新的模拟账户
    console.log('[createDemoOrder] Creating new demo user:', userId);
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
      console.error('[createDemoOrder] Failed to create user:', createUserError);
      throw new Error('创建模拟账户失败');
    }
    dbDemoUser = newUser;
  }

  // 检查余额
  if (dbDemoUser.balance < margin) {
    console.warn('[createDemoOrder] Insufficient balance:', { 
      balance: dbDemoUser.balance, margin 
    });
    throw new Error('余额不足');
  }

  // 更新余额
  const { error: updateError } = await supabase
    .from('users')
    .update({ balance: dbDemoUser.balance - margin })
    .eq('id', dbDemoUser.id);

  if (updateError) {
    console.error('[createDemoOrder] Failed to update balance:', updateError);
    throw new Error('扣除保证金失败');
  }

  // 创建订单
  const orderId = `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const orderStatus = orderType === 'market' ? 'open' : 'pending';

  console.log('[createDemoOrder] Inserting order:', { orderId, orderStatus });

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
    console.error('[createDemoOrder] Failed to create order:', insertError);
    // 回滚余额
    await supabase.from('users').update({ balance: dbDemoUser.balance }).eq('id', dbDemoUser.id);
    throw new Error('创建模拟订单失败');
  }

  console.log('[createDemoOrder] Order created successfully:', order.id);
  return order;
}
