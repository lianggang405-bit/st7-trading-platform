/**
 * 监控日志配置
 */

// 日志级别
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

// 日志类型
export enum LogType {
  // 错误相关
  JS_ERROR = 'js_error',           // JavaScript 错误
  UNHANDLED_REJECTION = 'unhandled_rejection', // 未处理的 Promise 拒绝
  API_ERROR = 'api_error',         // API 错误
  NETWORK_ERROR = 'network_error', // 网络错误

  // 性能相关
  PAGE_LOAD = 'page_load',         // 页面加载
  API_PERFORMANCE = 'api_performance', // API 性能
  RENDER_PERFORMANCE = 'render_performance', // 渲染性能

  // 用户行为
  PAGE_VIEW = 'page_view',         // 页面访问
  USER_ACTION = 'user_action',     // 用户行为
  FEATURE_USAGE = 'feature_usage', // 功能使用

  // 业务相关
  AUTH_EVENT = 'auth_event',       // 认证事件
  TRANSACTION_EVENT = 'transaction_event', // 交易事件
}

// 监控配置
export const monitoringConfig = {
  // 是否启用监控（开发环境默认开启，便于测试）
  enabled: false, // 暂时禁用，排查问题

  // 日志上报 API 地址
  apiEndpoint: '/api/monitoring/log',

  // 采样率（0-1）- 开发环境 100%，生产环境 10%
  sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,

  // 日志级别过滤
  minLevel: LogLevel.DEBUG, // 开发环境记录所有级别

  // 批量上报配置
  batch: {
    enabled: true,           // 是否启用批量上报
    maxSize: 10,            // 最大批量大小
    maxWaitTime: 5000,      // 最大等待时间（毫秒）
  },

  // 本地存储配置
  localStorage: {
    enabled: true,
    key: 'monitoring_logs',
    maxSize: 50,            // 最大本地存储条数
  },

  // 敏感信息过滤（需要从日志中移除的字段）
  sensitiveFields: [
    'password',
    'token',
    'secret',
    'apiKey',
    'sessionId',
    'cookie',
    'authorization',
    'csrf',
    'jwt',
  ],

  // 性能监控配置
  performance: {
    enabled: true,
    collectPageLoad: true,    // 收集页面加载性能
    collectAPI: true,         // 收集 API 性能
    collectLCP: true,         // 收集 LCP（最大内容绘制）
    collectFID: true,         // 收集 FID（首次输入延迟）
    collectCLS: true,         // 收集 CLS（累积布局偏移）
  },

  // 错误监控配置
  error: {
    enabled: true,
    captureConsole: true,     // 捕获 console.error
    captureUnhandled: true,   // 捕获未处理错误
    stackTrace: true,         // 收集堆栈信息
    sourceMap: true,          // 使用 source map
  },

  // 用户行为监控配置
  behavior: {
    enabled: true,
    trackClicks: true,        // 跟踪点击
    trackScroll: true,        // 跟踪滚动
    trackRoute: true,         // 跟踪路由变化
  },
} as const;

// 获取用户 ID（从 cookie 或生成）
export function getUserId(): string {
  if (typeof window === 'undefined') return 'server';

  let userId = localStorage.getItem('monitoring_user_id');
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem('monitoring_user_id', userId);
  }
  return userId;
}

// 获取会话 ID
export function getSessionId(): string {
  if (typeof window === 'undefined') return 'server-session';

  let sessionId = sessionStorage.getItem('monitoring_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    sessionStorage.setItem('monitoring_session_id', sessionId);
  }
  return sessionId;
}

// 获取设备信息
export function getDeviceInfo() {
  if (typeof window === 'undefined') return null;

  const ua = navigator.userAgent;

  return {
    userAgent: ua.substring(0, 500), // 限制长度
    platform: navigator.platform,
    language: navigator.language,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    touchSupport: 'ontouchstart' in window,
    // 浏览器检测（简化版）
    browser: getBrowserInfo(ua),
    // 设备类型
    deviceType: getDeviceType(ua),
  };
}

// 获取浏览器信息
function getBrowserInfo(ua: string): string {
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
  return 'Unknown';
}

// 获取设备类型
function getDeviceType(ua: string): string {
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated/i.test(ua)) {
    return 'mobile';
  }
  if (/Tablet|iPad/i.test(ua)) {
    return 'tablet';
  }
  return 'desktop';
}
