'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft, ChevronRight, FileText, RefreshCw } from 'lucide-react';
import { getSupabaseClient } from '@/storage/database/supabase-client';

interface NoticeItem {
  id: number;
  title: string;
  type: string;
  language: string;
  sort: number;
  coverImage: string;
  isShow: boolean;
  keywords: string;
  created_at: string;
  summary?: string;
  content?: string;
}

export default function NoticePage() {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('notice');
  const locale = pathname.split('/')[1];

  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 添加下拉刷新的触摸状态
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotices();

    // 添加页面可见性监听，当页面重新可见时刷新
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchNotices();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/notice/list');
      const data = await response.json();

      if (data.success && data.notices) {
        setNotices(data.notices);
      } else {
        setError(data.error || t('error.fetchFailed'));
      }
    } catch (err) {
      console.error('Failed to fetch notices:', err);
      setError(t('error.networkError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
      setPullDistance(0);
      setIsPulling(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotices();
  };

  // 下拉刷新事件处理
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY);
    const distance = touchEnd - touchStart;

    // 只在页面顶部时才允许下拉
    if (listRef.current && listRef.current.scrollTop === 0 && distance > 0) {
      setPullDistance(Math.min(distance, 80)); // 最大下拉距离 80px
      setIsPulling(distance > 60); // 下拉超过 60px 时触发刷新
    }
  };

  const handleTouchEnd = () => {
    if (isPulling) {
      handleRefresh();
    }
    setTouchStart(0);
    setTouchEnd(0);
    setIsPulling(false);
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <div className="sticky top-0 z-10 bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">公告</h1>
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 下拉刷新提示 */}
      {pullDistance > 0 && (
        <div
          className="fixed top-14 left-0 right-0 flex justify-center items-center z-40 bg-gray-50"
          style={{
            transform: `translateY(${Math.min(pullDistance, 60)}px)`,
            opacity: Math.min(pullDistance / 60, 1),
          }}
        >
          <div className="bg-white rounded-lg px-4 py-2 shadow-sm flex items-center gap-2">
            <RefreshCw size={16} className={isPulling ? 'animate-spin' : ''} />
            <span className="text-sm text-gray-700">{isPulling ? t('refresh.release') : t('refresh.pull')}</span>
          </div>
        </div>
      )}

      {/* 公告列表 - 支持下拉刷新 */}
      <div
        ref={listRef}
        className="px-4 py-4"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">{t('loading')}</div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="text-red-500 mb-2">{error}</div>
            <button
              onClick={fetchNotices}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('retry')}
            </button>
          </div>
        ) : notices.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">{t('noNotices')}</div>
          </div>
        ) : (
          <div className="space-y-3">
            {notices.map((notice) => (
              <div
                key={notice.id}
                className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/${locale}/notice/${notice.id}`)}
              >
                <div className="flex gap-3 p-4">
                  {/* 封面图 */}
                  {notice.coverImage ? (
                    <img
                      src={notice.coverImage}
                      alt={notice.title}
                      className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-8 h-8 text-white" />
                    </div>
                  )}

                  {/* 内容 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-base font-medium text-gray-900 line-clamp-2">
                        {notice.title}
                      </h3>
                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded">
                        {notice.type}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
