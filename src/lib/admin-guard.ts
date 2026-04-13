/**
 * 管理员 API 鉴权守卫
 * 
 * 用于包装管理员 API 路由处理器
 * 确保只有持有有效 admin JWT 的请求才能访问
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/admin-auth';
import { parseBearerToken } from '@/lib/auth-kernel';

export interface AuthenticatedAdmin {
  id: number;
  email: string;
  username: string;
}

export interface RouteContext {
  params?: Promise<Record<string, string>>;
}

/**
 * 从请求中提取并验证管理员 JWT
 * @returns 管理员信息或 NextResponse 错误响应
 */
export async function authenticateAdmin(
  request: NextRequest
): Promise<AuthenticatedAdmin | NextResponse> {
  // 优先从 Cookie 获取
  const cookieToken = request.cookies.get('admin_token')?.value;
  const bearerToken = parseBearerToken(request);
  const token = cookieToken || bearerToken;

  if (!token) {
    return NextResponse.json(
      { error: '未登录或会话已过期' },
      { status: 401 }
    );
  }

  const admin = await verifyAdminToken(token);
  if (!admin) {
    return NextResponse.json(
      { error: '无效或过期的认证令牌' },
      { status: 401 }
    );
  }

  return admin;
}

/**
 * 类型守卫：检查返回值是否是 NextResponse
 */
export function isUnauthorizedResponse(
  result: AuthenticatedAdmin | NextResponse
): result is NextResponse {
  return result instanceof NextResponse;
}

/**
 * 包装管理员 API 处理器，自动添加鉴权
 * 支持 Next.js 15+ 的路由上下文
 * 
 * @example
 * // 简单路由
 * export const GET = withAdminAuth(async (req, admin) => {
 *   return NextResponse.json({ ... });
 * });
 * 
 * // 动态路由
 * export const GET = withAdminAuth(async (req, admin, context) => {
 *   const { id } = await context.params;
 *   return NextResponse.json({ ... });
 * });
 */
export function withAdminAuth(
  handler: (
    request: NextRequest,
    admin: AuthenticatedAdmin,
    context?: RouteContext
  ) => Promise<NextResponse>
) {
  return async (
    request: NextRequest,
    context?: RouteContext
  ) => {
    const authResult = await authenticateAdmin(request);
    
    if (isUnauthorizedResponse(authResult)) {
      return authResult;
    }

    return handler(request, authResult, context);
  };
}
