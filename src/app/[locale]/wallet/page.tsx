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

  const handleConnect = () => {
    setError('');

    // 验证钱包地址
    if (!newWalletAddress) {
      setError('请输入钱包地址');
      return;
    }

    // 简单验证以太坊地址格式（以 0x 开头，42 位）
    if (!/^0x[a-fA-F0-9]{40}$/.test(newWalletAddress)) {
      setError('无效的钱包地址格式（应为 42 位的十六进制地址，以 0x 开头）');
      return;
    }

    // 检查是否已连接
    const isAlreadyConnected = wallets.some(
      (w) => w.address.toLowerCase() === newWalletAddress.toLowerCase()
    );
    if (isAlreadyConnected) {
      setError('该钱包已连接');
      return;
    }

    setIsConnecting(true);

    // 模拟连接延迟
    setTimeout(() => {
      const newWallet: Wallet = {
        address: newWalletAddress,
        chain: selectedChain,
        connectedAt: new Date().toISOString(),
      };

      setWallets([...wallets, newWallet]);
      setNewWalletAddress('');
      setIsConnecting(false);

      console.log(`[Wallet] Connected wallet: ${newWalletAddress} on ${selectedChain}`);
    }, 1000);
  };

  const handleDisconnect = (address: string) => {
    setWallets(wallets.filter((w) => w.address !== address));
    console.log(`[Wallet] Disconnected wallet: ${address}`);
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // 同步后端余额数据
  useEffect(() => {
    if (user && isHydrated) {
      syncFromBackend();
    }
  }, [user, isHydrated, syncFromBackend]);

  // 格式化余额显示
  const formatBalance = (amount: number) => {
    return `$${new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)}`;
  };

  return (
    <PageShell loading={!isHydrated}>
      <AuthGuard>
        <div className="min-h-screen bg-gray-50">
        {/* 顶部导航 */}
        <nav className="bg-white shadow-sm">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              {/* 左上角余额展示 */}
              <div className="flex items-center gap-6">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-4 shadow-lg">
                  <div className="flex flex-col">
                    <span className="text-indigo-100 text-sm font-medium">可用余额</span>
                    <span className="text-white text-2xl font-bold mt-1">
                      {formatBalance(balance)}
                    </span>
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">钱包授权</h1>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  用户ID: {user?.id}
                </span>
                <button
                  onClick={handleLogout}
                  className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                  退出登录
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* 主要内容 */}
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* 左侧：连接钱包表单 */}
            <div className="space-y-6">
              {/* 连接新钱包 */}
              <div className="rounded-lg bg-white p-6 shadow-md">
                <h2 className="mb-4 text-xl font-semibold text-gray-900">连接钱包</h2>
                <p className="mb-6 text-sm text-gray-600">
                  授权钱包地址以绑定到您的账户。授权后，您可以：
                </p>
                <ul className="mb-6 list-inside list-disc space-y-2 text-sm text-gray-600">
                  <li>查看钱包余额</li>
                  <li>接收资产转账</li>
                  <li>管理授权状态</li>
                </ul>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="chain" className="mb-2 block text-sm font-medium text-gray-700">
                      选择链
                    </label>
                    <select
                      id="chain"
                      value={selectedChain}
                      onChange={(e) => setSelectedChain(e.target.value)}
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                    >
                      <option value="ETH">以太坊 (ETH)</option>
                      <option value="BSC">币安智能链 (BSC)</option>
                      <option value="POLYGON">多边形 (MATIC)</option>
                      <option value="SOL">索拉纳 (SOL)</option>
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
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      请输入有效的 {selectedChain} 钱包地址
                    </p>
                  </div>

                  {error && (
                    <div className="rounded-md bg-red-50 p-4">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  )}

                  <button
                    onClick={handleConnect}
                    disabled={isConnecting}
                    className="w-full rounded-md bg-indigo-600 px-4 py-2 text-white font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isConnecting ? '连接中...' : '连接钱包'}
                  </button>
                </div>
              </div>

              {/* 提示信息 */}
              <div className="rounded-md bg-blue-50 p-4">
                <h3 className="mb-2 font-semibold text-blue-900">⚠️ 重要提示</h3>
                <ul className="list-inside list-disc space-y-1 text-sm text-blue-800">
                  <li>本页面仅用于授权钱包地址，不涉及任何链上交易</li>
                  <li>授权后，您可以在其他页面查看钱包状态</li>
                  <li>请确保输入正确的钱包地址</li>
                  <li>如果钱包丢失，请联系客服解除授权</li>
                </ul>
              </div>
            </div>

            {/* 右侧：已连接钱包列表 */}
            <div>
              <div className="rounded-lg bg-white p-6 shadow-md">
                <h2 className="mb-4 text-xl font-semibold text-gray-900">已连接钱包</h2>
                <p className="mb-4 text-sm text-gray-600">
                  您已连接 {wallets.length} 个钱包
                </p>

                {wallets.length === 0 ? (
                  <div className="rounded-md bg-gray-50 p-8 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-200">
                      <svg
                        className="h-6 w-6 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                    <p className="text-gray-500">暂无已连接的钱包</p>
                    <p className="mt-2 text-sm text-gray-400">
                      在左侧输入钱包地址以连接
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {wallets.map((wallet, index) => (
                      <div
                        key={wallet.address}
                        className="rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="mb-2 flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100">
                                <span className="text-sm font-semibold text-indigo-600">
                                  {index + 1}
                                </span>
                              </div>
                              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                                已连接
                              </span>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">地址</span>
                                <span className="font-mono text-sm font-semibold text-gray-900">
                                  {formatAddress(wallet.address)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">链</span>
                                <span className="text-sm font-semibold text-gray-900">
                                  {wallet.chain}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">连接时间</span>
                                <span className="text-xs text-gray-500">
                                  {new Date(wallet.connectedAt).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDisconnect(wallet.address)}
                            className="ml-4 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
                          >
                            断开连接
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
    </PageShell>
  );
}
