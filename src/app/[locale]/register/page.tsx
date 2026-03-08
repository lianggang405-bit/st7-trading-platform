'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '../../../stores/authStore';
import { ForexLogo } from '../../../components/brand/forex-logo';
import { locales } from '../../../config/locales';

// 语言显示名称映射
const languageNames: Record<string, string> = {
  'zh-TW': '繁體中文',
  'en': 'English',
  'th': 'ไทย',
  'vi': 'Tiếng Việt',
  'ru': 'Русский',
  'de': 'Deutsch',
};

export default function RegisterPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { register } = useAuthStore();

  // 獲取当前语言
  const locale = pathname.split('/')[1];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inviteCode, setInviteCode] = useState(''); // 邀请码（可选）
  const [captchaCode, setCaptchaCode] = useState(''); // 验证码
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  // 模擬验证码
  const [captchaText] = useState('721013');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // 验证邮箱
    if (!email) {
      alert('請輸入郵箱');
      return;
    }

    // 验证密码
    if (!password) {
      alert('請輸入密碼');
      return;
    }

    if (password.length < 6) {
      alert('密碼必須至少 6 個字符');
      return;
    }

    if (password !== confirmPassword) {
      alert('密碼不匹配');
      return;
    }

    // 验证码验证
    if (!captchaCode) {
      alert('請輸入驗證碼');
      return;
    }

    if (captchaCode !== captchaText) {
      alert('驗證碼錯誤');
      return;
    }

    try {
      console.log('Starting registration...');
      // 注册正式賬戶（accountType: 'real'，初始余额为 0）
      await register(email, password, 'real');

      console.log('Registration successful!');
      // 注册成功，弹出提示
      alert('註冊成功！請使用您的郵箱和密碼登入。');

      console.log('Redirecting to login page...');
      // 跳转到登录页面
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

  // 语言选择函数
  const selectLanguage = (selectedLocale: string) => {
    setShowLanguageMenu(false);
    router.push(`/${selectedLocale}/register`);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 relative">
      {/* 左上角返回按钮 */}
      <button
        onClick={() => router.push(`/${locale}/login`)}
        className="absolute top-4 left-4 text-gray-600 hover:text-gray-800"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* 右上角语言切换 */}
      <div className="absolute top-4 right-4 relative">
        <button
          onClick={() => setShowLanguageMenu(!showLanguageMenu)}
          className="cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-2"
          title="切换语言"
        >
          <div className="w-6 h-4 rounded bg-red-600 flex items-center justify-center overflow-hidden">
            <div className="absolute w-full h-0.5 bg-blue-600 top-1"></div>
            <div className="absolute w-1.5 h-1.5 bg-blue-600 rounded-full top-0.5 left-2"></div>
          </div>
          <span className="text-xs text-gray-600">{languageNames[locale] || locale}</span>
        </button>

        {/* 语言选择菜单 */}
        {showLanguageMenu && (
          <>
            {/* 半透明遮罩层 */}
            <div
              className="fixed inset-0 bg-transparent z-10"
              onClick={() => setShowLanguageMenu(false)}
            />
            
            {/* 下拉菜单 */}
            <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 min-w-[120px]">
              {locales.map((loc) => (
                <button
                  key={loc}
                  onClick={() => selectLanguage(loc)}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors ${
                    locale === loc ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                  }`}
                >
                  {languageNames[loc] || loc}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Logo */}
      <div className="mb-8">
        <ForexLogo />
      </div>

      {/* 注册表单 */}
      <div className="w-full max-w-md mt-8">
        {/* 邮箱输入框 */}
        <div className="mb-4">
          <label className="block text-xs text-blue-500 mb-2">請輸入您的郵箱</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="請輸入您的郵箱"
            className="w-full px-4 py-3 bg-gray-50 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>

        {/* 密码输入框 */}
        <div className="mb-4">
          <label className="block text-xs text-gray-700 mb-2">密碼</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="請輸入密碼"
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>

        {/* 确认密码输入框 */}
        <div className="mb-4">
          <label className="block text-xs text-gray-700 mb-2">請再次輸入密碼</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="請再次輸入密碼"
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>

        {/* 邀请码输入框（可选） */}
        <div className="mb-4">
          <label className="block text-xs text-gray-700 mb-2">邀請碼</label>
          <input
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="請輸入邀請碼（選填）"
            className="w-full px-4 py-3 bg-gray-50 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>

        {/* 验证码输入框 */}
        <div className="mb-6">
          <label className="block text-xs text-gray-700 mb-2">請輸入驗證碼</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={captchaCode}
              onChange={(e) => setCaptchaCode(e.target.value)}
              placeholder="請輸入驗證碼"
              className="flex-1 px-4 py-3 bg-gray-50 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
            {/* 模擬验证码图片 */}
            <div className="w-28 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden relative">
              <div className="text-gray-600 text-lg font-bold" style={{
                transform: 'rotate(-5deg)',
                textShadow: '1px 1px 0px #ccc, -1px -1px 0px #fff'
              }}>
                {captchaText}
              </div>
              {/* 干扰线 */}
              <div className="absolute inset-0 flex flex-col justify-around opacity-20 pointer-events-none">
                <div className="w-full h-0.5 bg-blue-500 rotate-12"></div>
                <div className="w-full h-0.5 bg-green-500 -rotate-12"></div>
              </div>
            </div>
          </div>
        </div>

        {/* 注册按钮 */}
        <button
          onClick={handleRegister}
          disabled={!email || !password || !confirmPassword || !captchaCode}
          className="w-full py-3 bg-blue-500 text-white rounded-full text-sm font-medium hover:bg-blue-600 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          註冊
        </button>
      </div>
    </div>
  );
}
