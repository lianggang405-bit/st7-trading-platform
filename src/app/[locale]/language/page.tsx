'use client';

import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { languages } from '@/config/languages';

/**
 * 语言选择页面
 */
export default function LanguagePage() {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations();

  // 更安全的语言提取方式
  const pathSegments = pathname.split('/').filter(Boolean);
  const currentLocale = pathSegments[0] || 'zh-TW';

  const handleLanguageChange = (languageCode: string) => {
    // 更安全的路径替换逻辑
    let newPathname: string;

    if (pathSegments.length === 0) {
      // 如果只有根路径
      newPathname = `/${languageCode}`;
    } else {
      // 替换语言部分，保持其余路径不变
      pathSegments[0] = languageCode;
      newPathname = '/' + pathSegments.join('/');
    }

    // 跳转到新路径
    router.push(newPathname);
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 py-4 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="p-1 hover:bg-gray-100 rounded-lg active:bg-gray-200 transition-colors"
            aria-label={t('common.back')}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-900">{t('language.title')}</h1>
          <div className="w-8" />
        </div>
      </div>

      {/* 语言列表 */}
      <div className="px-4 py-6">
        <div className="bg-white rounded-lg overflow-hidden shadow-sm">
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className={`w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0 ${
                currentLocale === language.code ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{language.flag}</span>
                <div className="text-left">
                  <div className="text-gray-900 text-base font-medium">{language.name}</div>
                  <div className="text-gray-500 text-sm">{language.nativeName}</div>
                </div>
              </div>
              {currentLocale === language.code && (
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
