/**
 * 用户验证 API
 * 
 * 安全策略：
 * 1. 必须从数据库验证用户凭据
 * 2. 移除所有 mock-success 回退
 * 3. 失败必须返回真实错误
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/storage/database/supabase-admin-client';
import bcrypt from 'bcrypt';
import { generateUserToken } from '@/lib/auth-helper';
import { errors, successResponse } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // 参数校验
    if (!email) {
      return errors.missingParam('email');
    }

    if (!password) {
      return errors.missingParam('password');
    }

    // 获取数据库客户端
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      console.error('[Validate API] 数据库未配置');
      return errors.serviceUnavailable('数据库');
    }

    // 从数据库查找用户
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (dbError || !dbUser) {
      console.log(`[Validate API] 用户不存在: ${email}`);
      return errors.unauthorized('邮箱或密码错误');
    }

    // 验证密码
    const passwordMatch = await bcrypt.compare(password, dbUser.password_hash);

    if (!passwordMatch) {
      console.log(`[Validate API] 密码错误: ${email}`);
      return errors.unauthorized('邮箱或密码错误');
    }

    // 更新最后登录时间
    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', dbUser.id);

    // 生成 JWT token
    const token = await generateUserToken(dbUser.id, dbUser.email);

    return successResponse({
      user: {
        id: dbUser.id,
        username: dbUser.username,
        email: dbUser.email,
        balance: dbUser.balance || 0,
        accountType: dbUser.account_type || 'demo',
        createdAt: dbUser.created_at,
      },
      token,
    }, { message: '登录成功' });

  } catch (err: any) {
    console.error('[Validate API] Error:', err);
    
    // bcrypt 比较失败
    if (err.message?.includes('Invalid secret')) {
      return errors.internalError('密码验证失败');
    }
    
    return errors.internalError('验证失败');
  }
}
