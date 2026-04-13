/**
 * 管理员认证模块
 * 
 * 安全策略：
 * 1. 必须从数据库读取管理员账号
 * 2. 必须使用 JWT 签名（不可 Base64 伪造）
 * 3. 移除所有默认凭据回退
 */

import { verifyAdminPassword } from './db/password';
import { supabase } from './supabase';
import { signAccessToken, verifyAccessToken, type AdminUser } from './auth-kernel';

/* ─── 管理员验证 ───────────────────────────────────────────── */

/* ─── 管理员验证 ───────────────────────────────────────────── */

/**
 * 验证管理员登录
 * 从数据库验证邮箱和密码
 * 
 * @returns 管理员信息或 null
 */
export async function verifyAdminLogin(email: string, password: string): Promise<AdminUser | null> {
  // 查询数据库中的管理员
  const { data: admin, error } = await supabase
    .from('admin_users')
    .select('id, email, username, password_hash')
    .eq('email', email.toLowerCase().trim())
    .single();

  if (error || !admin) {
    console.log(`[AdminAuth] 管理员登录失败: 邮箱不存在 (${email})`);
    return null;
  }

  // 验证密码
  const isValid = await verifyAdminPassword(password, admin.password_hash);
  if (!isValid) {
    console.log(`[AdminAuth] 管理员登录失败: 密码错误 (${email})`);
    return null;
  }

  console.log(`[AdminAuth] 管理员登录成功: ${email}`);
  return {
    id: admin.id,
    email: admin.email,
    username: admin.username,
  };
}

/* ─── 管理员 Token ─────────────────────────────────────────── */

/**
 * 生成管理员 JWT
 * 使用 admin 专用密钥签名
 */
export async function generateAdminToken(admin: AdminUser): Promise<string> {
  return signAccessToken({
    sub: String(admin.id),
    role: 'admin',
    email: admin.email,
  }, 'admin');
}

/**
 * 验证管理员 JWT
 * 使用 admin 专用密钥验签
 */
export async function verifyAdminToken(token: string): Promise<AdminUser | null> {
  const payload = await verifyAccessToken(token, 'admin');
  if (!payload) {
    return null;
  }

  return {
    id: parseInt(payload.sub, 10),
    email: payload.email || '',
    username: 'Admin',
  };
}

/* ─── 管理员账号管理 ───────────────────────────────────────── */

/**
 * 创建管理员账号
 * 仅用于初始化，需在安全环境下调用
 */
export async function createAdminUser(
  email: string,
  username: string,
  password: string
): Promise<AdminUser | null> {
  const { hashPassword } = await import('./db/password');
  
  const passwordHash = await hashPassword(password);
  
  const { data, error } = await supabase
    .from('admin_users')
    .insert({
      email: email.toLowerCase().trim(),
      username,
      password_hash: passwordHash,
    })
    .select('id, email, username')
    .single();

  if (error) {
    console.error('[AdminAuth] 创建管理员失败:', error);
    return null;
  }

  return data;
}

/**
 * 检查是否存在管理员账号
 */
export async function hasAdminUsers(): Promise<boolean> {
  const { count, error } = await supabase
    .from('admin_users')
    .select('*', { count: 'exact', head: true });

  if (error) {
    return false;
  }

  return (count ?? 0) > 0;
}

// 导出类型
export type { AdminUser } from './auth-kernel';
