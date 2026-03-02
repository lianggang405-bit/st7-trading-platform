import { Skeleton } from '../ui/skeleton';

/**
 * 页面级 Skeleton
 * 用于页面加载时显示骨架屏，提升用户体验
 */
export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 Skeleton */}
      <div className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容 Skeleton */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* 标题区域 */}
        <div className="mb-8 space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-6 w-96" />
        </div>

        {/* 卡片区域 */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg bg-white p-6 shadow-md">
              <Skeleton className="h-6 w-32 mb-4" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>

        {/* 表格/列表区域 */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <Skeleton className="h-6 w-24 mb-4" />
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 py-4 border-b border-gray-100">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-9 w-24" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 卡片级 Skeleton
 * 用于单个卡片的加载状态
 */
export function CardSkeleton() {
  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-10 w-full mt-4" />
      </div>
    </div>
  );
}

/**
 * 列表项 Skeleton
 * 用于列表项的加载状态
 */
export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-gray-100">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-9 w-24" />
    </div>
  );
}
