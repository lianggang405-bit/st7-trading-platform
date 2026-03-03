/**
 * 数据库服务 - 使用 Supabase 替代模拟数据
 */

import { getSupabaseClient } from '@/storage/database/supabase-client';

// 用户相关接口
export interface DatabaseUser {
  id: number;
  email: string;
  username: string;
  account_type: 'demo' | 'real';
  balance: string;
  credit_score: number;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

// 申请相关接口
export interface DatabaseApplication {
  id: number;
  user_id: number;
  type: 'deposit' | 'withdraw' | 'verification';
  status: 'pending' | 'approved' | 'rejected';
  amount?: string;
  bank_name?: string;
  bank_account?: string;
  real_name?: string;
  id_card?: string;
  id_card_front_url?: string; // 证件照正面图片 (Base64 字符串，以 data:image/ 开头)
  id_card_back_url?: string;  // 证件照反面图片 (Base64 字符串，以 data:image/ 开头)
  reject_reason?: string;
  created_at: string;
  updated_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
}

// 市场调控记录接口
export interface DatabaseMarketAdjustment {
  id: number;
  action: string;
  symbol: string;
  before_price: string;
  after_price: string;
  change_percent?: string;
  created_by: string;
  created_at: string;
}

// 持仓相关接口
export interface DatabasePosition {
  id: string;
  user_id: number;
  symbol: string;
  side: 'buy' | 'sell';
  volume: string;
  open_price: string;
  current_price: string;
  profit: string;
  leverage?: number;
  open_time: string;
  close_time?: string;
}

class DatabaseService {
  /**
   * 获取用户列表
   */
  async getUsers(accountType?: 'demo' | 'real'): Promise<DatabaseUser[]> {
    const client = getSupabaseClient();
    let query = client.from('users').select('*').order('created_at', { ascending: false });

    if (accountType) {
      query = query.eq('account_type', accountType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[DatabaseService] Failed to fetch users:', error);
      throw new Error('Failed to fetch users');
    }

    return data || [];
  }

  /**
   * 根据 ID 获取用户
   */
  async getUserById(id: number): Promise<DatabaseUser | null> {
    const client = getSupabaseClient();
    const { data, error } = await client.from('users').select('*').eq('id', id).single();

    if (error) {
      console.error('[DatabaseService] Failed to fetch user:', error);
      return null;
    }

    return data;
  }

  /**
   * 创建用户
   */
  async createUser(userData: {
    email: string;
    password_hash: string;
    username: string;
    account_type: 'demo' | 'real';
    balance?: string;
  }): Promise<DatabaseUser | null> {
    const client = getSupabaseClient();
    const { data, error } = await client.from('users').insert({
      email: userData.email,
      password_hash: userData.password_hash,
      username: userData.username,
      account_type: userData.account_type,
      balance: userData.balance || '0',
    }).select().single();

    if (error) {
      console.error('[DatabaseService] Failed to create user:', error);
      return null;
    }

    return data;
  }

  /**
   * 更新用户余额
   */
  async updateUserBalance(
    id: number,
    balance: string,
    reason?: string
  ): Promise<DatabaseUser | null> {
    const client = getSupabaseClient();
    const { data, error } = await client.from('users').update({ balance }).eq('id', id).select().single();

    if (error) {
      console.error('[DatabaseService] Failed to update user balance:', error);
      return null;
    }

    // 记录信用调整历史（如果有原因）
    if (reason) {
      await this.createCreditAdjustment({
        user_id: id,
        before_score: 0,
        after_score: 0,
        change_value: 0,
        reason: `Balance adjustment: ${reason}`,
        created_by: 'system',
      });
    }

    return data;
  }

  /**
   * 更新用户信用分
   */
  async updateUserCreditScore(
    id: number,
    creditScore: number,
    reason: string
  ): Promise<DatabaseUser | null> {
    const client = getSupabaseClient();

    // 先获取当前信用分
    const currentUser = await this.getUserById(id);
    if (!currentUser) return null;

    const { data, error } = await client
      .from('users')
      .update({ credit_score: creditScore })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[DatabaseService] Failed to update user credit score:', error);
      return null;
    }

    // 记录信用调整历史
    await this.createCreditAdjustment({
      user_id: id,
      before_score: currentUser.credit_score,
      after_score: creditScore,
      change_value: creditScore - currentUser.credit_score,
      reason,
      created_by: 'system',
    });

    return data;
  }

