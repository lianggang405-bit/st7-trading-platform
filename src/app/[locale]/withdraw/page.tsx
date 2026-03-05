'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '../../../components/auth-guard';
import { PageShell } from '../../../components/layout/page-shell';
import { useAuthStore } from '../../../stores/authStore';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { toast } from 'sonner';
import {
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface CryptoCurrency {
  id: number;
  code: string;
  name: string;
  nameEn: string;
  symbol: string;
  protocol: string;
  minAmount: number;
  maxAmount: number;
  fee: number;
  feeType: 'fixed' | 'percentage';
}

interface UserBalance {
  usdt: number;
  frozen: number;
  total: number;
}

interface WithdrawalRecord {
  id: number;
  userId: string;
  currency: string;
  amount: number;
  fee: number;
  arrivalAmount: number;
  address: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectReason?: string;
  createdAt: string;
  updatedAt: string;
}

export default function WithdrawPage() {
  const router = useRouter();
  const { user, token, isHydrated } = useAuthStore();

  // 状态管理
  const [cryptoCurrencies, setCryptoCurrencies] = useState<CryptoCurrency[]>([]);
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoCurrency | null>(null);
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [remark, setRemark] = useState('');
  const [userBalance, setUserBalance] = useState<UserBalance>({ usdt: 0, frozen: 0, total: 0 });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'apply' | 'records'>('apply');
  const [withdrawRecords, setWithdrawRecords] = useState<WithdrawalRecord[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);

  // 加载数据 - 等待isHydrated为true后再调用
  useEffect(() => {
    if (isHydrated) {
      fetchCryptoCurrencies();
      fetchUserBalance();
    }
  }, [isHydrated]);

  const fetchCryptoCurrencies = async () => {
    try {
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/app/withdraw/crypto-currencies', {
        headers,
      });
      
      if (!response.ok) {
        console.error('Failed to fetch crypto currencies:', response.status);
        return;
      }
      
      const data = await response.json();
      if (data.success) {
        setCryptoCurrencies(data.currencies || []);
        if (data.currencies && data.currencies.length > 0) {
          setSelectedCrypto(data.currencies[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch crypto currencies:', err);
    }
  };

  const fetchUserBalance = async () => {
    try {
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/app/wallet/balance', {
        headers,
      });
      
      if (!response.ok) {
        console.error('Failed to fetch user balance:', response.status);
        return;
      }
      
      const data = await response.json();
      if (data.success) {
        setUserBalance({
          usdt: data.balance?.usdt || 0,
          frozen: data.balance?.frozen || 0,
          total: data.balance?.total || 0,
        });
      }
    } catch (err) {
      console.error('Failed to fetch user balance:', err);
    }
  };

  // 计算费用和到账金额
  const calculateFees = () => {
    if (!selectedCrypto || !withdrawAmount) {
      return { fee: 0, arrivalAmount: 0 };
    }

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      return { fee: 0, arrivalAmount: 0 };
    }

    let fee = 0;
    if (selectedCrypto.feeType === 'fixed') {
      fee = selectedCrypto.fee;
    } else {
      fee = amount * (selectedCrypto.fee / 100);
    }

    const arrivalAmount = Math.max(0, amount - fee);

    return { fee, arrivalAmount };
  };

  // 获取出金记录
  const fetchWithdrawRecords = async () => {
    if (!user?.id) {
      setError('用戶未登錄');
      return;
    }

    setIsLoadingRecords(true);
    try {
      const response = await fetch(`/api/app/withdraw/records?userId=${user.id}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '獲取出金記錄失敗');
      }
      const data = await response.json();
      setWithdrawRecords(data.records || []);
    } catch (err) {
      console.error('Failed to fetch withdrawal records:', err);
      setError(err instanceof Error ? err.message : '獲取出金記錄失敗');
    } finally {
      setIsLoadingRecords(false);
    }
  };

  // 当切换到记录Tab时加载数据
  useEffect(() => {
    if (activeTab === 'records') {
      fetchWithdrawRecords();
    }
  }, [activeTab]);

  const { fee, arrivalAmount } = calculateFees();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 检查是否为模拟账户
    if (user?.accountType === 'demo') {
      toast.error('模拟账户不支持此操作，請註冊正式用戶！');
      return;
    }

    if (!selectedCrypto) {
      setError('請選擇數位貨幣');
      return;
    }

    if (!withdrawAddress.trim()) {
      setError('請輸入提幣地址');
      return;
    }

    const amount = parseFloat(withdrawAmount);
    if (!withdrawAmount || isNaN(amount) || amount <= 0) {
      setError('請輸入有效的提幣數量');
      return;
    }

    if (amount < selectedCrypto.minAmount) {
      setError(`最低提幣數量為 ${selectedCrypto.minAmount}`);
      return;
    }

    if (amount > selectedCrypto.maxAmount) {
      setError(`最高提幣數量為 ${selectedCrypto.maxAmount}`);
      return;
    }

    if (amount > userBalance.usdt) {
      setError('餘額不足');
      return;
    }

    if (arrivalAmount <= 0) {
      setError('扣除手續費後預計到賬數量必須大於 0');
      return;
    }

    setIsSubmitting(true);

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/app/withdraw', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          type: 'crypto',
          currencyId: selectedCrypto.id,
          withdrawAddress,
          amount: withdrawAmount,
          fee,
          arrivalAmount,
          remark,
        }),
      });

      if (!response.ok) {
        setError('網絡錯誤，請稍後重試');
        return;
      }

      const data = await response.json();

      if (data.success) {
        toast.success('出金申請已提交，等待審核通過');
        router.back();
      } else {
        setError(data.error || '提交失敗');
      }
    } catch (err) {
      console.error('Withdraw error:', err);
      setError('網絡錯誤，請稍後重試');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageShell loading={!isHydrated}>
      <AuthGuard>
        <div className="min-h-screen bg-white">
          {/* 顶部导航 */}
          <div className="sticky top-0 bg-white z-10">
            <div className="px-4 py-4 flex items-center justify-between">
              <button
                onClick={() => router.back()}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h1 className="text-lg font-medium text-gray-900">出金</h1>
              <div
                className="text-sm text-gray-500 cursor-pointer hover:text-blue-600"
                onClick={() => setActiveTab(activeTab === 'apply' ? 'records' : 'apply')}
              >
                {activeTab === 'apply' ? '出金記錄' : '申請出金'}
              </div>
            </div>

            {/* 申请出金 / 出金记录切换标签 */}
            <div className="px-4 py-2">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('apply')}
                  className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
                    activeTab === 'apply'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  申請出金
                </button>
                <button
                  onClick={() => setActiveTab('records')}
                  className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
                    activeTab === 'records'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  出金記錄
                </button>
              </div>
            </div>
          </div>

          {/* 申请出金表单 */}
          {activeTab === 'apply' && (
            <div>
              {/* 出金方式切换标签栏 */}
              <div className="px-4 py-2">
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    className="flex-1 py-2 px-4 rounded-md text-sm font-medium bg-blue-600 text-white"
                  >
                    數位貨幣
                  </button>
                  <button
                    className="flex-1 py-2 px-4 rounded-md text-sm font-medium text-gray-500"
                  >
                    銀行卡
                  </button>
                </div>
              </div>

              {/* 表单内容 */}
              <form onSubmit={handleSubmit} className="px-4 py-6 space-y-6">
            {/* 数字货币选择 */}
            <div>
              <Label className="text-gray-700 mb-2 block">貨幣</Label>
              <div className="relative">
                <Select
                  value={selectedCrypto ? selectedCrypto.id.toString() : undefined}
                  onValueChange={(value) => {
                    const crypto = cryptoCurrencies.find((c) => c.id === parseInt(value));
                    setSelectedCrypto(crypto || null);
                  }}
                  disabled={cryptoCurrencies.length === 0}
                >
                  <SelectTrigger className="w-full h-12 bg-gray-50 border-0 rounded-lg">
                    <SelectValue placeholder={cryptoCurrencies.length === 0 ? '加載中...' : '請選擇數位貨幣'} />
                  </SelectTrigger>
                  <SelectContent>
                    {cryptoCurrencies.map((currency) => (
                      <SelectItem key={currency.id} value={currency.id.toString()}>
                        {currency.code}-{currency.protocol}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* 提币地址 */}
            <div>
              <Label className="text-gray-700 mb-2 block">提幣地址</Label>
              <div className="relative">
                <Input
                  type="text"
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  placeholder="請輸入提幣地址"
                  className="w-full h-12 bg-gray-50 border-0 rounded-lg pr-10"
                  required
                />
                <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* 提币数量 */}
            <div>
              <Label className="text-gray-700 mb-2 block">提幣數量</Label>
              <Input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="提幣數量"
                className="h-12 bg-gray-50 border-0 rounded-lg"
                required
              />
              {selectedCrypto && (
                <div className="mt-2 text-xs text-gray-500">
                  最低: {selectedCrypto.minAmount} | 最高: {selectedCrypto.maxAmount}
                </div>
              )}
            </div>

            {/* 备注 */}
            <div>
              <Label className="text-gray-700 mb-2 block">備註</Label>
              <Input
                type="text"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="備註"
                className="h-12 bg-gray-50 border-0 rounded-lg"
              />
            </div>

            {/* 费用与金额预览 */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">手續費</span>
                <span className="text-sm font-medium text-gray-900">{fee.toFixed(8)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">預計到賬數量</span>
                <span className="text-sm font-medium text-gray-900">{arrivalAmount.toFixed(8)} USD</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">餘額</span>
                <span className="text-sm font-medium text-gray-900">{userBalance.usdt.toFixed(2)} USD</span>
              </div>
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* 提交按钮 */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white text-base font-medium rounded-lg"
            >
              {isSubmitting ? '提交中...' : '提幣'}
            </Button>
          </form>
        </div>)}

          {/* 出金记录 */}
          {activeTab === 'records' && (
            <div className="px-4 py-2">
              {isLoadingRecords ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-3 text-sm text-gray-500">加載中...</p>
                </div>
              ) : withdrawRecords.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-block w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <span className="text-3xl">📋</span>
                  </div>
                  <p className="text-gray-500">暫無出金記錄</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {withdrawRecords.map((record) => (
                    <div
                      key={record.id}
                      className="bg-gray-50 rounded-xl p-4 border border-gray-100"
                    >
                      {/* 记录头部 */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {record.currency}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {record.currency}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            record.status === 'approved'
                              ? 'bg-green-100 text-green-700'
                              : record.status === 'rejected'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {record.status === 'approved'
                            ? '已通過'
                            : record.status === 'rejected'
                            ? '已拒絕'
                            : '審核中'}
                        </span>
                      </div>

                      {/* 记录详情 */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">提幣數量</span>
                          <span className="text-gray-900 font-medium">
                            {record.amount}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">手續費</span>
                          <span className="text-gray-900">
                            {record.fee}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">預計到賬</span>
                          <span className="text-green-600 font-medium">
                            {record.arrivalAmount}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">提幣地址</span>
                          <span className="text-gray-900 text-xs font-mono max-w-[200px] truncate">
                            {record.address}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">時間</span>
                          <span className="text-gray-900">
                            {new Date(record.createdAt).toLocaleString('zh-TW', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        {record.status === 'rejected' && record.rejectReason && (
                          <div className="mt-2 p-2 bg-red-50 rounded-lg">
                            <p className="text-xs text-red-600">
                              拒絕原因: {record.rejectReason}
                            </p>
                          </div>
                        )}
                        {record.status === 'approved' && (
                          <div className="mt-2 p-2 bg-green-50 rounded-lg">
                            <p className="text-xs text-green-600">
                              提幣成功，已到賬: {record.arrivalAmount} {record.currency}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </AuthGuard>
    </PageShell>
  );
}
