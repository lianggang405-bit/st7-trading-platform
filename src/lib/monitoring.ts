/**
 * 监控日志收集器
 * 用于收集前端错误、性能、用户行为等信息
 */

import { monitoringConfig, LogLevel, LogType, getUserId, getSessionId, getDeviceInfo } from '@/config/monitoring';

// 日志数据接口
export interface LogData {
  // 基础信息
  timestamp: number;
  userId: string;
  sessionId: string;
  level: LogLevel;
  type: LogType;

  // 上下文信息
  pageUrl: string;
  userAgent?: string;
  deviceInfo?: any;

  // 日志内容
  message?: string;
  error?: {
    name?: string;
    message?: string;
    stack?: string;
  };

  // 性能数据
  performance?: {
    loadTime?: number;
    domContentLoadedTime?: number;
    firstPaintTime?: number;
    firstContentfulPaintTime?: number;
    apiDuration?: number;
    lcp?: number;
    fid?: number;
    cls?: number;
  };

  // 用户行为
  action?: {
    type?: string;
    target?: string;
    value?: string;
  };

  // 附加信息
  extra?: Record<string, any>;
}

class Monitor {
  private logs: LogData[] = [];
  private isInitialized = false;
  private batchTimer: NodeJS.Timeout | null = null;

  /**
   * 初始化监控
   */
  init() {
    if (this.isInitialized || typeof window === 'undefined') return;
    if (!monitoringConfig.enabled) return;

    this.isInitialized = true;

    // 初始化错误捕获
    this.initErrorCapture();

    // 初始化性能监控
    this.initPerformanceMonitor();

    // 初始化用户行为监控
    this.initBehaviorMonitor();

    // 初始化页面性能收集
    this.initPageLoadMonitor();

    // 初始化批量上报定时器
    if (monitoringConfig.batch.enabled) {
      this.startBatchTimer();
    }

    // 监听页面卸载，上报剩余日志
    window.addEventListener('beforeunload', () => {
      this.flush();
    });

    console.log('[Monitor] Monitoring initialized');
  }

  /**
   * 添加日志
   */
  addLog(data: Partial<LogData>) {
    if (!monitoringConfig.enabled) return;

    // 采样率过滤
    if (Math.random() > monitoringConfig.sampleRate) {
      return;
    }

    const log: LogData = {
      timestamp: Date.now(),
      userId: getUserId(),
      sessionId: getSessionId(),
      pageUrl: window.location.href,
      deviceInfo: getDeviceInfo(),
      level: data.level || LogLevel.INFO,
      type: data.type || LogType.USER_ACTION,
      ...data,
    };

    // 过滤敏感信息
    this.filterSensitiveData(log);

    // 添加到队列
    this.logs.push(log);

    // 限制本地存储大小
    if (this.logs.length > monitoringConfig.localStorage.maxSize) {
      this.logs.shift();
    }

    // 保存到本地存储
    this.saveToLocalStorage();

    // 批量上报或立即上报
    if (monitoringConfig.batch.enabled && log.level !== LogLevel.FATAL) {
      // 批量上报
      if (this.logs.length >= monitoringConfig.batch.maxSize) {
        this.flush();
      }
    } else {
      // 立即上报致命错误
      if (log.level === LogLevel.FATAL) {
        this.flush();
      }
    }
  }

