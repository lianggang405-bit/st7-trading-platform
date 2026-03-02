'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ArrowLeft, ChevronRight, FileText } from 'lucide-react';
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
}

export default function NoticePage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1];

  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNotices();
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
        setError(data.error || '获取公告失败');
      }
    } catch (err) {
      console.error('Failed to fetch notices:', err);
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
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
          <div className="w-5" />
        </div>
      </div>

      {/* 公告列表 */}
      <div className="px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">加载中...</div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="text-red-500 mb-2">{error}</div>
            <button
              onClick={fetchNotices}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              重新加载
            </button>
          </div>
        ) : notices.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">暂无公告</div>
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
