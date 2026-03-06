'use client';

import { useTranslations } from 'next-intl';
import { ForexLogo } from '../brand/forex-logo';
import { LanguageSelector } from '../common/language-selector';

interface MarketHeaderProps {
  activeCategory?: string;
  onCategoryChange?: (category: string) => void;
}

export function MarketHeader({ activeCategory: externalActiveCategory, onCategoryChange }: MarketHeaderProps) {
  const t = useTranslations('market');
  
  const categories = [
    { key: 'forex', value: 'Forex' },
    { key: 'metal', value: 'Metal' },
    { key: 'crypto', value: 'Crypto' },
    { key: 'energy', value: 'Energy' },
    { key: 'cfd', value: 'CFD' },
  ];

  const handleCategoryClick = (category: string) => {
    onCategoryChange?.(category);
  };

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-50 overflow-visible">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between px-4 py-3 h-20">
        {/* 语言选择器 */}
        <div className="flex items-center gap-2">
          <LanguageSelector />
        </div>

        {/* 品牌标识 */}
        <div className="flex items-center justify-center flex-1">
          <ForexLogo />
        </div>

        {/* 搜索图标 */}
        <button className="p-2 text-gray-600 hover:text-gray-800 active:scale-95 transition-transform">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>

      {/* 品类标签栏 */}
      <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
        {categories.map((category) => (
          <button
            key={category.value}
            onClick={() => handleCategoryClick(category.value)}
            className={`whitespace-nowrap rounded px-4 py-2 text-sm font-normal transition-all active:scale-95 w-[80px] ${
              externalActiveCategory === category.value
                ? 'bg-blue-500 text-white'
                : 'bg-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            {t(category.key)}
          </button>
        ))}
      </div>
    </div>
  );
}
