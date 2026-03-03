/**
 * 订单监控和触发服务
 * 用于监控 pending 状态的限价单，当价格达到触发条件时自动成交
 */

import { getSupabaseAdminClient } from '@/storage/database/supabase-admin-client';
import { getBatchRealPrices } from '@/lib/market-data-source';

export interface PendingOrder {
  id: string;
  user_id: string;
  email: string;
  symbol: string;
  side: 'buy' | 'sell';
  order_type: 'market' | 'limit';
  quantity: number;
  price: number;
  leverage: number;
  status: 'pending' | 'open' | 'closed' | 'cancelled';
  profit: number;
  margin: number;
  created_at: string;
  updated_at: string;
}

export interface TriggerResult {
  success: boolean;
  triggered: number; // 触发的订单数量
  failed: number; // 触发失败的订单数量
  errors: string[];
}

/**
 * 获取所有 pending 状态的限价单
 */
async function getPendingOrders(): Promise<PendingOrder[]> {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('status', 'pending')
    .eq('order_type', 'limit')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[OrderMonitor] Error fetching pending orders:', error);
    return [];
  }

  return data || [];
}

/**
 * 检查订单触发条件
 * @param order 订单
 * @param currentPrice 当前价格
 * @returns 是否应该触发
 */
function shouldTriggerOrder(order: PendingOrder, currentPrice: number): boolean {
  if (order.side === 'buy') {
    // 买单：当前价格 <= 订单价格时触发（价格降到指定价格时买入）
    return currentPrice <= order.price;
  } else {
    // 卖单：当前价格 >= 订单价格时触发（价格涨到指定价格时卖出）
    return currentPrice >= order.price;
  }
}

/**
 * 触发订单（将 pending 改为 open，并创建持仓）
 * @param order 订单
 * @param currentPrice 当前价格
 * @returns 是否成功
 */
async function triggerOrder(order: PendingOrder, currentPrice: number): Promise<boolean> {
  const supabase = getSupabaseAdminClient();

  try {
    console.log(`[OrderMonitor] Triggering order ${order.id} for ${order.symbol} at ${currentPrice}`);

    // 更新订单状态为 open
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'open',
        price: currentPrice, // 使用实际成交价格
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id);

    if (updateError) {
      console.error('[OrderMonitor] Error updating order status:', updateError);
      return false;
    }

    // 创建持仓记录
    const { error: positionError } = await supabase
      .from('positions')
      .insert([
        {
          user_id: order.user_id,
          email: order.email,
          symbol: order.symbol,
          side: order.side,
          quantity: order.quantity,
          open_price: currentPrice,
          current_price: currentPrice,
          leverage: order.leverage,
          margin: order.margin,
          profit: 0,
          status: 'open',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

    if (positionError) {
      console.error('[OrderMonitor] Error creating position:', positionError);
      // 即使持仓创建失败，订单状态也已经更新，需要回滚
      await supabase
        .from('orders')
        .update({
          status: 'pending',
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);
      return false;
    }

    console.log(`[OrderMonitor] Order ${order.id} triggered successfully`);
    return true;
  } catch (error) {
    console.error('[OrderMonitor] Error triggering order:', error);
    return false;
  }
}

/**
 * 监控并触发 pending 订单
 * @returns 触发结果
 */
export async function monitorAndTriggerOrders(): Promise<TriggerResult> {
  console.log('[OrderMonitor] Starting order monitoring...');

  const pendingOrders = await getPendingOrders();

  if (pendingOrders.length === 0) {
    console.log('[OrderMonitor] No pending orders found');
    return {
      success: true,
      triggered: 0,
      failed: 0,
      errors: [],
    };
  }

  console.log(`[OrderMonitor] Found ${pendingOrders.length} pending orders`);

  // 获取所有相关交易对的实时价格
  const symbols = [...new Set(pendingOrders.map(order => order.symbol))];
  const prices = await getBatchRealPrices(symbols);

  let triggered = 0;
  let failed = 0;
  const errors: string[] = [];

  // 检查每个订单的触发条件
  for (const order of pendingOrders) {
    const currentPrice = prices[order.symbol];

    if (!currentPrice) {
      console.warn(`[OrderMonitor] No price data for ${order.symbol}`);
      continue;
    }

    if (shouldTriggerOrder(order, currentPrice)) {
      console.log(`[OrderMonitor] Order ${order.id} condition met: ${order.side} at ${order.price}, current: ${currentPrice}`);
      const success = await triggerOrder(order, currentPrice);

      if (success) {
        triggered++;
      } else {
        failed++;
        errors.push(`订单 ${order.id} 触发失败`);
      }
    }
  }

  console.log(`[OrderMonitor] Monitoring completed: ${triggered} triggered, ${failed} failed`);

  return {
    success: true,
    triggered,
    failed,
    errors,
  };
}

/**
 * 取消过期的订单（超过24小时未触发）
 */
export async function cancelExpiredOrders(): Promise<number> {
  const supabase = getSupabaseAdminClient();

  // 24小时前的时间
  const expiredTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('orders')
    .select('id')
    .eq('status', 'pending')
    .eq('order_type', 'limit')
    .lt('created_at', expiredTime);

  if (error) {
    console.error('[OrderMonitor] Error fetching expired orders:', error);
    return 0;
  }

  if (!data || data.length === 0) {
    return 0;
  }

  console.log(`[OrderMonitor] Found ${data.length} expired orders`);

  // 取消过期订单
  const { error: updateError } = await supabase
    .from('orders')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('status', 'pending')
    .eq('order_type', 'limit')
    .lt('created_at', expiredTime);

  if (updateError) {
    console.error('[OrderMonitor] Error cancelling expired orders:', updateError);
    return 0;
  }

  console.log(`[OrderMonitor] Cancelled ${data.length} expired orders`);
  return data.length;
}

/**
 * 定时监控入口（每30秒执行一次）
 */
export async function scheduleOrderMonitoring(): Promise<NodeJS.Timeout> {
  console.log('[OrderMonitor] Scheduling order monitoring (every 30 seconds)...');

  // 立即执行一次
  await monitorAndTriggerOrders();
  await cancelExpiredOrders();

  // 每30秒执行一次
  const intervalId = setInterval(async () => {
    await monitorAndTriggerOrders();
    await cancelExpiredOrders();
  }, 30000); // 30秒

  return intervalId;
}

/**
 * 手动触发监控（供 API 调用）
 */
export async function manualTriggerOrders(): Promise<TriggerResult> {
  return await monitorAndTriggerOrders();
}
