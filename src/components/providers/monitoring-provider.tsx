'use client';

import { useEffect } from 'react';
import { monitor } from '@/lib/monitoring';
import { LogType } from '@/config/monitoring';

/**
 * 监控 Provider 组件
 * 在应用中集成监控功能
 */

interface MonitoringProviderProps {
  children: React.ReactNode;
}

export function MonitoringProvider({ children }: MonitoringProviderProps) {
  useEffect(() => {
    // 初始化监控
    if (typeof window !== 'undefined') {
      monitor.init();
    }

    // 监听 API 请求/响应（通过重写 fetch）
    if (typeof window !== 'undefined' && typeof fetch === 'function') {
      const originalFetch = window.fetch;

      window.fetch = async (...args) => {
        const [url, options] = args;
        const startTime = Date.now();

        try {
          const response = await originalFetch(...args);
          const duration = Date.now() - startTime;

          // 记录 API 性能
          monitor.logApiPerformance(url.toString(), duration, {
            method: options?.method || 'GET',
            status: response.status,
          });

          // 记录 API 错误
          if (!response.ok) {
            monitor.logApiError(url.toString(), {
              name: 'HTTP Error',
              message: `HTTP ${response.status}`,
            }, {
              method: options?.method || 'GET',
              status: response.status,
            });
          }

          return response;
        } catch (error: any) {
          const duration = Date.now() - startTime;

          // 记录 API 错误
          monitor.logApiError(url.toString(), error, {
            method: options?.method || 'GET',
            duration,
          });

          throw error;
        }
      };
    }
  }, []);

  return <>{children}</>;
}
