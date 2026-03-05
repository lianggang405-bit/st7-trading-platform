/**
 * 入金/出金按钮组件
 * 两个并排的大按钮，蓝色和红色
 */
'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

export function DepositWithdrawButtons() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'zh-TW';
  const t = useTranslations('me');

  return (
    <div className="flex gap-3 px-4 mt-6">
      {/* 入金按钮 */}
      <button
        onClick={() => router.push(`/${locale}/deposit`)}
        className="flex-1 bg-blue-500 text-white rounded-xl p-3 flex items-center shadow-lg hover:bg-blue-600 active:bg-blue-700 active:scale-95 transition-all"
      >
        <div className="mr-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>
        <div className="text-left">
          <div className="text-base font-semibold">{t('deposit')}</div>
          <div className="text-xs text-blue-100">{t('accountDetails')}</div>
        </div>
      </button>

      {/* 出金按钮 - 使用 uni-app 风格的红色 */}
      <button
        onClick={() => router.push(`/${locale}/withdraw`)}
        className="flex-1 bg-red-500 text-white rounded-xl p-3 flex items-center shadow-lg hover:bg-red-600 active:bg-red-700 active:scale-95 transition-all"
        style={{ backgroundColor: '#e64340' }}
      >
        <div className="mr-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="text-left">
          <div className="text-base font-semibold">{t('withdraw')}</div>
          <div className="text-xs text-red-100">{t('accountDetails')}</div>
        </div>
      </button>
    </div>
  );
}
