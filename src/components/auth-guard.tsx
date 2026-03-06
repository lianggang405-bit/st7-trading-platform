'use client';

import { useAuthStore } from '../stores/authStore';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isHydrated, isLogin } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  // 提取当前 locale
  const locale = pathname.split('/')[1] || 'zh-TW';

  // ❗ 等 hydrate 完再判断
  useEffect(() => {
    if (!isHydrated) return;

    if (!isLogin) {
      router.replace(`/${locale}/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isHydrated, isLogin, router, pathname, locale]);

  // 🚫 hydrate 之前，直接渲染内容（让用户至少能看到 UI）
  // 这样服务器端渲染时，用户可以看到页面内容（包括 logo）
  if (!isHydrated) return <>{children}</>;

  // ❌ hydrate 完但没登录 → 不渲染页面（由 useEffect 处理重定向）
  if (!isLogin) return null;

  // ✅ 正常放行
  return <>{children}</>;
}
