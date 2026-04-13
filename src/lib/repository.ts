/**
 * 数据源仓储层
 * 
 * 统一管理数据来源：
 * - real: Supabase 数据库
 * - fallback: 降级策略
 * 
 * 所有 API 应使用此层访问数据，而不是直接判断 mock
 */

import { supabaseAdmin } from '@/storage/database/supabase-admin-client';
import { supabase } from '@/storage/database/supabase-client';

/* ─── 仓储选项 ─────────────────────────────────────────────── */

export interface RepositoryOptions {
  /** 是否允许使用 fallback 数据 */
  allowFallback?: boolean;
  /** 操作超时时间（毫秒） */
  timeout?: number;
}

const DEFAULT_OPTIONS: RepositoryOptions = {
  allowFallback: false,
  timeout: 5000,
};

/* ─── 数据库健康检查 ───────────────────────────────────────── */

export async function isDatabaseAvailable(): Promise<boolean> {
  if (!supabaseAdmin) {
    return false;
  }

  try {
    const { error } = await supabaseAdmin.from('users').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}

/* ─── 用户仓储 ─────────────────────────────────────────────── */

export interface UserRepository {
  findById(id: string): Promise<any | null>;
  findByEmail(email: string): Promise<any | null>;
  updateBalance(userId: string, amount: number): Promise<boolean>;
}

export const userRepository: UserRepository = {
  async findById(id: string, options = DEFAULT_OPTIONS) {
    if (!supabaseAdmin) {
      if (options.allowFallback) {
        console.warn('[UserRepo] 数据库不可用，返回 null');
        return null;
      }
      throw new Error('DATABASE_UNAVAILABLE');
    }

    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('[UserRepo] findById error:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('[UserRepo] findById exception:', err);
      if (options.allowFallback) {
        return null;
      }
      throw new Error('DATABASE_ERROR');
    }
  },

  async findByEmail(email: string, options = DEFAULT_OPTIONS) {
    if (!supabaseAdmin) {
      if (options.allowFallback) {
        console.warn('[UserRepo] 数据库不可用，返回 null');
        return null;
      }
      throw new Error('DATABASE_UNAVAILABLE');
    }

    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (error) {
        return null;
      }

      return data;
    } catch (err) {
      console.error('[UserRepo] findByEmail exception:', err);
      if (options.allowFallback) {
        return null;
      }
      throw new Error('DATABASE_ERROR');
    }
  },

  async updateBalance(userId: string, amount: number, options = DEFAULT_OPTIONS) {
    if (!supabaseAdmin) {
      if (options.allowFallback) {
        console.warn('[UserRepo] 数据库不可用，跳过余额更新');
        return false;
      }
      throw new Error('DATABASE_UNAVAILABLE');
    }

    try {
      const { error } = await supabaseAdmin.rpc('update_user_balance', {
        user_id: userId,
        amount: amount,
      });

      if (error) {
        console.error('[UserRepo] updateBalance error:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('[UserRepo] updateBalance exception:', err);
      if (options.allowFallback) {
        return false;
      }
      throw new Error('DATABASE_ERROR');
    }
  },
};

/* ─── 订单仓储 ─────────────────────────────────────────────── */

export interface Order {
  id: number;
  user_id: string;
  symbol: string;
  type: string;
  amount: number;
  price: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface OrderRepository {
  findById(id: number): Promise<Order | null>;
  findByUserId(userId: string): Promise<Order[]>;
  create(order: Partial<Order>): Promise<Order>;
  updateStatus(id: number, status: string): Promise<boolean>;
  delete(id: number): Promise<boolean>;
}

export const orderRepository: OrderRepository = {
  async findById(id: number, options = DEFAULT_OPTIONS) {
    if (!supabaseAdmin) {
      if (options.allowFallback) return null;
      throw new Error('DATABASE_UNAVAILABLE');
    }

    try {
      const { data, error } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();

      return error ? null : data;
    } catch (err) {
      console.error('[OrderRepo] findById error:', err);
      if (options.allowFallback) return null;
      throw new Error('DATABASE_ERROR');
    }
  },

  async findByUserId(userId: string, options = DEFAULT_OPTIONS) {
    if (!supabaseAdmin) {
      if (options.allowFallback) return [];
      throw new Error('DATABASE_UNAVAILABLE');
    }

    try {
      const { data, error } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      return error ? [] : (data || []);
    } catch (err) {
      console.error('[OrderRepo] findByUserId error:', err);
      if (options.allowFallback) return [];
      throw new Error('DATABASE_ERROR');
    }
  },

  async create(orderData: Partial<Order>, options = DEFAULT_OPTIONS) {
    if (!supabaseAdmin) {
      if (options.allowFallback) throw new Error('DATABASE_UNAVAILABLE');
      throw new Error('DATABASE_UNAVAILABLE');
    }

    const { data, error } = await supabaseAdmin
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (error) {
      console.error('[OrderRepo] create error:', error);
      throw new Error(`创建订单失败: ${error.message}`);
    }

    return data;
  },

  async updateStatus(id: number, status: string, options = DEFAULT_OPTIONS) {
    if (!supabaseAdmin) {
      if (options.allowFallback) return false;
      throw new Error('DATABASE_UNAVAILABLE');
    }

    const { error } = await supabaseAdmin
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('[OrderRepo] updateStatus error:', error);
      return false;
    }

    return true;
  },

  async delete(id: number, options = DEFAULT_OPTIONS) {
    if (!supabaseAdmin) {
      if (options.allowFallback) return false;
      throw new Error('DATABASE_UNAVAILABLE');
    }

    const { error } = await supabaseAdmin
      .from('orders')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[OrderRepo] delete error:', error);
      return false;
    }

    return true;
  },
};

/* ─── 持仓仓储 ─────────────────────────────────────────────── */

export interface PositionRepository {
  findByUserId(userId: string): Promise<any[]>;
  findByUserAndSymbol(userId: string, symbol: string): Promise<any | null>;
  create(position: any): Promise<any>;
  update(id: number, data: any): Promise<boolean>;
}

export const positionRepository: PositionRepository = {
  async findByUserId(userId: string, options = DEFAULT_OPTIONS) {
    if (!supabaseAdmin) {
      if (options.allowFallback) return [];
      throw new Error('DATABASE_UNAVAILABLE');
    }

    try {
      const { data, error } = await supabaseAdmin
        .from('positions')
        .select('*')
        .eq('user_id', userId);

      return error ? [] : (data || []);
    } catch (err) {
      console.error('[PositionRepo] findByUserId error:', err);
      if (options.allowFallback) return [];
      throw new Error('DATABASE_ERROR');
    }
  },

  async findByUserAndSymbol(userId: string, symbol: string, options = DEFAULT_OPTIONS) {
    if (!supabaseAdmin) {
      if (options.allowFallback) return null;
      throw new Error('DATABASE_UNAVAILABLE');
    }

    try {
      const { data, error } = await supabaseAdmin
        .from('positions')
        .select('*')
        .eq('user_id', userId)
        .eq('symbol', symbol)
        .single();

      return error ? null : data;
    } catch (err) {
      console.error('[PositionRepo] findByUserAndSymbol error:', err);
      if (options.allowFallback) return null;
      throw new Error('DATABASE_ERROR');
    }
  },

  async create(positionData: any, options = DEFAULT_OPTIONS) {
    if (!supabaseAdmin) {
      throw new Error('DATABASE_UNAVAILABLE');
    }

    const { data, error } = await supabaseAdmin
      .from('positions')
      .insert(positionData)
      .select()
      .single();

    if (error) {
      console.error('[PositionRepo] create error:', error);
      throw new Error(`创建持仓失败: ${error.message}`);
    }

    return data;
  },

  async update(id: number, updateData: any, options = DEFAULT_OPTIONS) {
    if (!supabaseAdmin) {
      if (options.allowFallback) return false;
      throw new Error('DATABASE_UNAVAILABLE');
    }

    const { error } = await supabaseAdmin
      .from('positions')
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('[PositionRepo] update error:', error);
      return false;
    }

    return true;
  },
};
