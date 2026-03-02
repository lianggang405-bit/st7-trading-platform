'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

export default function ComplaintEmailPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1];
  const t = useTranslations('complaint');
  const tCommon = useTranslations('common');
  const complaintUrl = 'https://www.forexvvvv.top/?lng=big5';
  const [copied, setCopied] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(complaintUrl);
      setCopied(true);
      toast.success(t('copySuccess'));

      // 2秒后恢复按钮状态
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      toast.error(t('copyFailed'));
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 顶部导航栏 */}
      <div className="flex items-center px-4 py-4 border-b border-gray-100">
        <button
          onClick={handleBack}
          className="text-gray-800 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="flex-1 text-center text-lg font-medium text-gray-800">
          {t('title')}
        </h1>
        <div className="w-6" /> {/* 占位，保持标题居中 */}
      </div>

      {/* 主要内容区域 */}
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        {/* 网址显示区域 */}
        <div className="w-full max-w-md bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600 mb-2">{t('url')}</p>
          <p className="text-sm text-blue-600 break-all leading-relaxed">
            {complaintUrl}
          </p>
        </div>

        {/* 复制按钮 */}
        <button
          onClick={handleCopy}
          disabled={copied}
          className="w-full max-w-md bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {copied ? `${t('copied')} ✓` : t('copy')}
        </button>

        {/* 提示信息 */}
        <p className="text-xs text-gray-400 mt-4">
          {t('note')}
        </p>
      </div>
    </div>
  );
}
