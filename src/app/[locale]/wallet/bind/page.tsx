'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { AuthGuard } from '../../../../components/auth-guard';
import { PageShell } from '../../../../components/layout/page-shell';
import { useAuthStore } from '../../../../stores/authStore';

export interface Wallet {
  address: string;
  chain: string;
  connectedAt: string;
}

interface CurrencyOption {
  id: string;
  name: string;
  protocol: string;
  icon: string;
}

const CURRENCIES: CurrencyOption[] = [
  { id: 'ETH', name: 'Ethereum', protocol: 'ERC20', icon: '⟠' },
  { id: 'BSC', name: 'BSC', protocol: 'BEP20', icon: '⟠' },
  { id: 'POLYGON', name: 'Polygon', protocol: 'MATIC', icon: '⟠' },
  { id: 'SOL', name: 'Solana', protocol: 'SPL', icon: '◎' },
  { id: 'TRX', name: 'Tron', protocol: 'TRC20', icon: '◈' },
  { id: 'BTC', name: 'Bitcoin', protocol: 'BTC', icon: '₿' },
  { id: 'DOGE', name: 'Dogecoin', protocol: 'DOGE', icon: 'Ð' },
];

export default function BindWalletPage() {
  const router = useRouter();
  const t = useTranslations('wallet');
  const { user, isHydrated } = useAuthStore();

  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState(CURRENCIES[0]);
  const [walletAddress, setWalletAddress] = useState('');
  const [error, setError] = useState('');
  const [isBinding, setIsBinding] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const validateAddress = (address: string, currency: CurrencyOption): boolean => {
    switch (currency.id) {
      case 'ETH':
      case 'BSC':
      case 'POLYGON':
        return /^0x[a-fA-F0-9]{40}$/.test(address);
      case 'SOL':
        return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
      case 'TRX':
        return /^T[A-Za-z1-9]{33}$/.test(address);
      case 'BTC':
      case 'DOGE':
        return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^(bc1)[a-z0-9]{11,71}$/.test(address);
      default:
        return address.length > 10;
    }
  };

  const handleBind = () => {
    setError('');

    if (!walletAddress) {
      setError(t('enterWalletAddress'));
      return;
    }

    if (!validateAddress(walletAddress, selectedCurrency)) {
      setError(t('invalidAddress', { currency: selectedCurrency.name }));
      return;
    }

    const isAlreadyBound = wallets.some(
      (w: Wallet) => w.address.toLowerCase() === walletAddress.toLowerCase()
    );
    if (isAlreadyBound) {
      setError(t('addressAlreadyBound'));
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
      setShowSuccessModal(true); // 显示成功弹窗
    }, 1000);
  };

  const handleSuccessConfirm = () => {
    setShowSuccessModal(false);
    router.push('..');
  };

  const handleSelectCurrency = (currency: CurrencyOption) => {
    setSelectedCurrency(currency);
    setWalletAddress(''); // 清空地址
    setError('');
    setShowDropdown(false);
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
            <h1 className="text-xl font-bold text-gray-900">{t('bindTitle')}</h1>
          </div>

          {/* 主要内容 */}
          <div className="min-h-screen flex items-center justify-center p-4 pt-20">
            <div className="w-full max-w-md space-y-4">
              {/* 货币选择下拉菜单 */}
              <div className="relative" ref={dropdownRef}>
                <label className="block text-sm text-gray-700 mb-2">{t('currency')}</label>
                <div
                  className="flex items-center justify-between border-b border-gray-200 pb-3 cursor-pointer"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{selectedCurrency.icon}</span>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{selectedCurrency.name}</div>
                      <div className="text-xs text-gray-500">{selectedCurrency.protocol}</div>
                    </div>
                  </div>
                  <svg
                    className={`h-4 w-4 text-gray-400 transition-transform ${
                      showDropdown ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>

                {/* 下拉菜单列表 */}
                {showDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                    {CURRENCIES.map((currency) => (
                      <div
                        key={currency.id}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleSelectCurrency(currency)}
                      >
                        <span className="text-xl">{currency.icon}</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{currency.name}</div>
                          <div className="text-xs text-gray-500">{currency.protocol}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 钱包地址输入框 */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">{t('walletAddress')}</label>
                <input
                  type="text"
                  value={walletAddress}
                  onChange={(e) => {
                    setWalletAddress(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder={t(`placeholder.${selectedCurrency.id.toLowerCase()}`)}
                  className="w-full px-3 py-2 text-sm border-b border-gray-200 outline-none focus:border-blue-500 transition-colors placeholder:text-gray-400"
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
                {isBinding ? t('binding') : t('bind')}
              </button>
            </div>
          </div>

          {/* 绑定成功弹窗 */}
          {showSuccessModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
                {/* 成功图标 */}
                <div className="flex justify-center mb-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                    <svg
                      className="h-8 w-8 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>

                {/* 成功标题 */}
                <h3 className="text-center text-lg font-semibold text-gray-900 mb-2">
                  {t('bindSuccess')}
                </h3>

                {/* 成功信息 */}
                <div className="text-center text-sm text-gray-600 mb-6">
                  <p>{t('bindSuccessMessage', { currency: selectedCurrency.name, address: `${walletAddress.slice(0, 8)}...${walletAddress.slice(-6)}` })}</p>
                </div>

                {/* 确认按钮 */}
                <button
                  onClick={handleSuccessConfirm}
                  className="w-full rounded-lg bg-blue-500 py-3 text-sm font-medium text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  {t('confirm')}
                </button>
              </div>
            </div>
          )}
        </div>
      </AuthGuard>
    </PageShell>
  );
}
