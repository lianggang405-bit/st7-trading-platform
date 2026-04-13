import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, type RouteContext } from '@/lib/admin-guard';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { errors, successResponse } from '@/lib/api-response';

// 检查 Supabase 环境变量是否配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const hasSupabaseConfig = supabaseUrl && supabaseServiceKey;

/**
 * 内部函数：获取 Supabase 客户端
 * 如果未配置，抛出错误而不是返回 mock
 */
function getSupabase() {
  if (!hasSupabaseConfig) {
    throw new Error('数据库未配置');
  }
  return getSupabaseClient();
}

// GET - 获取单个合约订单详情
export const GET = withAdminAuth(async (
  _request: NextRequest,
  _admin,
  context?: RouteContext
) => {
  try {
    const params = await context?.params;
    const orderId = params?.id;

    if (!orderId) {
      return errors.missingParam('id');
    }

    const supabase = getSupabase();
    
    const { data: order, error } = await supabase
      .from('contract_orders')
      .select('*')
      .eq('id', parseInt(orderId))
      .single();

    if (error || !order) {
      return errors.orderNotFound(orderId);
    }

    return successResponse({ order });
  } catch (err: any) {
    console.error('[ContractOrder GET] Error:', err);
    
    if (err.message === '数据库未配置') {
      return errors.serviceUnavailable('数据库');
    }
    
    return errors.databaseError('获取订单失败', { originalError: err.message });
  }
});

// PATCH - 更新合约订单状态
export const PATCH = withAdminAuth(async (
  request: NextRequest,
  _admin,
  context?: RouteContext
) => {
  try {
    const params = await context?.params;
    const orderId = params?.id;

    if (!orderId) {
      return errors.missingParam('id');
    }

    const body = await request.json();
    const { status } = body;

    if (!status) {
      return errors.missingParam('status');
    }

    if (!['pending', 'completed', 'cancelled', 'rejected'].includes(status)) {
      return errors.invalidParam('status', `无效的状态值: ${status}`);
    }

    const supabase = getSupabase();

    const { error } = await supabase
      .from('contract_orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', parseInt(orderId));

    if (error) {
      console.error('[ContractOrder PATCH] DB Error:', error);
      return errors.databaseError('更新订单失败', { dbError: error.message });
    }

    return successResponse(undefined, { message: '订单状态已更新' });
  } catch (err: any) {
    console.error('[ContractOrder PATCH] Error:', err);
    
    if (err.message === '数据库未配置') {
      return errors.serviceUnavailable('数据库');
    }
    
    return errors.internalError('更新订单失败');
  }
});

// DELETE - 删除合约订单
export const DELETE = withAdminAuth(async (
  _request: NextRequest,
  _admin,
  context?: RouteContext
) => {
  try {
    const params = await context?.params;
    const orderId = params?.id;

    if (!orderId) {
      return errors.missingParam('id');
    }

    const supabase = getSupabase();

    const { error } = await supabase
      .from('contract_orders')
      .delete()
      .eq('id', parseInt(orderId));

    if (error) {
      console.error('[ContractOrder DELETE] DB Error:', error);
      return errors.databaseError('删除订单失败', { dbError: error.message });
    }

    return successResponse(undefined, { message: '订单已删除' });
  } catch (err: any) {
    console.error('[ContractOrder DELETE] Error:', err);
    
    if (err.message === '数据库未配置') {
      return errors.serviceUnavailable('数据库');
    }
    
    return errors.internalError('删除订单失败');
  }
});
