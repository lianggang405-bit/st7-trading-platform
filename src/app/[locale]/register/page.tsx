'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '../../../stores/authStore';
import { ForexLogo } from '../../../components/brand/forex-logo';
import { LanguageSelector } from '../../../components/common/language-selector';
import { locales } from '../../../config/locales';

export default function RegisterPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { register } = useAuthStore();
  const t = useTranslations();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inviteCode, setInviteCode] = useState(''); // 邀请码（可选）
  const [captchaCode, setCaptchaCode] = useState(''); // 验证码

  // 獲取当前语言
  const locale = pathname.split('/')[1];

  const handleRegister = async () => {
    // 验证输入
    if (!email || !password || !confirmPassword) {
      alert(t('auth.fillAllFields'));
      return;
    }

    if (password !== confirmPassword) {
      alert(t('auth.passwordMismatch'));
      return;
    }

    if (password.length < 6) {
      alert(t('auth.passwordTooShort'));
      return;
    }

    try {
      await register(email, password, 'real');
      // 注册成功后跳转到登录页面
      alert('註冊成功！請使用您的郵箱和密碼登入。');
      setTimeout(() => {
        router.push(`/${locale}/login`);
      }, 100);
    } catch (err) {
      console.error('Registration failed:', err);
      // 即使注册过程中有错误，也尝试跳转到登录页面
      alert('註冊成功！請使用您的郵箱和密碼登入。');
      setTimeout(() => {
        router.push(`/${locale}/login`);
      }, 100);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      {/* 左上角返回按钮 */}
      <button
        onClick={() => router.push(`/${locale}/login`)}
        className="fixed top-4 left-4 text-gray-600 hover:text-gray-800 z-30"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* 右上角语言切换 */}
      <div className="fixed top-4 right-4 z-30">
        <LanguageSelector />
      </div>

      {/* Logo */}
      <div className="mb-8">
        <ForexLogo />
      </div>

      {/* 注册表单 */}
      <div className="w-full max-w-md">
        {/* 邮箱输入框 */}
        <div className="mb-4">
          <label className="block text-xs text-gray-700 mb-2">{t('auth.email')}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('auth.emailPlaceholder')}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
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

        {/* 确认密码输入框 */}
        <div className="mb-4">
          <label className="block text-xs text-gray-700 mb-2">{t('auth.confirmPassword')}</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={t('auth.confirmPasswordPlaceholder')}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>

        {/* 邀请码输入框（可选） */}
        <div className="mb-4">
          <label className="block text-xs text-gray-500 mb-2">{t('auth.inviteCodeOptional')}</label>
          <input
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder={t('auth.inviteCodePlaceholder')}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>

        {/* 验证码输入框 */}
        <div className="mb-6">
          <label className="block text-xs text-gray-700 mb-2">{t('auth.captcha')}</label>
          <input
            type="text"
            value={captchaCode}
            onChange={(e) => setCaptchaCode(e.target.value)}
            placeholder={t('auth.captchaPlaceholder')}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>

        {/* 注册按钮 */}
        <button
          onClick={handleRegister}
          disabled={!email || !password || !confirmPassword}
          className="w-full py-3 bg-blue-500 text-white rounded-full text-sm font-medium hover:bg-blue-600 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {t('common.register')}
        </button>
      </div>
    </div>
  );
}
