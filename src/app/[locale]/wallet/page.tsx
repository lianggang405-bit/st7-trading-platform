'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '../../../components/auth-guard';
import { PageShell } from '../../../components/layout/page-shell';
import { useAuthStore } from '../../../stores/authStore';
import { useAssetStore } from '../../../stores/assetStore';

export interface Wallet {
  address: string;
  chain: string;
  connectedAt: string;
}

export default function WalletAuthorizePage() {
  const router = useRouter();
  const { user, logout, isHydrated } = useAuthStore();
  const { balance, syncFromBackend } = useAssetStore();

  const [wallets, setWallets] = useState<Wallet[]>([]);

  const handleDisconnect = (address: string) => {
    setWallets(wallets.filter((w) => w.address !== address));
    console.log(`[Wallet] Disconnected wallet: ${address}`);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBalance = (amount: number) => {
    return new Intl.NumberFormat('zh-TW', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  useEffect(() => {
    if (user && isHydrated) {
      syncFromBackend();
    }
  }, [user, isHydrated, syncFromBackend]);

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
              className="h-5 w-5"
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
            <h1 className="text-xl font-bold text-gray-700">錢包</h1>
          </div>

          {/* 主要内容 - 顶部布局 */}
          <div className="min-h-screen p-4 pt-20">
            <div className="w-full">
              {/* 左上角余额显示 */}
              <div className="mb-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="mb-1">
                      <span className="text-xs text-gray-600">餘額</span>
                    </div>
                    <div className="text-3xl font-bold text-blue-600">
                      {formatBalance(balance)}
                    </div>
                  </div>
                </div>
              </div>

              {/* 添加数字货币地址按钮 - 居中显示 */}
              <div className="flex justify-center">
                <button
                  onClick={() => router.push('/wallet/bind')}
                  className="flex items-center justify-center gap-2 rounded-2xl border-2 border-white/30 bg-gradient-to-b from-blue-100/85 to-blue-200/85 px-8 py-4 shadow-xl shadow-blue-300/50 backdrop-blur-md hover:from-blue-200/85 hover:to-blue-300/85 hover:shadow-2xl hover:shadow-blue-400/50 transition-all duration-300"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-300/80 shadow-md">
                    <svg
                      className="h-5 w-5 text-blue-800"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-blue-900">添加數字貨幣地址</span>
                </button>
              </div>

              {/* 已连接的钱包列表 */}
              {wallets.length > 0 && (
                <div className="mt-6 max-w-2xl mx-auto space-y-2">
                  <h2 className="text-xs font-medium text-gray-600">已连接的钱包</h2>
                  {wallets.map((wallet, index) => (
                    <div
                      key={wallet.address}
                      className="flex items-center justify-between rounded-lg border border-gray-200 p-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                          <span className="text-xs font-semibold text-blue-600">
                            {index + 1}
                          </span>
                        </div>
                        <div>
                          <div className="font-mono text-xs font-medium text-gray-900">
                            {formatAddress(wallet.address)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {wallet.chain} • {new Date(wallet.connectedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDisconnect(wallet.address)}
                        className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition-colors"
                      >
                        断开连接
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>


        </div>
      </AuthGuard>
    </PageShell>
  );
}
