/**
 * 功能列表组件
 * 显示所有个人中心功能入口
 */
'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '../../stores/authStore';
import { useTranslations } from 'next-intl';

interface MenuItem {
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
}

export function FunctionList() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1];
  const t = useTranslations();
  const { logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      console.log('[FunctionList] Logout button clicked');

      // 显示确认对话框
      if (!confirm(t('profile.confirmLogout'))) {
        console.log('[FunctionList] Logout cancelled by user');
        return;
      }

      console.log('[FunctionList] Starting logout process...');

      // 执行登出
      await logout();

      console.log('[FunctionList] Logout completed, redirecting to login...');

      // 登出后跳转到登录页面
      router.push(`/${locale}/login`);
    } catch (error) {
      console.error('[FunctionList] Logout failed:', error);
      // 即使登出失败，也尝试跳转到登录页面
      router.push(`/${locale}/login`);
    }
  };

  const menuItems: MenuItem[] = [
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      title: t('profile.wallet'),
      onClick: () => router.push(`/${locale}/wallet`),
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      title: t('profile.applications'),
      onClick: () => router.push(`/${locale}/applications`),
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      title: t('profile.changePassword'),
      onClick: () => router.push(`/${locale}/change-password`),
    },
  ];

  return (
    <div className="space-y-4">
      {/* 功能列表 */}
      <div className="bg-white rounded-lg overflow-hidden shadow-sm">
        {menuItems.map((item) => (
          <button
            key={item.title}
            onClick={item.onClick}
            className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0"
          >
            <div className="flex items-center gap-3">
              <div className="text-blue-500">{item.icon}</div>
              <span className="text-gray-900 text-base">{item.title}</span>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
      </div>

      {/* 登出按钮 */}
      <button
        onClick={handleLogout}
        className="w-full bg-white rounded-lg overflow-hidden shadow-sm px-4 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors"
      >
        <div className="flex items-center justify-center gap-3">
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="text-red-500 text-base font-medium">{t('profile.logout')}</span>
        </div>
      </button>
    </div>
  );
}
