'use client';

import { useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '../../../stores/authStore';
import { ForexLogo } from '../../../components/brand/forex-logo';
import { locales } from '../../../i18n';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { login, register, hydrateFromCookie } = useAuthStore();
  const t = useTranslations();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 获取当前语言
  const locale = pathname.split('/')[1];

  // 获取重定向路径（默认跳转到市场页）
  const redirectParam = searchParams.get('redirect') || '/market';

  // 检查 redirectParam 是否已经包含 locale，避免双重 locale
  const hasLocalePrefix = locales.includes(redirectParam.split('/')[1] as any);
  const redirectPath = hasLocalePrefix
    ? redirectParam
    : (redirectParam.startsWith('/') ? `/${locale}${redirectParam}` : `/${locale}/${redirectParam}`);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await login(email, password);

      // 添加短暂延迟，确保 cookie 被浏览器完全处理
      await new Promise(resolve => setTimeout(resolve, 100));

      // 登录成功后跳转到原目标路径
      router.push(redirectPath);
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  const handleCreateDemo = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      // 自动创建模拟账户
      const demoEmail = `demo_${Date.now()}@forex.com`;
      const demoPassword = 'demo123';

      await register(demoEmail, demoPassword, 'demo');

      // 自动登录模拟账户（快速体验）
      await login(demoEmail, demoPassword);

      // 强制刷新跳转，确保状态完全重置
      // 使用 window.location 代替 router.push 以避免路由状态竞争
      const targetPath = `/${locale}/market`;
      window.location.href = targetPath;
    } catch (err) {
      console.error('Create demo account failed:', err);
      alert(t('auth.createDemoFailed'));
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    // 提示用户联系客服
    alert(t('auth.contactSupportForPassword'));
  };

  const handleGoToRegister = () => {
    // 跳转到注册页面（创建正式账户）
    router.push(`/${locale}/register`);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 relative">
      {/* 左上角关闭按钮 */}
      <button className="absolute top-4 left-4 text-gray-500 hover:text-gray-700">
        <div className="w-6 h-0.5 bg-gray-500 rounded"></div>
      </button>

      {/* 右上角语言标识 - 台湾旗帜 */}
      <div className="absolute top-4 right-4">
        <div className="w-6 h-4 rounded bg-red-600 flex items-center justify-center overflow-hidden">
          <div className="absolute w-full h-0.5 bg-blue-600 top-1"></div>
          <div className="absolute w-1.5 h-1.5 bg-blue-600 rounded-full top-0.5 left-2"></div>
        </div>
      </div>

      {/* Logo */}
      <ForexLogo />

      {/* 登录表单 */}
      <div className="w-full max-w-md">
        {/* 邮箱输入框 */}
        <div className="mb-6">
          <label className="block text-xs text-gray-500 mb-2">{t('auth.emailLogin')}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('auth.emailPlaceholder')}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>

        {/* 密码输入框 */}
        <div className="mb-4">
          <label className="block text-xs text-gray-700 mb-2">{t('common.password')}</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('auth.passwordPlaceholder')}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>

        {/* 底部链接 */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-xs">
            <span className="text-gray-600">{t('auth.noAccount')}</span>
            <button
              onClick={handleGoToRegister}
              className="ml-1 text-blue-500 hover:text-blue-600 font-medium"
            >
              {t('auth.registerRealAccount')}
            </button>
          </div>
          <button
            onClick={handleForgotPassword}
            className="text-xs text-gray-600 hover:text-gray-800"
          >
            {t('auth.forgotPassword')}
          </button>
        </div>

        {/* 登入按钮 */}
        <button
          onClick={handleLogin}
          disabled={!email || !password}
          className="w-full py-3 bg-blue-500 text-white rounded-full text-sm font-medium hover:bg-blue-600 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all mb-3"
        >
          {t('common.login')}
        </button>

        {/* 创建模拟账户按钮 */}
        <button
          onClick={handleCreateDemo}
          disabled={isLoading}
          className={`w-full py-3 bg-blue-500 text-white rounded-full text-sm font-medium hover:bg-blue-600 active:bg-blue-700 transition-all ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {isLoading ? t('common.loading') : t('auth.createDemoAccount')}
        </button>
      </div>
    </div>
  );
}
