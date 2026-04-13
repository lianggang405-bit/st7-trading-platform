/**
 * 开发环境检查工具
 * 
 * 用于保护调试/初始化接口
 * 确保只有开发环境或本地网络可以访问
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * 检查是否为开发环境
 */
export function isDevelopment(): boolean {
  return (
    process.env.NODE_ENV === 'development' ||
    process.env.COZE_PROJECT_ENV === 'DEV'
  );
}

/**
 * 检查是否为沙箱环境
 */
export function isSandbox(): boolean {
  return !!process.env.COZE_WORKSPACE_PATH;
}

/**
 * 检查请求是否来自可信来源
 * 允许：
 * 1. 本地请求 (127.0.0.1, localhost)
 * 2. 沙箱环境内的请求
 */
export function isTrustedSource(request: NextRequest): boolean {
  const forwarded = request.headers.get('x-forwarded-for');
  const remoteAddr = forwarded?.split(',')[0]?.trim() || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
  
  // 本地请求
  if (remoteAddr === '127.0.0.1' || 
      remoteAddr === '::1' || 
      remoteAddr === 'localhost') {
    return true;
  }
  
  // 沙箱环境
  if (isSandbox()) {
    return true;
  }
  
  return false;
}

/**
 * 强制开发环境检查
 * 如果不在开发环境，返回 403
 */
export function assertDevOnly(): NextResponse | null {
  if (!isDevelopment()) {
    return NextResponse.json(
      { error: '此接口仅在开发环境中可用' },
      { status: 403 }
    );
  }
  return null;
}

/**
 * 开发环境 + 可信来源双重检查
 * 用于极度敏感的调试接口
 */
export function assertDevAndTrusted(request: NextRequest): NextResponse | null {
  const devCheck = assertDevOnly();
  if (devCheck) return devCheck;

  if (!isTrustedSource(request)) {
    return NextResponse.json(
      { error: '此接口不允许外部访问' },
      { status: 403 }
    );
  }

  return null;
}

/**
 * 包装敏感接口，确保开发环境
 * 
 * @example
 * export const GET = devOnlyHandler(async (req) => {
 *   return NextResponse.json({ ... });
 * });
 */
export function devOnlyHandler(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const error = assertDevOnly();
    if (error) return error;
    return handler(request);
  };
}

/**
 * 包装极度敏感接口，确保开发环境 + 可信来源
 */
export function devAndTrustedHandler(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const error = assertDevAndTrusted(request);
    if (error) return error;
    return handler(request);
  };
}
