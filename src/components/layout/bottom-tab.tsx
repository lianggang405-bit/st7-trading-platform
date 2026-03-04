'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface TabItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

export function BottomTab() {
  const pathname = usePathname();
  const t = useTranslations('nav');
  const locale = pathname.split('/')[1] || 'zh-TW';

  const tabs: TabItem[] = [
    {
      name: t('home'),
      href: `/${locale}/market`,
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
      ),
    },
    {
      name: t('order'),
      href: `/${locale}/position`,
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      name: t('trade'),
      href: `/${locale}/trade`,
      icon: (
        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </div>
      ),
    },
    {
      name: t('wealth'),
      href: `/${locale}/wealth`,
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      name: t('me'),
      href: `/${locale}/me`,
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pb-4">
      <div className="mx-4">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
          <div className="flex items-stretch">
            {tabs.map((tab) => {
              const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/');
              const isTradeTab = tab.name === t('trade');
              
              return (
                <Link
                  key={tab.name}
                  href={tab.href}
                  className={`flex flex-col items-center justify-center flex-1 py-3 transition-colors active:bg-gray-50 ${
                    isActive ? 'text-blue-600' : 'text-gray-500'
                  }`}
                >
                  <div className={`relative ${isTradeTab ? '-mt-8' : ''}`}>
                    {tab.icon}
                    {isActive && !isTradeTab && (
                      <span className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                    )}
                  </div>
                  <span className={`text-xs mt-1 font-medium ${isTradeTab ? 'hidden' : ''}`}>{tab.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
      <div style={{ height: 'env(safe-area-inset-bottom)' }}></div>
    </div>
  );
}
