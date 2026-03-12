'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { PageShell } from '../../../components/layout/page-shell';
import { MarketItem } from '../../../components/market/market-item';
import { useMarketStore } from '../../../store/marketStore';
import { formatSymbol } from '../../../lib/formatSymbol';

export default function SearchPage() {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('market');
  const marketStore = useMarketStore();
  const symbols = marketStore.getAllSymbols();
  const [query, setQuery] = useState('');
  const [filteredSymbols, setFilteredSymbols] = useState<any[]>([]);

  // 获取语言
  const locale = pathname.split('/')[1];

  // 搜索过滤
  useEffect(() => {
    if (!query.trim()) {
      setFilteredSymbols([]);
      return;
    }

    const searchQuery = query.trim().toLowerCase();

    // 模糊搜索：匹配品种代码的任意部分
    const filtered = symbols.filter(s => {
      const formattedSymbol = formatSymbol(s.symbol).toLowerCase();
      const symbol = s.symbol.toLowerCase();

      // 检查品种代码是否包含搜索词
      if (formattedSymbol.includes(searchQuery) || symbol.includes(searchQuery)) {
        return true;
      }

      return false;
    });

    setFilteredSymbols(filtered);
  }, [query, symbols]);

  // 点击品种跳转到交易页面
  const handleSymbolClick = (symbol: string) => {
    router.push(`/${locale}/trade?symbol=${symbol}`);
  };

  return (
    <PageShell loading={false}>
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* 顶部搜索栏 */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="flex items-center gap-3 px-4 py-3">
            {/* 返回按钮 */}
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* 搜索输入框 */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full h-10 px-4 pr-10 bg-gray-100 rounded-full text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:bg-gray-200 transition-all"
                autoFocus
              />
              {/* 搜索图标 */}
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* 搜索结果 */}
        <div className="mt-2 bg-white">
          {query.trim() === '' ? (
            // 空状态
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-sm text-gray-500">{t('searchEmpty')}</p>
              <p className="text-xs text-gray-400 mt-2">{t('searchExample')}</p>
            </div>
          ) : filteredSymbols.length === 0 ? (
            // 无结果
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-gray-500">{t('noResults')}</p>
              <p className="text-xs text-gray-400 mt-2">{t('tryOtherKeywords')}</p>
            </div>
          ) : (
            // 搜索结果列表
            <div>
              {filteredSymbols.map((item) => (
                <MarketItem
                  key={item.symbol}
                  symbol={item.symbol}
                  price={item.price}
                  change={item.change}
                  onClick={() => handleSymbolClick(item.symbol)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
