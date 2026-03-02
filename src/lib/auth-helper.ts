import { NextRequest } from 'next/server';
import { supabase } from './supabase';

/**
 * 验证 token 并返回用户 ID
 * @param request Next.js 请求对象
 * @returns 用户 ID，如果验证失败则抛出错误
 */
export async function verifyTokenAndGetUserId(request: NextRequest): Promise<string> {
  // 从 Authorization header 获取 token
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('未提供认证令牌');
  }

  const token = authHeader.substring(7);

  // 简单的 token 验证
  // 支持两种格式：
  // 1. token_<user_id>_<timestamp> - Mock token
  // 2. jwt_token - 实际 JWT token（如果实现的话）
  
  if (token.startsWith('mock_token_')) {
    const match = token.match(/^mock_token_(.+)_(\d+)$/);
    if (!match) {
      throw new Error('无效的认证令牌');
    }
    return match[1];
  }

  if (token.startsWith('token_')) {
    const match = token.match(/^token_(.+)_(\d+)$/);
    if (!match) {
      throw new Error('无效的认证令牌');
    }
    return match[1];
  }

  throw new Error('无效的认证令牌');
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
