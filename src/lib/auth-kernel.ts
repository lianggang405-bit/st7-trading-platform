/**
 * 认证内核 - 统一 JWT 签名/验签
 * 
 * 安全策略：
 * 1. 分离 admin/user 密钥
 * 2. JWT 签名防伪造
 * 3. 统一验签接口
 */

import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';

/* ─── 密钥配置 ─────────────────────────────────────────────── */

function getUserSecret(): Uint8Array {
  const secret = process.env.JWT_USER_SECRET;
  if (!secret) {
    throw new Error('JWT_USER_SECRET 环境变量未配置');
  }
  return new TextEncoder().encode(secret);
}

function getAdminSecret(): Uint8Array {
  const secret = process.env.JWT_ADMIN_SECRET;
  if (!secret) {
    throw new Error('JWT_ADMIN_SECRET 环境变量未配置');
  }
  return new TextEncoder().encode(secret);
}

/* ─── 类型定义 ─────────────────────────────────────────────── */

export type TokenRole = 'user' | 'admin';

export interface JWTPayload {
  sub: string;           // 用户ID
  role: TokenRole;        // 角色
  email?: string;         // 可选：邮箱
  iat?: number;           // 签发时间
  exp?: number;           // 过期时间
}

export interface AdminUser {
  id: number;
  email: string;
  username: string;
}

/* ─── 核心函数 ─────────────────────────────────────────────── */

/**
 * 签名生成 AccessToken
 * @param payload 负载（不含 iat/exp，由函数自动注入）
 * @param role 角色类型
 * @param expiresIn 过期时间，默认 7d
 */
export async function signAccessToken(
  payload: Omit<JWTPayload, 'iat' | 'exp'>,
  role: TokenRole,
  expiresIn = '7d'
): Promise<string> {
  const secret = role === 'admin' ? getAdminSecret() : getUserSecret();
  const alg = 'HS256';

  const token = await new jose.SignJWT(payload as jose.JWTPayload)
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);

  return token;
}

/**
 * 验签 AccessToken
 * @param token JWT 字符串
 * @param role 期望的角色类型
 * @returns 解析后的 payload，失败返回 null
 */
export async function verifyAccessToken(
  token: string,
  role: TokenRole
): Promise<JWTPayload | null> {
  try {
    const secret = role === 'admin' ? getAdminSecret() : getUserSecret();
    const { payload } = await jose.jwtVerify(token, secret, {
      algorithms: ['HS256'],
    });

    // 校验角色匹配
    if (payload.role !== role) {
      return null;
    }

    return {
      sub: payload.sub as string,
      role: payload.role as TokenRole,
      email: payload.email as string | undefined,
      iat: payload.iat,
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}

/**
 * 从 Authorization header 解析 Bearer token
 */
export function parseBearerToken(request: NextRequest): string | null {
  const auth = request.headers.get('authorization');
  if (!auth || !auth.startsWith('Bearer ')) {
    return null;
  }
  return auth.slice(7);
}

/**
 * 统一的认证守卫（用于 API Route）
 * 自动识别 user/admin 角色
 * 
 * @param request Next.js 请求
 * @param options.role 期望的角色
 * @param options.allowUnauthenticated 是否允许未认证（默认 false）
 */
export async function requireAuth(
  request: NextRequest,
  options: {
    role?: TokenRole;
    allowUnauthenticated?: boolean;
  } = {}
): Promise<{ user: JWTPayload } | NextResponse> {
  const { role, allowUnauthenticated = false } = options;

  const token = parseBearerToken(request);
  if (!token) {
    if (allowUnauthenticated) {
      return { user: { sub: '', role: 'user' } };
    }
    return NextResponse.json(
      { error: '未提供认证令牌' },
      { status: 401 }
    );
  }

  // 尝试两种角色验签
  // 如果指定了角色，只验签该角色
  // 如果未指定，尝试 user 再尝试 admin
  const rolesToTry: TokenRole[] = role ? [role] : ['user', 'admin'];
  
  for (const tryRole of rolesToTry) {
    const payload = await verifyAccessToken(token, tryRole);
    if (payload) {
      return { user: payload };
    }
  }

  if (allowUnauthenticated) {
    return { user: { sub: '', role: 'user' } };
  }

  return NextResponse.json(
    { error: '无效或过期的认证令牌' },
    { status: 401 }
  );
}

/**
 * 仅限管理员的守卫
 */
export async function requireAdmin(
  request: NextRequest
): Promise<{ user: JWTPayload } | NextResponse> {
  const result = await requireAuth(request, { role: 'admin' });
  
  if (result instanceof NextResponse) {
    return result;
  }

  if (result.user.role !== 'admin') {
    return NextResponse.json(
      { error: '需要管理员权限' },
      { status: 403 }
    );
  }

  return result;
}

/**
 * 仅限用户的守卫
 */
export async function requireUser(
  request: NextRequest
): Promise<{ user: JWTPayload } | NextResponse> {
  return requireAuth(request, { role: 'user' });
}

/* ─── 环境变量检查 ─────────────────────────────────────────── */

/**
 * 检查认证环境变量是否配置
 * 用于启动时验证
 */
export function validateAuthEnv(): void {
  try {
    getUserSecret();
    getAdminSecret();
  } catch (e) {
    const error = e as Error;
    console.error(`[Auth] 认证环境变量检查失败: ${error.message}`);
    console.error('[Auth] 请确保配置以下环境变量:');
    console.error('  - JWT_USER_SECRET: 用户 JWT 签名密钥（至少 32 字符）');
    console.error('  - JWT_ADMIN_SECRET: 管理员 JWT 签名密钥（至少 32 字符）');
    throw e;
  }
}
