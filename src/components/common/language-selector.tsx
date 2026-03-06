'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { languages } from '@/config/languages';

/**
 * 语言选择下拉菜单组件
 */
export function LanguageSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // 更安全的语言提取方式
  const pathSegments = pathname.split('/').filter(Boolean);
  const currentLocale = pathSegments[0] || 'zh-TW';

  const handleLanguageChange = (languageCode: string) => {
    // 保存用户选择到 localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', languageCode);
      
      // 同时设置 cookie，用于服务端重定向
      // 设置 365 天过期
      const expires = new Date();
      expires.setTime(expires.getTime() + 365 * 24 * 60 * 60 * 1000);
      document.cookie = `locale=${languageCode}; expires=${expires.toUTCString()}; path=/`;
    }
    
    // 更安全的路径替换逻辑
    let newPathname: string;

    if (pathSegments.length === 0) {
      // 如果只有根路径
      newPathname = `/${languageCode}`;
    } else {
      // 替换语言部分
      pathSegments[0] = languageCode;
      newPathname = '/' + pathSegments.join('/');
    }

    router.push(newPathname);
    setIsOpen(false);
  };

  const currentLanguage = languages.find(lang => lang.code === currentLocale);

  // 台湾旗帜 SVG 组件
  const TaiwanFlag = ({ className = 'w-6 h-4' }: { className?: string }) => (
    <svg 
      viewBox="0 0 48 32" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="48" height="32" fill="#FE0000"></rect>
      <rect width="24" height="16" fill="#000095"></rect>
      <g transform="translate(12,8)">
        <g fill="#FFFFFF">
          <polygon points="0,-6 1.2,-3.5 -1.2,-3.5"></polygon>
          <polygon points="0,-6 1.2,-3.5 -1.2,-3.5" transform="rotate(30)"></polygon>
          <polygon points="0,-6 1.2,-3.5 -1.2,-3.5" transform="rotate(60)"></polygon>
          <polygon points="0,-6 1.2,-3.5 -1.2,-3.5" transform="rotate(90)"></polygon>
          <polygon points="0,-6 1.2,-3.5 -1.2,-3.5" transform="rotate(120)"></polygon>
          <polygon points="0,-6 1.2,-3.5 -1.2,-3.5" transform="rotate(150)"></polygon>
          <polygon points="0,-6 1.2,-3.5 -1.2,-3.5" transform="rotate(180)"></polygon>
          <polygon points="0,-6 1.2,-3.5 -1.2,-3.5" transform="rotate(210)"></polygon>
          <polygon points="0,-6 1.2,-3.5 -1.2,-3.5" transform="rotate(240)"></polygon>
          <polygon points="0,-6 1.2,-3.5 -1.2,-3.5" transform="rotate(270)"></polygon>
          <polygon points="0,-6 1.2,-3.5 -1.2,-3.5" transform="rotate(300)"></polygon>
          <polygon points="0,-6 1.2,-3.5 -1.2,-3.5" transform="rotate(330)"></polygon>
        </g>
        <circle r="3.2" fill="#FFFFFF"></circle>
      </g>
    </svg>
  );

  return (
    <div className="relative">
      {/* 触发按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1.5 hover:bg-gray-200 active:bg-gray-300 transition-colors"
        aria-label="选择语言"
      >
        {currentLocale === 'zh-TW' ? (
          <TaiwanFlag className="w-6 h-4" />
        ) : (
          <span className="text-lg">{currentLanguage?.flag}</span>
        )}
        <span className="hidden sm:block text-xs text-gray-700 font-medium">{currentLanguage?.nativeName || '繁體中文'}</span>
        <svg
          className={`h-4 w-4 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <>
          {/* 遮罩层 */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* 菜单内容 */}
          <div className="absolute top-full left-0 mt-2 z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[200px] max-h-[300px] overflow-y-auto">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className={`w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 active:bg-gray-100 transition-colors ${
                  currentLocale === language.code ? 'bg-blue-50' : ''
                }`}
              >
                {language.code === 'zh-TW' ? (
                  <TaiwanFlag className="w-7 h-5" />
                ) : (
                  <span className="text-xl">{language.flag}</span>
                )}
                <div className="text-sm text-gray-900 font-medium">{language.nativeName}</div>
                {currentLocale === language.code && (
                  <svg className="h-4 w-4 text-blue-600 flex-shrink-0 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
