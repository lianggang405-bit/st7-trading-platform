/**
 * 统一错误响应模块
 * 
 * 提供标准化的错误码和错误结构，便于监控与排障
 * 
 * 错误码规范：
 * - 400: 参数错误 (BAD_REQUEST)
 * - 401: 未认证 (UNAUTHORIZED)
 * - 403: 无权限 (FORBIDDEN)
 * - 404: 资源不存在 (NOT_FOUND)
 * - 422: 业务逻辑错误 (UNPROCESSABLE_ENTITY)
 * - 500: 服务器错误 (INTERNAL_ERROR)
 * - 502: 外部服务错误 (BAD_GATEWAY)
 * - 503: 服务不可用 (SERVICE_UNAVAILABLE)
 */

import { NextResponse } from 'next/server';

/* ─── 错误码枚举 ───────────────────────────────────────────── */

export enum ErrorCode {
  // 认证相关 (401)
  UNAUTHORIZED = 'UNAUTHORIZED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  
  // 权限相关 (403)
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSION = 'INSUFFICIENT_PERMISSION',
  
  // 参数相关 (400)
  BAD_REQUEST = 'BAD_REQUEST',
  INVALID_PARAMETER = 'INVALID_PARAMETER',
  MISSING_PARAMETER = 'MISSING_PARAMETER',
  
  // 业务相关 (422)
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  ORDER_NOT_FOUND = 'ORDER_NOT_FOUND',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  INVALID_ORDER_STATUS = 'INVALID_ORDER_STATUS',
  
  // 资源相关 (404)
  NOT_FOUND = 'NOT_FOUND',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  
  // 服务器错误 (500)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  
  // 外部服务 (502/503)
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

/* ─── 错误响应结构 ─────────────────────────────────────────── */

export interface ErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: Record<string, unknown>;
    requestId?: string;
    timestamp: string;
  };
}

export interface SuccessResponse<T = unknown> {
  success: true;
  data?: T;
  message?: string;
  timestamp: string;
}

/* ─── 辅助函数 ─────────────────────────────────────────────── */

/**
 * 生成请求 ID（用于日志追踪）
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 创建错误响应
 */
export function errorResponse(
  code: ErrorCode,
  message: string,
  options: {
    status?: number;
    details?: Record<string, unknown>;
    requestId?: string;
  } = {}
): NextResponse {
  const { status = getStatusFromCode(code), details, requestId = generateRequestId() } = options;
  
  const body: ErrorResponse = {
    success: false,
    error: {
      code,
      message,
      requestId,
      timestamp: new Date().toISOString(),
    },
  };

  if (details) {
    body.error.details = details;
  }

  const response = NextResponse.json(body, { status });
  response.headers.set('X-Request-Id', requestId);
  
  return response;
}

/**
 * 根据错误码获取 HTTP 状态码
 */
function getStatusFromCode(code: ErrorCode): number {
  const statusMap: Record<ErrorCode, number> = {
    // 401
    [ErrorCode.UNAUTHORIZED]: 401,
    [ErrorCode.TOKEN_EXPIRED]: 401,
    [ErrorCode.TOKEN_INVALID]: 401,
    
    // 403
    [ErrorCode.FORBIDDEN]: 403,
    [ErrorCode.INSUFFICIENT_PERMISSION]: 403,
    
    // 400
    [ErrorCode.BAD_REQUEST]: 400,
    [ErrorCode.INVALID_PARAMETER]: 400,
    [ErrorCode.MISSING_PARAMETER]: 400,
    
    // 422
    [ErrorCode.INSUFFICIENT_BALANCE]: 422,
    [ErrorCode.ORDER_NOT_FOUND]: 422,
    [ErrorCode.USER_NOT_FOUND]: 422,
    [ErrorCode.INVALID_ORDER_STATUS]: 422,
    
    // 404
    [ErrorCode.NOT_FOUND]: 404,
    [ErrorCode.RESOURCE_NOT_FOUND]: 404,
    
    // 500
    [ErrorCode.INTERNAL_ERROR]: 500,
    [ErrorCode.DATABASE_ERROR]: 500,
    
    // 502/503
    [ErrorCode.EXTERNAL_SERVICE_ERROR]: 502,
    [ErrorCode.SERVICE_UNAVAILABLE]: 503,
  };

  return statusMap[code] || 500;
}

/**
 * 创建成功响应
 */
export function successResponse<T>(
  data?: T,
  options: { message?: string } = {}
): NextResponse {
  const body: SuccessResponse<T> = {
    success: true,
    timestamp: new Date().toISOString(),
  };

  if (data !== undefined) {
    body.data = data;
  }

  if (options.message) {
    body.message = options.message;
  }

  return NextResponse.json(body);
}

/* ─── 便捷方法 ─────────────────────────────────────────────── */

export const errors = {
  unauthorized: (message = '未认证', details?: Record<string, unknown>) =>
    errorResponse(ErrorCode.UNAUTHORIZED, message, { details }),
    
  tokenExpired: (message = '令牌已过期', details?: Record<string, unknown>) =>
    errorResponse(ErrorCode.TOKEN_EXPIRED, message, { details }),
    
  tokenInvalid: (message = '令牌无效', details?: Record<string, unknown>) =>
    errorResponse(ErrorCode.TOKEN_INVALID, message, { details }),
    
  forbidden: (message = '无权限', details?: Record<string, unknown>) =>
    errorResponse(ErrorCode.FORBIDDEN, message, { details }),
    
  badRequest: (message = '请求参数错误', details?: Record<string, unknown>) =>
    errorResponse(ErrorCode.BAD_REQUEST, message, { details }),
    
  invalidParam: (param: string, message?: string) =>
    errorResponse(ErrorCode.INVALID_PARAMETER, message || `参数 ${param} 无效`, { 
      details: { parameter: param } 
    }),
    
  missingParam: (param: string) =>
    errorResponse(ErrorCode.MISSING_PARAMETER, `缺少必填参数: ${param}`, { 
      details: { parameter: param } 
    }),
    
  insufficientBalance: (available: number, required: number) =>
    errorResponse(ErrorCode.INSUFFICIENT_BALANCE, '余额不足', { 
      details: { available, required } 
    }),
    
  orderNotFound: (orderId: string) =>
    errorResponse(ErrorCode.ORDER_NOT_FOUND, `订单不存在: ${orderId}`, { 
      details: { orderId } 
    }),
    
  userNotFound: (userId?: string) =>
    errorResponse(ErrorCode.USER_NOT_FOUND, userId ? `用户不存在: ${userId}` : '用户不存在', { 
      details: { userId } 
    }),
    
  notFound: (resource: string) =>
    errorResponse(ErrorCode.NOT_FOUND, `${resource} 不存在`, { 
      details: { resource } 
    }),
    
  databaseError: (message = '数据库错误', details?: Record<string, unknown>) =>
    errorResponse(ErrorCode.DATABASE_ERROR, message, { details }),
    
  internalError: (message = '服务器内部错误', details?: Record<string, unknown>) =>
    errorResponse(ErrorCode.INTERNAL_ERROR, message, { details }),
    
  externalError: (service: string, message?: string) =>
    errorResponse(ErrorCode.EXTERNAL_SERVICE_ERROR, message || `${service} 服务错误`, { 
      details: { service } 
    }),
    
  serviceUnavailable: (service: string) =>
    errorResponse(ErrorCode.SERVICE_UNAVAILABLE, `${service} 服务暂不可用`, { 
      details: { service } 
    }),
};
