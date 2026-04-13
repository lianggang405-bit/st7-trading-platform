/**
 * 用户认证辅助函数
 * 
 * 迁移到 auth-kernel.ts 的统一认证体系
 * 保留数据库用户验证功能
 */

import { NextRequest } from 'next/server';
import { supabase } from './supabase';
import { 
  signAccessToken, 
  verifyAccessToken, 
  parseBearerToken,
  requireAuth,
  type TokenRole,
  type JWTPayload 
} from './auth-kernel';

/**
 * 验证 token 并返回用户 ID
 * @param request Next.js 请求对象
 * @returns 用户 ID，如果验证失败则抛出错误
 */
export async function verifyTokenAndGetUserId(request: NextRequest): Promise<string> {
  const token = parseBearerToken(request);
  if (!token) {
    throw new Error('未提供认证令牌');
  }

  // 使用新的 JWT 验签
  const payload = await verifyAccessToken(token, 'user');
  if (!payload) {
    throw new Error('无效或过期的认证令牌');
  }

  return payload.sub;
}

/**
 * 验证用户是否存在
 * @param userId 用户 ID
 * @returns 用户对象，如果不存在则抛出错误
 */
export async function verifyUserExists(userId: string) {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, status, account_type')
    .eq('id', userId)
    .single();

  if (error || !user) {
    throw new Error('用户不存在');
  }

  return user;
}

/**
 * 生成用户登录 JWT
 * @param userId 用户 ID
 * @param email 用户邮箱
 * @returns JWT token
 */
export async function generateUserToken(userId: string, email?: string): Promise<string> {
  return signAccessToken({
    sub: userId,
    role: 'user',
    email,
  }, 'user');
}

// 导出认证内核函数供其他模块使用
export { 
  signAccessToken, 
  verifyAccessToken, 
  parseBearerToken,
  requireAuth,
  type TokenRole,
  type JWTPayload 
};
