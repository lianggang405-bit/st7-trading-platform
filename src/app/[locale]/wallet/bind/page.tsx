'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '../../../../components/auth-guard';
import { PageShell } from '../../../../components/layout/page-shell';
import { useAuthStore } from '../../../../stores/authStore';

export interface Wallet {
  address: string;
  chain: string;
  connectedAt: string;
}

const CURRENCIES = [
  { id: 'ETH', name: 'Ethereum', icon: '⟠' },
  { id: 'BSC', name: 'BSC', icon: '⟠' },
  { id: 'POLYGON', name: 'Polygon', icon: '⟠' },
  { id: 'SOL', name: 'Solana', icon: '◎' },
];

export default function BindWalletPage() {
  const router = useRouter();
  const { user, isHydrated } = useAuthStore();

  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState(CURRENCIES[0]);
  const [walletAddress, setWalletAddress] = useState('');
  const [error, setError] = useState('');
  const [isBinding, setIsBinding] = useState(false);

  const handleBind = () => {
    setError('');

    if (!walletAddress) {
      setError('请输入钱包地址');
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      setError('无效的钱包地址格式');
      return;
    }

    const isAlreadyBound = wallets.some(
      (w: Wallet) => w.address.toLowerCase() === walletAddress.toLowerCase()
    );
    if (isAlreadyBound) {
      setError('该钱包地址已绑定');
      return;
    }

    setIsBinding(true);

    setTimeout(() => {
      const newWallet: Wallet = {
        address: walletAddress,
        chain: selectedCurrency.id,
        connectedAt: new Date().toISOString(),
      };

      setWallets([...wallets, newWallet]);
      setIsBinding(false);
      router.push('..');
    }, 1000);
  };

  return (
    <PageShell loading={false}>
      <AuthGuard>
        <div className="min-h-screen bg-white">
          {/* 左上角返回按钮 */}
          <button
            onClick={() => router.back()}
            className="fixed left-4 top-4 z-50 flex items-center gap-1 text-gray-700 hover:text-gray-900"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          {/* 顶部标题 */}
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
            <h1 className="text-xl font-bold text-gray-900">绑定數位貨幣地址</h1>
          </div>

          {/* 主要内容 */}
          <div className="min-h-screen flex items-center justify-center p-4 pt-20">
            <div className="w-full max-w-md space-y-4">
              {/* 货币选择栏 */}
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <span className="text-sm text-gray-700">貨幣</span>
                <button
                  className="flex items-center gap-2 text-sm text-gray-600"
                  onClick={() => {
                    // 简单的货币切换逻辑
                    const currentIndex = CURRENCIES.findIndex(c => c.id === selectedCurrency.id);
                    const nextIndex = (currentIndex + 1) % CURRENCIES.length;
                    setSelectedCurrency(CURRENCIES[nextIndex]);
                  }}
                >
                  <span className="text-gray-900">{selectedCurrency.name}</span>
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>

              {/* 钱包地址输入框 */}
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <span className="text-sm text-gray-700">錢包地址</span>
                <input
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="錢包地址"
                  className="flex-1 text-right text-sm text-gray-600 outline-none placeholder:text-gray-400"
                />
              </div>

              {/* 错误提示 */}
              {error && (
                <div className="rounded-md bg-red-50 p-3">
                  <p className="text-sm text-red-800 text-center">{error}</p>
                </div>
              )}

              {/* 添加按钮 */}
              <button
                onClick={handleBind}
                disabled={isBinding}
                className="w-full rounded-lg bg-blue-500 py-3 text-sm font-medium text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isBinding ? '绑定中...' : '添加'}
              </button>
            </div>
          </div>
        </div>
      </AuthGuard>
    </PageShell>
  );
}
