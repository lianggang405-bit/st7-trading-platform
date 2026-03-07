'use client';

import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';

/**
 * 客服页面
 * 使用 iframe 嵌入美洽客服，顶部固定导航栏
 */
export default function CustomerServicePage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1];

  const handleBack = () => {
    router.push(`/${locale}/me`);
  };

  return (
    <div className="h-screen bg-white flex flex-col">
      {/* 顶部固定导航栏 */}
      <div className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="px-4 py-4 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="p-1 hover:bg-gray-100 rounded-lg active:bg-gray-200 transition-colors"
            aria-label="返回"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-900">客戶服務</h1>
          <div className="w-8" />
        </div>
      </div>

      {/* 美洽客服 iframe */}
      <div className="flex-1 relative">
        <iframe
          src="/chat.html"
          className="w-full h-full border-0"
          title="在线客服"
          allow="clipboard-write; microphone; camera"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
        />
      </div>
    </div>
  );
}
