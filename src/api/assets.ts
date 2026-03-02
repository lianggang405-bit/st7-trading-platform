/**
 * 资产管理 API
 */

import { apiClient } from './client';

export interface AssetInfo {
  balance: number;
  equity: number;
  usedMargin: number;
  freeMargin: number;
  floatingProfit: number;
  lockedBalance: number;
}

export interface DepositRequest {
  amount: number;
  currency?: string;
  address?: string;
  txHash?: string;
  network?: string;
}

export interface WithdrawalRequest {
  amount: number;
  currency?: string;
  address: string;
  network?: string;
}

export interface BankDepositRequest {
  amount: number;
  currency: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  transferTime: string;
  proofImage?: string;
}

export interface BankWithdrawalRequest {
  amount: number;
  currency: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

export interface BalanceAdjustment {
  amount: number;
  type: 'add' | 'subtract';
  reason: string;
}

/**
 * 获取用户资产信息
 */
export async function getAssets(): Promise<{ success: boolean; assets?: AssetInfo; error?: string }> {
  const token = localStorage.getItem('token');
  if (!token) {
    return {
      success: false,
      error: '未登录',
    };
  }

  const response = await apiClient.get<AssetInfo>('/api/user/assets');

  if (response.success && response.data) {
    return {
      success: true,
      assets: response.data,
    };
  }

  return {
    success: false,
    error: response.error || '获取资产信息失败',
  };
}

/**
 * 更新余额（交易后调用）
 */
export async function updateBalance(params: {
  amount: number;
  reason: string;
}): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  const response = await apiClient.post<any>('/api/user/balance/update', params);

  if (response.success && response.data) {
    return {
      success: true,
      newBalance: response.data.balance,
    };
  }

  return {
    success: false,
    error: response.error || '更新余额失败',
  };
}

/**
 * 申请加密货币充值
 */
export async function requestDeposit(
  params: DepositRequest
): Promise<{ success: boolean; requestId?: string; error?: string }> {
  const response = await apiClient.post<any>('/api/user/deposit', params);

  if (response.success && response.data) {
    return {
      success: true,
      requestId: response.data.id,
    };
  }

  return {
    success: false,
    error: response.error || '充值申请失败',
  };
}

/**
 * 申请加密货币提现
 */
export async function requestWithdrawal(
  params: WithdrawalRequest
): Promise<{ success: boolean; requestId?: string; error?: string }> {
  const response = await apiClient.post<any>('/api/user/withdrawal', params);

  if (response.success && response.data) {
    return {
      success: true,
      requestId: response.data.id,
    };
  }

  return {
    success: false,
    error: response.error || '提现申请失败',
  };
}

/**
 * 申请银行充值
 */
export async function requestBankDeposit(
  params: BankDepositRequest
): Promise<{ success: boolean; requestId?: string; error?: string }> {
  const response = await apiClient.post<any>('/api/user/bank-deposit', params);

  if (response.success && response.data) {
    return {
      success: true,
      requestId: response.data.id,
    };
  }

  return {
    success: false,
    error: response.error || '银行充值申请失败',
  };
}

/**
 * 申请银行提现
 */
export async function requestBankWithdrawal(
  params: BankWithdrawalRequest
): Promise<{ success: boolean; requestId?: string; error?: string }> {
  const response = await apiClient.post<any>('/api/user/bank-withdrawal', params);

  if (response.success && response.data) {
    return {
      success: true,
      requestId: response.data.id,
    };
  }

  return {
    success: false,
    error: response.error || '银行提现申请失败',
  };
}

/**
 * 获取充值/提现记录
 */
export async function getFinancialRecords(params?: {
  type?: 'deposit' | 'withdrawal' | 'adjustment';
  page?: number;
  limit?: number;
}): Promise<{ success: boolean; records?: any[]; total?: number; error?: string }> {
  const response = await apiClient.get<any>('/api/user/financial-records', params);

  if (response.success) {
    return {
      success: true,
      records: response.data.records || [],
      total: response.data.total || 0,
    };
  }

  return {
    success: false,
    error: response.error || '获取记录失败',
  };
}

/**
 * 获取充值地址
 */
export async function getDepositAddress(currency?: string): Promise<{
  success: boolean;
  address?: string;
  network?: string;
  error?: string;
}> {
  const response = await apiClient.get<any>('/api/user/deposit-address', { currency });

  if (response.success && response.data) {
    return {
      success: true,
      address: response.data.address,
      network: response.data.network,
    };
  }

  return {
    success: false,
    error: response.error || '获取充值地址失败',
  };
}
