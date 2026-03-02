/**
 * 交易 API
 */

import { apiClient } from './client';

export interface Position {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  volume: number;
  openPrice: number;
  currentPrice: number;
  profit: number;
  openTime: string;
  leverage?: number;
  margin?: number;
  status?: 'open' | 'pending' | 'closed';
}

export interface OrderParams {
  symbol: string;
  side: 'buy' | 'sell';
  volume: number;
  price?: number;
  orderType?: 'market' | 'limit';
  leverage?: number;
}

export interface ClosePositionParams {
  id: string;
  price?: number;
}

export interface FlashContractOrder {
  id: string;
  symbol: string;
  side: 'up' | 'down';
  duration: number;
  amount: number;
  openPrice: number;
  closePrice?: number;
  profit: number;
  status: 'pending' | 'won' | 'lost';
  openTime: string;
  closeTime?: string;
}

export interface FlashContractParams {
  symbol: string;
  side: 'up' | 'down';
  duration: number;
  amount: number;
}

/**
 * 获取持仓列表
 */
export async function getPositions(): Promise<{ success: boolean; positions?: Position[]; error?: string }> {
  const response = await apiClient.get<Position[]>('/api/user/positions', { status: 'open' });

  if (response.success) {
    return {
      success: true,
      positions: response.data || [],
    };
  }

  return {
    success: false,
    error: response.error || '获取持仓失败',
  };
}

/**
 * 开仓
 */
export async function openPosition(
  params: OrderParams
): Promise<{ success: boolean; position?: Position; error?: string }> {
  const response = await apiClient.post<Position>('/api/user/positions', params);

  if (response.success && response.data) {
    return {
      success: true,
      position: response.data,
    };
  }

  return {
    success: false,
    error: response.error || '开仓失败',
  };
}

/**
 * 平仓
 */
export async function closePosition(
  params: ClosePositionParams
): Promise<{ success: boolean; profit?: number; error?: string }> {
  const response = await apiClient.post<any>(`/api/user/positions/${params.id}/close`, params);

  if (response.success && response.data) {
    return {
      success: true,
      profit: response.data.profit,
    };
  }

  return {
    success: false,
    error: response.error || '平仓失败',
  };
}

/**
 * 获取历史订单
 */
export async function getOrders(params?: {
  status?: 'open' | 'pending' | 'closed';
  symbol?: string;
  page?: number;
  limit?: number;
}): Promise<{ success: boolean; orders?: Position[]; total?: number; error?: string }> {
  const response = await apiClient.get<any>('/api/user/positions', params);

  if (response.success) {
    return {
      success: true,
      orders: response.data || [],
      total: response.data?.length || 0,
    };
  }

  return {
    success: false,
    error: response.error || '获取订单失败',
  };
}

/**
 * 获取秒合约配置
 */
export async function getSecondsConfig(): Promise<{
  success: boolean;
  durations?: { id: number; duration: number; payout: number }[];
  error?: string;
}> {
  const response = await apiClient.get<any>('/api/trading/seconds-config');

  if (response.success) {
    return {
      success: true,
      durations: response.data.durations || [],
    };
  }

  return {
    success: false,
    error: response.error || '获取秒合约配置失败',
  };
}

/**
 * 创建秒合约订单
 */
export async function createFlashContract(
  params: FlashContractParams
): Promise<{ success: boolean; order?: FlashContractOrder; error?: string }> {
  const response = await apiClient.post<FlashContractOrder>('/api/user/flash-contract', params);

  if (response.success && response.data) {
    return {
      success: true,
      order: response.data,
    };
  }

  return {
    success: false,
    error: response.error || '创建秒合约失败',
  };
}

/**
 * 获取秒合约订单列表
 */
export async function getFlashContracts(params?: {
  status?: 'pending' | 'won' | 'lost';
  page?: number;
  limit?: number;
}): Promise<{ success: boolean; orders?: FlashContractOrder[]; total?: number; error?: string }> {
  const response = await apiClient.get<any>('/api/user/flash-contracts', params);

  if (response.success) {
    return {
      success: true,
      orders: response.data.orders || [],
      total: response.data.total || 0,
    };
  }

  return {
    success: false,
    error: response.error || '获取秒合约订单失败',
  };
}

/**
 * 获取交易对列表
 */
export async function getTradingPairs(): Promise<{ success: boolean; pairs?: any[]; error?: string }> {
  const response = await apiClient.get<any>('/api/trading/pairs');

  if (response.success) {
    return {
      success: true,
      pairs: response.data.pairs || [],
    };
  }

  return {
    success: false,
    error: response.error || '获取交易对失败',
  };
}

/**
 * 获取交易对价格
 */
export async function getMarketPrices(symbols?: string[]): Promise<{
  success: boolean;
  prices?: Record<string, number>;
  error?: string;
}> {
  const response = await apiClient.get<any>('/api/market/prices', { symbols });

  if (response.success) {
    return {
      success: true,
      prices: response.data.prices || {},
    };
  }

  return {
    success: false,
    error: response.error || '获取市场价格失败',
  };
}

/**
 * 触发挂单（将 pending 订单变为 open 状态）
 */
export async function triggerPendingOrder(orderId: string, currentPrice: number): Promise<{
  success: boolean;
  error?: string;
}> {
  const response = await apiClient.post<any>(`/api/user/orders/${orderId}/trigger`, { currentPrice });

  if (response.success) {
    return {
      success: true,
    };
  }

  return {
    success: false,
    error: response.error || '触发挂单失败',
  };
}

/**
 * 获取所有订单（包括 pending 状态）
 */
export async function getAllOrders(params?: {
  status?: 'open' | 'pending' | 'closed';
}): Promise<{ success: boolean; orders?: Position[]; error?: string }> {
  const response = await apiClient.get<Position[]>('/api/user/positions', params);

  if (response.success) {
    return {
      success: true,
      orders: response.data || [],
    };
  }

  return {
    success: false,
    error: response.error || '获取订单失败',
  };
}
