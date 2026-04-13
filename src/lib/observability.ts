/**
 * 生产可观测性模块
 * 
 * 功能：
 * 1. 请求 ID 生成和传递
 * 2. 结构化日志输出
 * 3. 错误告警阈值
 */

import { NextRequest, NextResponse } from 'next/server';

/* ─── 请求 ID 管理 ────────────────────────────────────────── */

/**
 * 生成请求 ID
 */
export function generateRequestId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `req_${timestamp}_${random}`;
}

/**
 * 从请求中获取或生成请求 ID
 */
export function getRequestId(request: NextRequest): string {
  // 优先从 header 获取
  const headerId = request.headers.get('x-request-id');
  if (headerId) {
    return headerId;
  }

  // 从 URL 参数获取
  const url = new URL(request.url);
  const queryId = url.searchParams.get('requestId');
  if (queryId) {
    return queryId;
  }

  // 生成新的 ID
  return generateRequestId();
}

/* ─── 日志级别枚举 ────────────────────────────────────────── */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

/* ─── 日志结构 ────────────────────────────────────────────── */

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  requestId?: string;
  userId?: string;
  path?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  error?: {
    name?: string;
    message?: string;
    stack?: string;
  };
  metadata?: Record<string, unknown>;
}

/* ─── 日志配置 ────────────────────────────────────────────── */

export interface LogConfig {
  /** 是否启用 JSON 格式输出 */
  jsonFormat: boolean;
  /** 是否包含堆栈信息 */
  includeStack: boolean;
  /** 最大日志保留天数 */
  retentionDays: number;
}

const defaultConfig: LogConfig = {
  jsonFormat: process.env.NODE_ENV === 'production',
  includeStack: process.env.NODE_ENV === 'development',
  retentionDays: 30,
};

let logConfig: LogConfig = { ...defaultConfig };

/**
 * 配置日志系统
 */
export function configureLogging(config: Partial<LogConfig>): void {
  logConfig = { ...logConfig, ...config };
}

/* ─── 日志输出 ────────────────────────────────────────────── */

/**
 * 输出结构化日志
 */
function outputLog(entry: LogEntry): void {
  const { jsonFormat, includeStack } = logConfig;

  if (jsonFormat) {
    // 生产环境：JSON 格式，便于日志收集
    const output: Record<string, unknown> = {
      timestamp: entry.timestamp,
      level: entry.level,
      message: entry.message,
    };

    if (entry.requestId) output.requestId = entry.requestId;
    if (entry.userId) output.userId = entry.userId;
    if (entry.path) output.path = entry.path;
    if (entry.method) output.method = entry.method;
    if (entry.statusCode) output.statusCode = entry.statusCode;
    if (entry.duration) output.duration = entry.duration;
    if (entry.metadata) output.metadata = entry.metadata;

    if (includeStack && entry.error?.stack) {
      output.stack = entry.error.stack;
    }

    console.log(JSON.stringify(output));
  } else {
    // 开发环境：人类可读格式
    const parts = [
      `[${entry.timestamp}]`,
      `[${entry.level.toUpperCase()}]`,
    ];

    if (entry.requestId) parts.push(`[${entry.requestId}]`);
    if (entry.userId) parts.push(`[user:${entry.userId}]`);
    if (entry.path) parts.push(entry.method ? `${entry.method} ${entry.path}` : entry.path);
    if (entry.statusCode) parts.push(`(${entry.statusCode})`);
    if (entry.duration) parts.push(`${entry.duration}ms`);

    parts.push(entry.message);

    if (entry.error) {
      parts.push(`\n  Error: ${entry.error.message}`);
      if (includeStack && entry.error.stack) {
        parts.push(`\n${entry.error.stack}`);
      }
    }

    if (entry.level === LogLevel.ERROR || entry.level === LogLevel.FATAL) {
      console.error(parts.join(' '));
    } else {
      console.log(parts.join(' '));
    }
  }
}

/* ─── 日志方法 ────────────────────────────────────────────── */

/**
 * 调试日志
 */
export function logDebug(message: string, metadata?: Record<string, unknown>): void {
  outputLog({
    timestamp: new Date().toISOString(),
    level: LogLevel.DEBUG,
    message,
    metadata,
  });
}

/**
 * 信息日志
 */
export function logInfo(message: string, metadata?: Record<string, unknown>): void {
  outputLog({
    timestamp: new Date().toISOString(),
    level: LogLevel.INFO,
    message,
    metadata,
  });
}

/**
 * 警告日志
 */
export function logWarn(message: string, metadata?: Record<string, unknown>): void {
  outputLog({
    timestamp: new Date().toISOString(),
    level: LogLevel.WARN,
    message,
    metadata,
  });
}

/**
 * 错误日志
 */
export function logError(
  message: string,
  error?: Error,
  metadata?: Record<string, unknown>
): void {
  outputLog({
    timestamp: new Date().toISOString(),
    level: LogLevel.ERROR,
    message,
    error: error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : undefined,
    metadata,
  });
}

