'use client';

import { useMemo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AuthGuard } from '../../../components/auth-guard';
import { PageShell } from '../../../components/layout/page-shell';
import { MarketHeader } from '../../../components/market/market-header';
import { MarketList, MarketSymbol } from '../../../components/market/market-list';
import { useAuthStore } from '../../../stores/authStore';
import { useMarketStore } from '../../../store/marketStore';

export default function MarketPage() {
  const router = useRouter();
  const pathname = usePathname();
  const marketStore = useMarketStore();
  const symbols = marketStore.getAllSymbols();
  const { isHydrated, isLogin } = useAuthStore();
  const [categoryFilter, setCategoryFilter] = useState('Forex');

  // 使用 useMemo 计算过滤后的数据，只有当 categoryFilter 或 symbols 内容变化时才重新计算
  const filteredSymbols = useMemo<MarketSymbol[]>(() => {
    let filtered: MarketSymbol[] = [];

    if (categoryFilter === 'Forex') {
      filtered = symbols
        .filter((s) => s.category === 'forex')
        .map((s) => ({
          symbol: s.symbol,
          price: s.price,
          change: s.change,
        }));
    } else if (categoryFilter === 'Metal') {
      filtered = symbols
        .filter((s) => s.category === 'metal')
        .map((s) => ({
          symbol: s.symbol,
          price: s.price,
          change: s.change,
        }));
    } else if (categoryFilter === 'Crypto') {
      filtered = symbols
        .filter((s) => s.category === 'crypto')
        .map((s) => ({
          symbol: s.symbol,
          price: s.price,
          change: s.change,
        }));
    } else if (categoryFilter === 'Energy') {
      filtered = symbols
        .filter((s) => s.category === 'energy')
        .map((s) => ({
          symbol: s.symbol,
          price: s.price,
          change: s.change,
        }));
    } else if (categoryFilter === 'CFD') {
      filtered = symbols
        .filter((s) => s.category === 'cfd')
        .map((s) => ({
          symbol: s.symbol,
          price: s.price,
          change: s.change,
        }));
    }

    return filtered;
  }, [categoryFilter, symbols]);

  const handleSymbolClick = (symbol: string) => {
    // 点击品种跳转到交易页面
    const locale = pathname.split('/')[1];
    router.push(`/${locale}/trade?symbol=${symbol}`);
  };

  return (
    <PageShell loading={false}>
      <AuthGuard>
        <div className="min-h-screen bg-gray-50 pb-20">
          {/* 顶部导航栏 */}
          <MarketHeader
            activeCategory={categoryFilter}
            onCategoryChange={setCategoryFilter}
          />

          {/* 行情列表 */}
          <div className="mt-2">
            <MarketList
              symbols={filteredSymbols}
              onSymbolClick={handleSymbolClick}
            />
          </div>
        </div>
      </AuthGuard>
    </PageShell>
  );
}
