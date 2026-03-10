/**
 * 交易流水服务
 * 
 * 用于记录用户的资金变动历史
 */

import { getSupabaseClient } from '@/storage/database/supabase-client';

// 交易类型
export type TransactionType =
  | 'deposit'        // 充值
  | 'withdraw'       // 提现
  | 'transfer'       // 转账
  | 'fee'            // 手续费
  | 'open_position'  // 开仓
  | 'close_position' // 平仓
  | 'adjustment'     // 调整
  | 'bonus'          // 奖金
  | 'penalty';       // 罚款

// 交易流水接口
export interface Transaction {
  id: number;
  user_id: number;
  type: TransactionType;
  amount: number;
  balance: number;
  order_id?: string;
  description?: string;
  related_user_id?: number;
  created_at: string;
  updated_at: string;
}

// 创建交易流水参数
export interface CreateTransactionParams {
  user_id: number;
  type: TransactionType;
  amount: number;
  balance: number;
  order_id?: string;
  description?: string;
  related_user_id?: number;
}

/**
 * 创建交易流水
 */
export async function createTransaction(
  params: CreateTransactionParams
): Promise<Transaction | null> {
  const client = getSupabaseClient();

  try {
    const { data, error } = await client
      .from('transactions')
      .insert(params)
      .select()
      .single();

    if (error) {
      console.error('[TransactionService] Failed to create transaction:', error);
      return null;
    }

    console.log('[TransactionService] Transaction created:', {
      type: params.type,
      amount: params.amount,
      balance: params.balance,
    });

    return data;
  } catch (error) {
    console.error('[TransactionService] Failed to create transaction:', error);
    return null;
  }
}

/**
 * 批量创建交易流水
 */
export async function createTransactions(
  transactions: CreateTransactionParams[]
): Promise<Transaction[] | null> {
  const client = getSupabaseClient();

  try {
    const { data, error } = await client
      .from('transactions')
      .insert(transactions)
      .select();

    if (error) {
      console.error('[TransactionService] Failed to create transactions:', error);
      return null;
    }

    return data || [];
  } catch (error) {
    console.error('[TransactionService] Failed to create transactions:', error);
    return null;
  }
}

/**
 * 获取用户交易流水
 */
export async function getUserTransactions(
  userId: number,
  options?: {
    type?: TransactionType;
    limit?: number;
    offset?: number;
    startDate?: string;
    endDate?: string;
  }
): Promise<{ transactions: Transaction[]; total: number }> {
  const client = getSupabaseClient();

  try {
    let query = client
      .from('transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // 类型过滤
    if (options?.type) {
      query = query.eq('type', options.type);
    }

    // 日期范围过滤
    if (options?.startDate) {
      query = query.gte('created_at', options.startDate);
    }
    if (options?.endDate) {
      query = query.lte('created_at', options.endDate);
    }

    // 分页
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('[TransactionService] Failed to fetch transactions:', error);
      return { transactions: [], total: 0 };
    }

    return {
      transactions: data || [],
      total: count || 0,
    };
  } catch (error) {
    console.error('[TransactionService] Failed to fetch transactions:', error);
    return { transactions: [], total: 0 };
  }
}

/**
 * 获取指定订单的交易流水
 */
export async function getOrderTransactions(
  orderId: string
): Promise<Transaction[]> {
  const client = getSupabaseClient();

  try {
    const { data, error } = await client
      .from('transactions')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[TransactionService] Failed to fetch order transactions:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[TransactionService] Failed to fetch order transactions:', error);
    return [];
  }
}

/**
 * 获取用户资金变动统计
 */
export async function getUserBalanceStats(
  userId: number,
  startDate?: string,
  endDate?: string
): Promise<{
  totalDeposit: number;
  totalWithdraw: number;
  totalProfit: number;
  totalLoss: number;
  transactionCount: number;
}> {
  const client = getSupabaseClient();

  try {
    let query = client
      .from('transactions')
      .select('type, amount')
      .eq('user_id', userId);

    // 日期范围过滤
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[TransactionService] Failed to fetch balance stats:', error);
      return {
        totalDeposit: 0,
        totalWithdraw: 0,
        totalProfit: 0,
        totalLoss: 0,
        transactionCount: 0,
      };
    }

    const transactions = data || [];

    let totalDeposit = 0;
    let totalWithdraw = 0;
    let totalProfit = 0;
    let totalLoss = 0;

    transactions.forEach((t) => {
      const amount = parseFloat(String(t.amount));
      switch (t.type) {
        case 'deposit':
        case 'bonus':
          totalDeposit += amount;
          break;
        case 'withdraw':
        case 'penalty':
          totalWithdraw += amount;
          break;
        case 'close_position':
          if (amount > 0) {
            totalProfit += amount;
          } else {
            totalLoss += Math.abs(amount);
          }
          break;
      }
    });

    return {
      totalDeposit,
      totalWithdraw,
      totalProfit,
      totalLoss,
      transactionCount: transactions.length,
    };
  } catch (error) {
    console.error('[TransactionService] Failed to fetch balance stats:', error);
    return {
      totalDeposit: 0,
      totalWithdraw: 0,
      totalProfit: 0,
      totalLoss: 0,
      transactionCount: 0,
    };
  }
}

// 导出单例
export const transactionService = {
  createTransaction,
  createTransactions,
  getUserTransactions,
  getOrderTransactions,
  getUserBalanceStats,
};