  /**
   * 获取申请列表
   */
  async getApplications(filters?: {
    status?: 'pending' | 'approved' | 'rejected';
    type?: 'deposit' | 'withdraw' | 'verification';
  }): Promise<DatabaseApplication[]> {
    const client = getSupabaseClient();
    let query = client.from('applications').select('*').order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.type) {
      query = query.eq('type', filters.type);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[DatabaseService] Failed to fetch applications:', error);
      throw new Error('Failed to fetch applications');
    }

    return data || [];
  }

  /**
   * 根据 ID 获取申请（包含用户信息）
   */
  async getApplicationById(id: number): Promise<(DatabaseApplication & { user?: DatabaseUser }) | null> {
    const client = getSupabaseClient();
    const { data, error } = await client.from('applications').select('*').eq('id', id).single();

    if (error) {
      console.error('[DatabaseService] Failed to fetch application:', error);
      return null;
    }

    // 获取关联的用户信息
    if (data) {
      const user = await this.getUserById(data.user_id);
      return { ...data, user: user || undefined };
    }

    return data ? { ...data, user: undefined } : null;
  }

  /**
   * 创建申请
   */
  async createApplication(applicationData: {
    user_id: number;
    type: 'deposit' | 'withdraw' | 'verification';
    amount?: string;
    bank_name?: string;
    bank_account?: string;
    real_name?: string;
    id_card?: string;
    id_card_front_url?: string;
    id_card_back_url?: string;
  }): Promise<DatabaseApplication | null> {
    // 对于实名认证申请，临时将图片数据存储到现有字段中，等待 schema 缓存刷新
    // schema 缓存问题：PostgREST 无法识别新添加的字段（id_card_front_url, id_card_back_url, extra_data）
    // 临时方案：
    // - id_card: 存储身份证号（最多50字符）
    // - reject_reason: 存储两张图片的 JSON 数据
    if (applicationData.type === 'verification' && applicationData.id_card_front_url && applicationData.id_card_back_url) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.COZE_SUPABASE_URL || '';
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.COZE_SUPABASE_ANON_KEY || '';
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.COZE_SUPABASE_SERVICE_ROLE_KEY || '';

      const apiKey = supabaseServiceKey || supabaseAnonKey;

      // 创建临时数据结构（存储图片到 reject_reason）
      const tempImageData = JSON.stringify({
        frontImage: applicationData.id_card_front_url,
        backImage: applicationData.id_card_back_url
      });

      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/applications`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': apiKey,
            'Authorization': `Bearer ${apiKey}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            user_id: applicationData.user_id,
            type: 'verification',
            status: 'pending',
            real_name: applicationData.real_name,
            id_card: applicationData.id_card, // 存储身份证号
            reject_reason: tempImageData // 临时存储图片数据
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[DatabaseService] REST API error:', response.status, errorText);
          return null;
        }

        const data = await response.json();
        const result = data[0] as DatabaseApplication;

        // 从临时字段中提取图片数据
        if (result) {
          try {
            const imageData = JSON.parse(result.reject_reason || '{}');
            result.id_card_front_url = imageData.frontImage;
            result.id_card_back_url = imageData.backImage;
            result.reject_reason = null; // 清除临时存储
          } catch (e) {
            console.error('[DatabaseService] Failed to parse temporary image data:', e);
          }
        }

