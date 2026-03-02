'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ArrowLeft, Tag } from 'lucide-react';

interface NoticeDetail {
  id: number;
  title: string;
  type: string;
  language: string;
  sort: number;
  coverImage: string;
  isShow: boolean;
  keywords: string;
  created_at: string;
  content?: string;
}

export default function NoticeDetailPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1];
  const noticeId = pathname.split('/').pop();

  const [notice, setNotice] = useState<NoticeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNoticeDetail();
  }, [noticeId]);

  const fetchNoticeDetail = async () => {
    if (!noticeId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/notice/${noticeId}`);
      const data = await response.json();

      if (data.success && data.notice) {
        setNotice(data.notice);
      } else {
        setError(data.error || '获取公告详情失败');
      }
    } catch (err) {
      console.error('Failed to fetch notice detail:', err);
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
          <h1 className="text-lg font-semibold text-gray-900">公告详情</h1>
          <div className="w-5" />
        </div>
      </div>

      {/* 公告详情内容 */}
      <div className="px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">加载中...</div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="text-red-500 mb-2">{error}</div>
            <button
              onClick={fetchNoticeDetail}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              重新加载
            </button>
          </div>
        ) : !notice ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">公告不存在</div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* 封面图 */}
            {notice.coverImage && (
              <img
                src={notice.coverImage}
                alt={notice.title}
                className="w-full h-48 object-cover"
              />
            )}

            {/* 内容 */}
            <div className="p-4">
              {/* 标题 */}
              <h1 className="text-xl font-bold text-gray-900 mb-3">
                {notice.title}
              </h1>

              {/* 元信息 - 只显示类型 */}
              <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Tag className="w-4 h-4" />
                  <span>{notice.type}</span>
                </div>
              </div>

              {/* 分隔线 */}
              <div className="border-t border-gray-200 my-4" />

              {/* 内容 */}
              <div className="prose prose-sm max-w-none text-gray-700">
                {notice.content || notice.summary ? (
                  <>
                    {notice.summary && (
                      <div className="mb-4">
                        <div className="text-xs text-gray-500 mb-2">摘要</div>
                        <p className="text-gray-700">{notice.summary}</p>
                      </div>
                    )}
                    {notice.content && (
                      <div>
                        <div className="text-xs text-gray-500 mb-2">内容</div>
                        <p className="text-gray-700 whitespace-pre-wrap">{notice.content}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-gray-500">
                    暂无内容
                  </div>
                )}
              </div>

              {/* 关键字 */}
              {notice.keywords && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="text-xs text-gray-500 mb-2">关键字</div>
                  <div className="flex flex-wrap gap-2">
                    {notice.keywords.split(',').map((keyword, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                      >
                        {keyword.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
