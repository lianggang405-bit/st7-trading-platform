'use client';

import { useEffect } from 'react';
import { Inspector } from 'react-dev-inspector';
import { useAuthStore } from '../../stores/authStore';

/**
 * AuthProvider - 认证状态初始化组件
 *
 * 职责：
 * 1. 在应用初始化时从 localStorage 恢复用户登录状态
 * 2. 标记 isHydrated 为 true，允许页面显示真实内容
 * 3. 必须在客户端使用（因为需要访问 localStorage）
 *
 * 使用方式：
 * 在 layout.tsx 中包裹整个应用
 */
export function AuthProvider({
  children,
  isDev = false,
}: {
  children: React.ReactNode;
  isDev?: boolean;
}) {
  const hydrateFromCookie = useAuthStore((state) => state.hydrateFromCookie);

  useEffect(() => {
    // 在客户端挂载时恢复认证状态
    hydrateFromCookie();
  }, [hydrateFromCookie]);

  return (
    <>
      {isDev && <Inspector />}
      {children}
    </>
  );
}