        return result;
      } catch (error) {
        console.error('[DatabaseService] Failed to create verification application:', error);
        return null;
      }
    }

    // 对于其他类型的申请（入金、出金），使用 Supabase 客户端
    const client = getSupabaseClient();
    const { data, error } = await client.from('applications').insert(applicationData).select().single();

    if (error) {
      console.error('[DatabaseService] Failed to create application:', error);
      return null;
    }

    return data;
  }

  /**
   * 更新申请状态
   */
  async updateApplicationStatus(
    id: number,
    status: 'approved' | 'rejected',
    reviewedBy: string,
    rejectReason?: string
  ): Promise<DatabaseApplication | null> {
    const client = getSupabaseClient();
    const updateData: any = {
      status,
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
    };

    if (rejectReason) {
      updateData.reject_reason = rejectReason;
    }

    const { data, error } = await client.from('applications').update(updateData).eq('id', id).select().single();

    if (error) {
      console.error('[DatabaseService] Failed to update application status:', error);
      return null;
    }

    return data;
  }

  /**
   * 获取市场调控记录
   */
  async getMarketAdjustments(limit?: number): Promise<DatabaseMarketAdjustment[]> {
    const client = getSupabaseClient();
    let query = client.from('market_adjustments').select('*').order('created_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[DatabaseService] Failed to fetch market adjustments:', error);
      throw new Error('Failed to fetch market adjustments');
    }

    return data || [];
  }

  /**
   * 创建市场调控记录
   */
  async createMarketAdjustment(adjustment: {
    action: string;
    symbol: string;
    before_price: string;
    after_price: string;
    change_percent?: string;
    created_by: string;
  }): Promise<DatabaseMarketAdjustment | null> {
    const client = getSupabaseClient();
    const { data, error } = await client.from('market_adjustments').insert(adjustment).select().single();

    if (error) {
      console.error('[DatabaseService] Failed to create market adjustment:', error);
      return null;
    }

    return data;
  }

  /**
   * 创建信用调整记录
   */
  async createCreditAdjustment(adjustment: {
    user_id: number;
    before_score: number;
    after_score: number;
    change_value: number;
    reason: string;
    created_by: string;
  }): Promise<any | null> {
    const client = getSupabaseClient();
    const { data, error } = await client.from('credit_adjustments').insert(adjustment).select().single();

    if (error) {
      console.error('[DatabaseService] Failed to create credit adjustment:', error);
      return null;
    }

    return data;
  }

  /**
   * 获取用户的持仓列表
   */
  async getPositions(userId: number): Promise<DatabasePosition[]> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('positions')
      .select('*')
      .eq('user_id', userId)
      .is('close_time', null)
      .order('open_time', { ascending: false });

    if (error) {
      console.error('[DatabaseService] Failed to fetch positions:', error);
      return [];
    }

    return data || [];
  }

  /**
   * 创建持仓
   */
  async createPosition(position: {
    id: string;
    user_id: number;
    symbol: string;
    side: 'buy' | 'sell';
    volume: string;
    open_price: string;
    current_price: string;
    leverage?: number;
  }): Promise<DatabasePosition | null> {
    const client = getSupabaseClient();
    const { data, error } = await client.from('positions').insert(position).select().single();

    if (error) {
      console.error('[DatabaseService] Failed to create position:', error);
      return null;
    }

    return data;
  }

  /**
   * 更新持仓
   */
  async updatePosition(id: string, updates: Partial<DatabasePosition>): Promise<DatabasePosition | null> {
    const client = getSupabaseClient();
    const { data, error } = await client.from('positions').update(updates).eq('id', id).select().single();

    if (error) {
      console.error('[DatabaseService] Failed to update position:', error);
      return null;
    }

    return data;
  }

  /**
   * 平仓
   */
  async closePosition(id: string, currentPrice: string): Promise<DatabasePosition | null> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('positions')
      .update({
        current_price: currentPrice,
        close_time: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[DatabaseService] Failed to close position:', error);
      return null;
    }

    return data;
  }

  /**
   * 批量更新持仓价格
   */
  async updatePositionsBySymbol(symbol: string, currentPrice: string): Promise<void> {
    const client = getSupabaseClient();

    // 获取该交易品种的所有持仓
    const { data: positions } = await client
      .from('positions')
      .select('*')
      .eq('symbol', symbol)
      .is('close_time', null);

    if (!positions || positions.length === 0) return;

    // 批量更新
    for (const position of positions) {
      // 计算盈亏
      let profit = 0;
      const openPrice = parseFloat(position.open_price);
      const volume = parseFloat(position.volume);

      if (position.side === 'buy') {
        profit = (parseFloat(currentPrice) - openPrice) * volume;
      } else {
        profit = (openPrice - parseFloat(currentPrice)) * volume;
      }

      await client
        .from('positions')
        .update({
          current_price: currentPrice,
          profit: profit.toFixed(2),
        })
        .eq('id', position.id);
    }
  }
}

// 导出单例
export const databaseService = new DatabaseService();