  /**
   * 上报日志到服务器
   */
  private async flush() {
    if (this.logs.length === 0) return;

    const logsToSend = [...this.logs];
    this.logs = [];

    try {
      await fetch(monitoringConfig.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logs: logsToSend }),
        keepalive: true, // 页面卸载时也能发送
      });

      console.log(`[Monitor] Sent ${logsToSend.length} logs`);
    } catch (error) {
      console.error('[Monitor] Failed to send logs:', error);
      // 发送失败，重新加入队列
      this.logs = [...logsToSend, ...this.logs];
    }
  }

  /**
   * 过滤敏感信息
   */
  private filterSensitiveData(log: LogData) {
    const sensitiveFields = monitoringConfig.sensitiveFields;

    const filterObject = (obj: any): any => {
      if (!obj || typeof obj !== 'object') return obj;

      if (Array.isArray(obj)) {
        return obj.map(filterObject);
      }

      const filtered: any = {};
      for (const key in obj) {
        const lowerKey = key.toLowerCase();
        const isSensitive = sensitiveFields.some(field => lowerKey.includes(field.toLowerCase()));

        if (isSensitive) {
          filtered[key] = '[FILTERED]';
        } else if (typeof obj[key] === 'object') {
          filtered[key] = filterObject(obj[key]);
        } else {
          filtered[key] = obj[key];
        }
      }
      return filtered;
    };

    if (log.extra) {
      log.extra = filterObject(log.extra);
    }

    if (log.error) {
      // 只保留前 1000 个字符的堆栈信息
      if (log.error.stack && log.error.stack.length > 1000) {
        log.error.stack = log.error.stack.substring(0, 1000) + '...';
      }
    }
  }

  /**
   * 保存到本地存储
   */
  private saveToLocalStorage() {
    if (!monitoringConfig.localStorage.enabled) return;

    try {
      localStorage.setItem(
        monitoringConfig.localStorage.key,
        JSON.stringify(this.logs.slice(-monitoringConfig.localStorage.maxSize))
      );
    } catch (error) {
      console.error('[Monitor] Failed to save logs to localStorage:', error);
    }
  }

  /**
   * 初始化错误捕获
   */
  private initErrorCapture() {
    if (!monitoringConfig.error.enabled) return;

    // 捕获全局错误
    window.addEventListener('error', (event) => {
      this.addLog({
        level: LogLevel.ERROR,
        type: LogType.JS_ERROR,
        message: event.message,
        error: {
          name: event.error?.name,
          message: event.error?.message,
          stack: event.error?.stack,
        },
        extra: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    });

    // 捕获未处理的 Promise 拒绝
    window.addEventListener('unhandledrejection', (event) => {
      this.addLog({
        level: LogLevel.ERROR,
        type: LogType.UNHANDLED_REJECTION,
        message: 'Unhandled Promise Rejection',
        error: {
          name: 'UnhandledRejection',
          message: String(event.reason),
          stack: event.reason?.stack,
        },
        extra: {
          reason: String(event.reason),
        },
      });
    });

    // 捕获 console.error（可选）
    if (monitoringConfig.error.captureConsole) {
      const originalError = console.error;
      console.error = (...args) => {
        originalError.apply(console, args);
        this.addLog({
          level: LogLevel.ERROR,
          type: LogType.JS_ERROR,
          message: args.map(arg => String(arg)).join(' '),
          extra: {
            args: args.slice(0, 3).map(arg => String(arg).substring(0, 200)),
          },
        });
      };
    }
  }

  /**
   * 初始化性能监控
   */
  private initPerformanceMonitor() {
    if (!monitoringConfig.performance.enabled) return;

    // 使用 PerformanceObserver 监听 Web Vitals
    if (typeof PerformanceObserver !== 'undefined') {
      try {
        // LCP (Largest Contentful Paint)
        if (monitoringConfig.performance.collectLCP) {
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lcp = entries[entries.length - 1] as any;
            this.addLog({
              level: LogLevel.INFO,
              type: LogType.RENDER_PERFORMANCE,
              performance: {
                lcp: Math.round(lcp.startTime),
              },
              extra: {
                element: lcp.element?.tagName,
              },
            });
          });
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        }

        // FID (First Input Delay)
        if (monitoringConfig.performance.collectFID) {
          const fidObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const fid = entries[0] as any;
            this.addLog({
              level: LogLevel.INFO,
              type: LogType.RENDER_PERFORMANCE,
              performance: {
                fid: Math.round(fid.processingStart - fid.startTime),
              },
            });
          });
          fidObserver.observe({ entryTypes: ['first-input'] });
        }

        // CLS (Cumulative Layout Shift)
        if (monitoringConfig.performance.collectCLS) {
          let clsValue = 0;
          const clsObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            for (const entry of entries) {
              if (!(entry as any).hadRecentInput) {
                clsValue += (entry as any).value;
              }
            }
            this.addLog({
              level: LogLevel.INFO,
              type: LogType.RENDER_PERFORMANCE,
              performance: {
                cls: Math.round(clsValue * 1000) / 1000,
              },
            });
          });
          clsObserver.observe({ entryTypes: ['layout-shift'] });
        }
      } catch (error) {
        console.error('[Monitor] Failed to initialize PerformanceObserver:', error);
      }
    }
  }

  /**
   * 初始化页面性能监控
   */
  private initPageLoadMonitor() {
    if (!monitoringConfig.performance.collectPageLoad) return;

    window.addEventListener('load', () => {
      // 等待一段时间确保性能数据完整
      setTimeout(() => {
        if (typeof performance === 'undefined' || !performance.timing) return;

        const timing = performance.timing;
        const navigationStart = timing.navigationStart;

        this.addLog({
          level: LogLevel.INFO,
          type: LogType.PAGE_LOAD,
          performance: {
            loadTime: timing.loadEventEnd - navigationStart,
            domContentLoadedTime: timing.domContentLoadedEventEnd - navigationStart,
            firstPaintTime: timing.responseStart - navigationStart,
            firstContentfulPaintTime: timing.domLoading - navigationStart,
          },
          extra: {
            pageUrl: window.location.href,
          },
        });
      }, 1000);
    });
  }

  /**
   * 初始化用户行为监控
   */
  private initBehaviorMonitor() {
    if (!monitoringConfig.behavior.enabled) return;

    // 跟踪路由变化
    if (monitoringConfig.behavior.trackRoute) {
      let lastUrl = window.location.href;

      // 使用 setInterval 检测路由变化（适用于 SPA）
      setInterval(() => {
        const currentUrl = window.location.href;
        if (currentUrl !== lastUrl) {
          this.addLog({
            level: LogLevel.INFO,
            type: LogType.PAGE_VIEW,
            extra: {
              from: lastUrl,
              to: currentUrl,
            },
          });
          lastUrl = currentUrl;
        }
      }, 1000);
    }

    // 跟踪点击事件（可选）
    if (monitoringConfig.behavior.trackClicks) {
      let clickThrottle = false;
      document.addEventListener('click', (event) => {
        if (clickThrottle) return;
        clickThrottle = true;
        setTimeout(() => (clickThrottle = false), 1000); // 限流：每秒最多记录一次点击

        const target = event.target as HTMLElement;
        const tagName = target.tagName;
        const className = target.className;
        const id = target.id;
        const text = target.textContent?.substring(0, 50);

        this.addLog({
          level: LogLevel.DEBUG,
          type: LogType.USER_ACTION,
          action: {
            type: 'click',
            target: `${tagName}${id ? `#${id}` : ''}${className ? `.${className.split(' ')[0]}` : ''}`,
            value: text,
          },
        });
      }, true);
    }
  }

  /**
   * 启动批量上报定时器
   */
  private startBatchTimer() {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }

    this.batchTimer = setInterval(() => {
      this.flush();
    }, monitoringConfig.batch.maxWaitTime) as any;
  }

  /**
   * 手动记录 API 错误
   */
  logApiError(url: string, error: any, extra?: any) {
    this.addLog({
      level: LogLevel.ERROR,
      type: LogType.API_ERROR,
      message: `API Error: ${url}`,
      error: {
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
      },
      extra: {
        url,
        ...extra,
      },
    });
  }

  /**
   * 手动记录 API 性能
   */
  logApiPerformance(url: string, duration: number, extra?: any) {
    this.addLog({
      level: LogLevel.INFO,
      type: LogType.API_PERFORMANCE,
      performance: {
        apiDuration: duration,
      },
      extra: {
        url,
        ...extra,
      },
    });
  }

  /**
   * 手动记录用户行为
   */
  logUserAction(type: string, target: string, value?: string) {
    this.addLog({
      level: LogLevel.INFO,
      type: LogType.USER_ACTION,
      action: {
        type,
        target,
        value,
      },
    });
  }

  /**
   * 手动记录业务事件
   */
  logBusinessEvent(type: LogType, message: string, extra?: any) {
    this.addLog({
      level: LogLevel.INFO,
      type,
      message,
      extra,
    });
  }
}

// 导出单例
export const monitor = new Monitor();

// 自动初始化（仅在浏览器环境）
if (typeof window !== 'undefined') {
  // 延迟初始化，确保 DOM 加载完成
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      monitor.init();
    });
  } else {
    monitor.init();
  }
}
