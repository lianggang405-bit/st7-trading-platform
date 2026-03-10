'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AuthGuard } from '../../../components/auth-guard';
import { PageShell } from '../../../components/layout/page-shell';
import { MarketHeader } from '../../../components/market/market-header';
import { MarketList, MarketSymbol } from '../../../components/market/market-list';
import { useAuthStore } from '../../../stores/authStore';
import { useMarketStore } from '../../../stores/marketStore';
import { mockSymbols } from '../../../lib/market-mock-data';

export default function MarketPage() {
  const router = useRouter();
  const pathname = usePathname();
  const marketState = useMarketStore();
  const symbols = marketState?.symbols ?? [];
  const setSymbols = marketState?.setSymbols;
  const { isHydrated, isLogin } = useAuthStore();
  const [categoryFilter, setCategoryFilter] = useState('Forex');
  const [filteredSymbols, setFilteredSymbols] = useState<MarketSymbol[]>([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);

  // 调试日志
  useEffect(() => {
    console.log('[MarketPage] isHydrated:', isHydrated, 'isLogin:', isLogin, 'loaded:', loaded);
  }, [isHydrated, isLogin, loaded]);

  // 从数据库加载数据
  useEffect(() => {
    if (loaded || !isHydrated) return;

    async function loadSymbols() {
      try {
        setLoading(true);
        const response = await fetch('/api/trading/symbols');
        const data = await response.json();

        console.log('[MarketPage] API Response:', data);

        if (data.success && data.symbols && setSymbols) {
          console.log('[MarketPage] Setting symbols:', data.symbols.slice(0, 5)); // 打印前5个
          setSymbols(data.symbols);
        } else {
          // 如果 API 失敗，使用备用数据
          console.log('[MarketPage] API failed, using mockSymbols');
          setSymbols?.(mockSymbols);
        }
      } catch (error) {
        console.error('[MarketPage] Failed to load symbols:', error);
        // 如果 API 失敗，使用备用数据
        setSymbols?.(mockSymbols);
      } finally {
        setLoading(false);
        setLoaded(true);
      }
    }

    loadSymbols();
  }, [loaded, isHydrated, setSymbols]);

  // 根据分类过滤
  useEffect(() => {
    console.log('[MarketPage] symbols updated:', symbols.slice(0, 3)); // 打印前3个

    let filtered: any[] = [];

    if (categoryFilter === 'Forex') {
      // Forex 显示外汇类交易对
      filtered = symbols
        .filter(s => s.category === 'forex')
        .map(s => ({
          symbol: s.symbol,
          price: s.price,
          change: s.change,
        }));
    } else if (categoryFilter === 'Metal') {
      // Metal 显示贵金属
      filtered = symbols
        .filter(s => s.category === 'gold')
        .map(s => ({
          symbol: s.symbol,
          price: s.price,
          change: s.change,
        }));
    } else if (categoryFilter === 'Crypto') {
      // Crypto 显示加密货币
      filtered = symbols
        .filter(s => s.category === 'crypto')
        .map(s => ({
          symbol: s.symbol,
          price: s.price,
          change: s.change,
        }));
    } else if (categoryFilter === 'Energy') {
      // Energy 显示能源
      filtered = symbols
        .filter(s => s.category === 'energy')
        .map(s => ({
          symbol: s.symbol,
          price: s.price,
          change: s.change,
        }));
    } else if (categoryFilter === 'CFD') {
      // CFD 显示指数（CFD）
      filtered = symbols
        .filter(s => s.category === 'cfd')
        .map(s => ({
          symbol: s.symbol,
          price: s.price,
          change: s.change,
        }));
    }

    setFilteredSymbols(filtered);
  }, [symbols, categoryFilter]);

  // ✅ 禁用实时价格刷新，因为没有可靠的实时价格源
  // 未来应该通过 WebSocket 或 API 获取真实实时价格

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
