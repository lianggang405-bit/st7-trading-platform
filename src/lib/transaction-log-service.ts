import { getSupabaseClient } from '@/storage/database/supabase-client';

export interface TransactionLog {
  id?: number;
  user_id: number;
  type: 'deposit' | 'withdraw' | 'recharge' | 'trade';
  amount: string;
  status: 'pending' | 'success' | 'failed';
  from_address?: string;
  to_address?: string;
  transaction_hash?: string;
  description?: string;
  created_at?: string;
}

export class TransactionLogService {
  /**
   * 记录交易日志
   * @param log 交易日志数据
   * @returns 记录的日志 ID
   */
  static async logTransaction(log: Omit<TransactionLog, 'id' | 'created_at'>): Promise<number> {
    try {
      const supabase = getSupabaseClient();

      // 检查表是否存在，如果不存在则创建
      const { error: tableCheckError } = await supabase
        .from('transaction_logs')
        .select('id')
        .limit(1)
        .single();

      if (tableCheckError && tableCheckError.code === '42P01') {
        console.warn('[TransactionLogService] Table transaction_logs does not exist, creating...');
        await this.createTransactionLogsTable();
      }

      const { data, error } = await supabase
        .from('transaction_logs')
        .insert(log)
        .select('id')
        .single();

      if (error) {
        console.error('[TransactionLogService] Failed to log transaction:', error);
        throw error;
      }

      return data.id;
    } catch (error) {
      console.error('[TransactionLogService] Log transaction error:', error);
      throw error;
    }
  }

  /**
   * 获取用户的交易日志
   * @param userId 用户 ID
   * @param type 交易类型
   * @param limit 限制数量
   * @returns 交易日志列表
   */
  static async getUserLogs(
    userId: number,
    type?: TransactionLog['type'],
    limit: number = 50
  ): Promise<TransactionLog[]> {
    try {
      const supabase = getSupabaseClient();

      let query = supabase
        .from('transaction_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[TransactionLogService] Failed to fetch logs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[TransactionLogService] Fetch logs error:', error);
      return [];
    }
  }

  /**
   * 获取所有交易日志（管理员）
   * @param filters 过滤条件
   * @param limit 限制数量
   * @returns 交易日志列表
   */
  static async getAllLogs(
    filters?: {
      type?: TransactionLog['type'];
      status?: TransactionLog['status'];
      user_id?: number;
    },
    limit: number = 100
  ): Promise<TransactionLog[]> {
    try {
      const supabase = getSupabaseClient();

      let query = supabase
        .from('transaction_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (filters?.type) {
        query = query.eq('type', filters.type);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.user_id) {
        query = query.eq('user_id', filters.user_id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[TransactionLogService] Failed to fetch all logs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[TransactionLogService] Fetch all logs error:', error);
      return [];
    }
  }

  /**
   * 更新交易日志状态
   * @param logId 日志 ID
   * @param status 新状态
   * @param transactionHash 交易哈希
   */
  static async updateLogStatus(
    logId: number,
    status: TransactionLog['status'],
    transactionHash?: string
  ): Promise<void> {
    try {
      const supabase = getSupabaseClient();

      const updateData: Partial<TransactionLog> = { status };
      if (transactionHash) {
        updateData.transaction_hash = transactionHash;
      }

      const { error } = await supabase
        .from('transaction_logs')
        .update(updateData)
        .eq('id', logId);

      if (error) {
        console.error('[TransactionLogService] Failed to update log:', error);
        throw error;
      }
    } catch (error) {
      console.error('[TransactionLogService] Update log error:', error);
      throw error;
    }
  }

  /**
   * 创建交易日志表（如果不存在）
   */
  private static async createTransactionLogsTable(): Promise<void> {
    try {
      const supabase = getSupabaseClient();

      const { error } = await supabase.rpc('create_transaction_logs_table');

      if (error) {
        console.error('[TransactionLogService] Failed to create table:', error);
        // 如果 RPC 不存在，尝试直接插入来触发错误
        console.warn('[TransactionLogService] Please ensure transaction_logs table exists');
      }
    } catch (error) {
      console.error('[TransactionLogService] Create table error:', error);
    }
  }
}

export default TransactionLogService;