/**
 * 致命错误日志
 */
export function logFatal(
  message: string,
  error?: Error,
  metadata?: Record<string, unknown>
): void {
  outputLog({
    timestamp: new Date().toISOString(),
    level: LogLevel.FATAL,
    message,
    error: error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : undefined,
    metadata,
  });
}

/* ─── 请求日志中间件 ──────────────────────────────────────── */

/**
 * 请求日志中间件选项
 */
export interface RequestLoggingOptions {
  /** 是否记录请求体 */
  logRequestBody?: boolean;
  /** 是否记录响应体 */
  logResponseBody?: boolean;
  /** 需要脱敏的字段 */
  sensitiveFields?: string[];
}

/**
 * 记录 API 请求日志
 */
export function logRequest(
  request: NextRequest,
  options: RequestLoggingOptions = {}
): string {
  const requestId = getRequestId(request);
  const startTime = Date.now();

  const url = new URL(request.url);
  
  // 记录基本请求信息
  logInfo('Incoming request', {
    requestId,
    method: request.method,
    path: url.pathname,
    query: Object.fromEntries(url.searchParams),
    userAgent: request.headers.get('user-agent'),
    referer: request.headers.get('referer'),
    duration: 0, // 将在 logResponse 中更新
  });

  // 返回一个函数用于记录响应
  return requestId;
}

/**
 * 记录 API 响应日志
 */
export function logResponse(
  request: NextRequest,
  requestId: string,
  response: NextResponse,
  duration: number
): void {
  const url = new URL(request.url);
  const statusCode = response.status;

  const level = statusCode >= 500 ? LogLevel.ERROR :
                statusCode >= 400 ? LogLevel.WARN :
                LogLevel.INFO;

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message: `${request.method} ${url.pathname} ${statusCode}`,
    requestId,
    path: url.pathname,
    method: request.method,
    statusCode,
    duration,
  };

  outputLog(entry);

  // 检查是否触发告警
  checkAlertThreshold(statusCode, requestId);
}

/* ─── 告警阈值 ────────────────────────────────────────────── */

export interface AlertThreshold {
  /** 错误率告警阈值（百分比） */
  errorRateThreshold: number;
  /** 5xx 错误计数告警阈值 */
  serverErrorThreshold: number;
  /** 503 错误计数告警阈值 */
  serviceUnavailableThreshold: number;
  /** 时间窗口（秒） */
  windowSeconds: number;
}

const defaultThreshold: AlertThreshold = {
  errorRateThreshold: 5,        // 5% 错误率
  serverErrorThreshold: 10,     // 10 次 5xx
  serviceUnavailableThreshold: 3, // 3 次 503
  windowSeconds: 60,            // 60 秒窗口
};

// 错误计数器
const errorCounts = {
  total: 0,
  serverErrors: 0,
  serviceUnavailable: 0,
  windowStart: Date.now(),
};

/**
 * 检查是否触发告警
 */
function checkAlertThreshold(statusCode: number, requestId: string): void {
  const now = Date.now();

  // 重置窗口
  if (now - errorCounts.windowStart > defaultThreshold.windowSeconds * 1000) {
    errorCounts.total = 0;
    errorCounts.serverErrors = 0;
    errorCounts.serviceUnavailable = 0;
    errorCounts.windowStart = now;
  }

  // 更新计数
  errorCounts.total++;
  if (statusCode >= 500) errorCounts.serverErrors++;
  if (statusCode === 503) errorCounts.serviceUnavailable++;

  // 检查阈值
  const errorRate = (errorCounts.serverErrors / errorCounts.total) * 100;

  if (errorRate > defaultThreshold.errorRateThreshold) {
    logWarn('ALERT: High error rate detected', {
      meta: {
        requestId,
        errorRate: errorRate.toFixed(2) + '%',
        serverErrors: errorCounts.serverErrors,
        totalRequests: errorCounts.total,
        windowSeconds: defaultThreshold.windowSeconds,
      },
    });
  }

  if (errorCounts.serverErrors >= defaultThreshold.serverErrorThreshold) {
    logError('ALERT: High 5xx error count', undefined, {
      requestId,
      serverErrorCount: errorCounts.serverErrors,
    });
  }

  if (errorCounts.serviceUnavailable >= defaultThreshold.serviceUnavailableThreshold) {
    logFatal('ALERT: Multiple 503 Service Unavailable responses', undefined, {
      requestId,
      serviceUnavailableCount: errorCounts.serviceUnavailable,
    });
  }
}

/**
 * 获取当前告警状态
 */
export function getAlertStatus(): {
  errorRate: number;
  serverErrors: number;
  serviceUnavailable: number;
  windowSeconds: number;
} {
  return {
    errorRate: errorCounts.total > 0 
      ? (errorCounts.serverErrors / errorCounts.total) * 100 
      : 0,
    serverErrors: errorCounts.serverErrors,
    serviceUnavailable: errorCounts.serviceUnavailable,
    windowSeconds: Math.floor((Date.now() - errorCounts.windowStart) / 1000),
  };
}
