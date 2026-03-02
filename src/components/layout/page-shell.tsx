'use client';

import { PageSkeleton } from '../skeletons/page-skeleton';

/**
 * PageShell - 页面容器组件
 *
 * 职责：
 * 1. 统一管理页面加载状态
 * 2. 在加载期间显示 Skeleton
 * 3. 在加载完成后显示真实内容
 * 4. 保证页面切换和刷新时的 UI 稳定性
 *
 * 使用方式：
 * ```tsx
 * <PageShell loading={!isHydrated}>
 *   <YourPage />
 * </PageShell>
 * ```
 */
export function PageShell({
  loading,
  children,
}: {
  loading: boolean;
  children: React.ReactNode;
}) {
  if (loading) {
    return <PageSkeleton />;
  }

  return <>{children}</>;
}
