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
import { useMarketStream } from '../../../hooks/use-market-stream';

export default function MarketPage() {
  const router = useRouter();
  const pathname = usePathname();
  const marketState = useMarketStore();
  const loadMarket = marketState?.loadMarket;
  const symbols = marketState?.symbols ?? [];
  const { isHydrated, isLogin } = useAuthStore();
  const [categoryFilter, setCategoryFilter] = useState('Forex');
  const [filteredSymbols, setFilteredSymbols] = useState<MarketSymbol[]>([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);

  // 📡 WebSocket 实时行情（仅用于加密货币）
  const cryptoSymbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'DOGEUSDT', 'ADAUSDT'];
  const { data: wsData, isConnected: wsConnected } = useMarketStream({
    symbols: cryptoSymbols,
    type: 'ticker',
    autoReconnect: true,
  });

  // 调试日志
  useEffect(() => {
    console.log('[MarketPage] isHydrated:', isHydrated, 'isLogin:', isLogin, 'loaded:', loaded);
  }, [isHydrated, isLogin, loaded]);

  // 从 marketStore 加载数据
  useEffect(() => {
    if (loaded || !isHydrated) return;

    async function loadSymbols() {
      try {
        setLoading(true);
        // 使用 marketStore 的 loadMarket 函数
        await loadMarket();
        setLoaded(true);
      } catch (error) {
        console.error('[MarketPage] Failed to load symbols:', error);
      } finally {
        setLoading(false);
      }
    }

    loadSymbols();
  }, [loaded, isHydrated, loadMarket]);

  // 🔥 高频刷新市场数据（每1秒，模拟实时推送）
  useEffect(() => {
    if (!loaded) return; // 未加载前不刷新

    const interval = setInterval(() => {
      loadMarket();
    }, 1000); // 1秒刷新

    return () => clearInterval(interval);
  }, [loaded, loadMarket]);

  // 📡 WebSocket 实时更新（仅用于加密货币）
  useEffect(() => {
    if (!wsConnected || wsData.length === 0) return;

    // 更新 marketStore 中的加密货币价格
    wsData.forEach(item => {
      if (item.type === 'ticker' && item.data) {
        marketState?.updateSymbolPrice(item.symbol, item.data.lastPrice, item.data.priceChangePercent);
      }
    });
  }, [wsData, wsConnected, marketState]);

  // 根据分类过滤
  useEffect(() => {
    let filtered: any[] = [];

    if (categoryFilter === 'Forex') {
      filtered = symbols
        .filter(s => s.category === 'forex')
        .map(s => ({
          symbol: s.symbol,
          price: s.price,
          change: s.change,
        }));
    } else if (categoryFilter === 'Metal') {
      filtered = symbols
        .filter(s => s.category === 'metal')
        .map(s => ({
          symbol: s.symbol,
          price: s.price,
          change: s.change,
        }));
    } else if (categoryFilter === 'Crypto') {
      filtered = symbols
        .filter(s => s.category === 'crypto')
        .map(s => ({
          symbol: s.symbol,
          price: s.price,
          change: s.change,
        }));
    } else if (categoryFilter === 'Energy') {
      filtered = symbols
        .filter(s => s.category === 'energy')
        .map(s => ({
          symbol: s.symbol,
          price: s.price,
          change: s.change,
        }));
    } else if (categoryFilter === 'CFD') {
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
