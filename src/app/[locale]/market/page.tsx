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
  const tick = marketState?.tick;
  const setSymbols = marketState?.setSymbols;
  const { isHydrated } = useAuthStore();
  const [categoryFilter, setCategoryFilter] = useState('Forex');
  const [filteredSymbols, setFilteredSymbols] = useState<MarketSymbol[]>([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);

  // 从数据库加载数据
  useEffect(() => {
    if (loaded || !isHydrated) return;

    async function loadSymbols() {
      try {
        setLoading(true);
        const response = await fetch('/api/trading/symbols');
        const data = await response.json();

        if (data.success && data.symbols && setSymbols) {
          setSymbols(data.symbols);
        } else {
          // 如果 API 失敗，使用备用数据
          setSymbols?.(mockSymbols);
        }
      } catch (error) {
        console.error('Failed to load symbols:', error);
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
    let filtered: any[] = [];

    if (categoryFilter === 'Forex') {
      // Forex 显示所有交易对
      filtered = symbols.map(s => ({
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
      // Energy 显示能源（根据品种代码过滤）
      const energySymbols = ['NGAS', 'UKOIL', 'USOIL'];
      filtered = symbols
        .filter(s => energySymbols.includes(s.symbol))
        .map(s => ({
          symbol: s.symbol,
          price: s.price,
          change: s.change,
        }));
    } else if (categoryFilter === 'CFD') {
      // CFD 显示指数（根据品种代码过滤）
      const cfdSymbols = ['US500', 'ND25', 'AUS200'];
      filtered = symbols
        .filter(s => cfdSymbols.includes(s.symbol))
        .map(s => ({
          symbol: s.symbol,
          price: s.price,
          change: s.change,
        }));
    }

    setFilteredSymbols(filtered);
  }, [symbols, categoryFilter]);

  // 模擬价格刷新
  useEffect(() => {
    if (!tick) return;

    const interval = setInterval(() => {
      tick();
    }, 1000);

    return () => clearInterval(interval);
  }, [tick]);

  const handleSymbolClick = (symbol: string) => {
    // 点击品种跳转到交易页面
    const locale = pathname.split('/')[1];
    router.push(`/${locale}/trade?symbol=${symbol}`);
  };

  return (
    <PageShell loading={!isHydrated}>
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
