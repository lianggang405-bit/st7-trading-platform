/**
 * 悬浮客服按钮组件
 */
'use client';

import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';

export function FloatingChatButton() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1];

  const handleClick = () => {
    router.push(`/${locale}/customer-service`);
  };

  return (
    <button
      onClick={handleClick}
      className="fixed right-4 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white w-12 h-12 rounded-full shadow-lg hover:bg-blue-700 active:bg-blue-800 transition-all z-50 flex items-center justify-center"
      aria-label="联系客服"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    </button>
  );
}
