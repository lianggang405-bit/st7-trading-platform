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
  const [newWalletAddress, setNewWalletAddress] = useState('');
  const [selectedChain, setSelectedChain] = useState('ETH');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const handleConnect = () => {
    setError('');

    if (!newWalletAddress) {
      setError('请输入钱包地址');
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(newWalletAddress)) {
      setError('无效的钱包地址格式');
      return;
    }

    const isAlreadyConnected = wallets.some(
      (w) => w.address.toLowerCase() === newWalletAddress.toLowerCase()
    );
    if (isAlreadyConnected) {
      setError('该钱包地址已连接');
      return;
    }

    setIsConnecting(true);

    setTimeout(() => {
      const newWallet: Wallet = {
        address: newWalletAddress,
        chain: selectedChain,
        connectedAt: new Date().toISOString(),
      };

      setWallets([...wallets, newWallet]);
      setNewWalletAddress('');
      setIsConnecting(false);
      setShowAddModal(false);

      console.log(`[Wallet] Connected wallet: ${newWalletAddress} on ${selectedChain}`);
    }, 1000);
  };

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
            className="fixed left-4 top-4 z-50 flex items-center gap-2 text-gray-700 hover:text-gray-900"
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
            <span className="text-sm text-red-500">返回按键</span>
          </button>

          {/* 顶部标题 */}
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-700">錢包</h1>
              <span className="text-xs text-red-500">当前页面显示</span>
            </div>
          </div>

          {/* 主要内容 */}
          <div className="flex min-h-screen items-center justify-center p-8">
            <div className="w-full max-w-4xl">
              {/* 左侧余额显示 */}
              <div className="mb-8">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-sm text-gray-600">餘額</span>
                      <span className="text-xs text-red-500">余额显示</span>
                    </div>
                    <div className="text-5xl font-bold text-blue-600">
                      {formatBalance(balance)}
                    </div>
                  </div>
                </div>
              </div>

              {/* 添加数字货币地址按钮 */}
              <div className="space-y-4">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex w-full items-center justify-center gap-3 rounded-lg border-2 border-gray-300 p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
                    <svg
                      className="h-6 w-6 text-gray-700"
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
                  <div className="flex items-center gap-2">
                    <span className="text-lg text-gray-700">添加數字貨幣地址</span>
                    <span className="text-xs text-red-500">添加数字货币地址按钮</span>
                  </div>
                </button>

                {/* 已连接的钱包列表 */}
                {wallets.length > 0 && (
                  <div className="mt-8 space-y-3">
                    <h2 className="text-sm font-medium text-gray-600">已连接的钱包</h2>
                    {wallets.map((wallet, index) => (
                      <div
                        key={wallet.address}
                        className="flex items-center justify-between rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                            <span className="text-sm font-semibold text-blue-600">
                              {index + 1}
                            </span>
                          </div>
                          <div>
                            <div className="font-mono text-sm font-medium text-gray-900">
                              {formatAddress(wallet.address)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {wallet.chain} • {new Date(wallet.connectedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDisconnect(wallet.address)}
                          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
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

          {/* 添加钱包弹窗 */}
          {showAddModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">添加数字货币地址</h3>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setError('');
                      setNewWalletAddress('');
                    }}
                    className="rounded-md p-2 hover:bg-gray-100 transition-colors"
                  >
                    <svg
                      className="h-5 w-5 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="chain" className="mb-2 block text-sm font-medium text-gray-700">
                      选择链
                    </label>
                    <select
                      id="chain"
                      value={selectedChain}
                      onChange={(e) => setSelectedChain(e.target.value)}
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    >
                      <option value="ETH">Ethereum (ETH)</option>
                      <option value="BSC">BSC</option>
                      <option value="POLYGON">Polygon</option>
                      <option value="SOL">Solana</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="walletAddress" className="mb-2 block text-sm font-medium text-gray-700">
                      钱包地址
                    </label>
                    <input
                      id="walletAddress"
                      type="text"
                      value={newWalletAddress}
                      onChange={(e) => setNewWalletAddress(e.target.value)}
                      placeholder="0x1234567890abcdef1234567890abcdef12345678"
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    />
                  </div>

                  {error && (
                    <div className="rounded-md bg-red-50 p-3">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  )}

                  <button
                    onClick={handleConnect}
                    disabled={isConnecting}
                    className="w-full rounded-md bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isConnecting ? '连接中...' : '连接钱包'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </AuthGuard>
    </PageShell>
  );
}
