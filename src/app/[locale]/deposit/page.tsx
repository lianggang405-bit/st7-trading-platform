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
  Copy,
  Camera,
  FileText,
  DollarSign,
} from 'lucide-react';
import QRCode from 'qrcode';

interface CryptoCurrency {
  id: number;
  code: string;
  name: string;
  nameEn: string;
  symbol: string;
  protocol: string;
  walletAddress: string;
  qrCode: string;
  minAmount: number;
  maxAmount: number;
  fee: number;
  feeType: 'fixed' | 'percentage';
}

interface DepositRecord {
  id: number;
  userId: string;
  cryptoCode: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  rejectReason?: string;
  createdAt: string;
  updatedAt: string;
}

export default function DepositPage() {
  const router = useRouter();
  const { isHydrated, user } = useAuthStore();

  const [cryptoCurrencies, setCryptoCurrencies] = useState<CryptoCurrency[]>([]);
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoCurrency | null>(null);
  const [cryptoAmount, setCryptoAmount] = useState('');
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'apply' | 'records'>('apply');
  const [depositRecords, setDepositRecords] = useState<DepositRecord[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);

  useEffect(() => {
    fetchCryptoCurrencies();
  }, []);

  const fetchCryptoCurrencies = async () => {
    try {
      const response = await fetch('/api/app/deposit/crypto-currencies');
      
      if (!response.ok) {
        console.error('Failed to fetch crypto currencies:', response.status, response.statusText);
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

  const fetchDepositRecords = async () => {
    if (!user?.id) {
      setError('用戶未登錄');
      return;
    }

    setIsLoadingRecords(true);
    try {
      const response = await fetch(`/api/deposit/records?userId=${user.id}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '獲取入金記錄失敗');
      }
      const data = await response.json();
      setDepositRecords(data.records || []);
    } catch (err) {
      console.error('Failed to fetch deposit records:', err);
      setError(err instanceof Error ? err.message : '獲取入金記錄失敗');
    } finally {
      setIsLoadingRecords(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'records') {
      fetchDepositRecords();
    }
  }, [activeTab]);

  const generateQRCode = async (address: string) => {
    if (!address) return;
    try {
      const url = await QRCode.toDataURL(address, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      setQrCodeUrl(url);
    } catch (err) {
      console.error('Failed to generate QR code:', err);
    }
  };

  useEffect(() => {
    if (selectedCrypto && selectedCrypto.walletAddress) {
      generateQRCode(selectedCrypto.walletAddress);
    }
  }, [selectedCrypto]);

  const handleCopyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      toast.success('已複製錢包地址');
    } catch (error) {
      toast.error('複製失敗');
    }
  };

  const handlePaymentProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('請上傳圖片文件');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error('文件大小不能超過 50MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const preview = reader.result as string;
      setPaymentProof(file);
      setPaymentProofPreview(preview);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    setError('');

    console.log('=== Submit function called! ===');
    console.log('user:', user);
    console.log('selectedCrypto:', selectedCrypto);
    console.log('cryptoAmount:', cryptoAmount);
    console.log('paymentProof:', paymentProof);

    // 检查用户类型，字段可能是 userType 或 accountType
    const isDemo = user?.userType === 'demo' || user?.accountType === 'demo';
    console.log('isDemo:', isDemo, 'userType:', user?.userType, 'accountType:', user?.accountType);
    
    if (isDemo) {
      console.log('Demo account check failed');
      toast.error('目前是模拟账户，不支持入金操作，请用正式账号提交！');
      return;
    }

    if (!selectedCrypto) {
      console.log('No selected crypto');
      setError('請選擇數位貨幣');
      return;
    }

    const amount = parseFloat(cryptoAmount);
    console.log('Parsed amount:', amount);
    
    if (!cryptoAmount || isNaN(amount) || amount <= 0) {
      console.log('Invalid amount check failed');
      setError('請輸入有效的充幣數量');
      return;
    }

    console.log('minAmount:', selectedCrypto.minAmount, 'maxAmount:', selectedCrypto.maxAmount);
    
    if (amount < selectedCrypto.minAmount) {
      console.log('Min amount check failed');
      setError(`最低充幣數量為 ${selectedCrypto.minAmount}`);
      return;
    }

    if (amount > selectedCrypto.maxAmount) {
      console.log('Max amount check failed');
      setError(`最高充幣數量為 ${selectedCrypto.maxAmount}`);
      return;
    }

    if (!paymentProof) {
      console.log('No payment proof');
      setError('請上傳支付憑證');
      return;
    }

    console.log('All validation passed, setting isSubmitting to true');
    setIsSubmitting(true);

    try {
      console.log('Submitting to /api/admin/wallet/deposit-requests...');

      // 将支付凭证转换为 Base64
      const reader = new FileReader();
      const proofImageBase64 = await new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64 = reader.result as string;
          // 移除 data URL 前缀，只保留 Base64 部分
          const base64Data = base64.split(',')[1];
          resolve(base64Data);
        };
        reader.readAsDataURL(paymentProof);
      });

      const payload = {
        userId: parseInt(user?.id || '1'),
        type: 'crypto',
        currency: selectedCrypto.code,
        amount: parseFloat(cryptoAmount),
        txHash: selectedCrypto.walletAddress,
        status: 'pending',
        proofImage: proofImageBase64, // 添加支付凭证
      };
      console.log('Payload:', payload);
      
      const response = await fetch('/api/admin/wallet/deposit-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        setError('網絡錯誤，請稍後重試');
        return;
      }

      const data = await response.json();
      console.log('Response data:', data);

      if (data.success) {
        // 弹出窗口提醒
        alert('申请成功！系统会在审核后尽快为您入金，如有需要请联系客服');
        router.back();
      } else {
        setError(data.error || '提交失敗');
      }
    } catch (err) {
      console.error('Deposit error:', err);
      setError('網絡錯誤，請稍後重試');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageShell loading={!isHydrated}>
      <AuthGuard>
        <div className="min-h-screen bg-white">
          <div className="sticky top-0 bg-white z-10">
            <div className="px-4 py-4 flex items-center justify-between">
              <button
                onClick={() => router.back()}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h1 className="text-lg font-medium text-gray-900">入金</h1>
              <div
                className="text-sm text-gray-500 cursor-pointer hover:text-blue-600"
                onClick={() => setActiveTab(activeTab === 'apply' ? 'records' : 'apply')}
              >
                {activeTab === 'apply' ? '入金記錄' : '申請入金'}
              </div>
            </div>

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
                  申請入金
                </button>
                <button
                  onClick={() => setActiveTab('records')}
                  className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
                    activeTab === 'records'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  入金記錄
                </button>
              </div>
            </div>
          </div>

          {activeTab === 'apply' && (
            <div className="px-4 py-2">
              <div className="px-4 py-2">
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    className="flex-1 py-2 px-4 rounded-md text-sm font-medium bg-blue-600 text-white"
                  >
                    數位貨幣
                  </button>
                </div>
              </div>

              <div className="px-4 py-6 space-y-6">
                <div>
                  <Label className="text-gray-700 mb-2 block">數位貨幣</Label>
                  <div className="relative">
                    <Select
                      value={selectedCrypto?.id.toString()}
                      onValueChange={(value) => {
                        const crypto = cryptoCurrencies.find((c) => c.id === parseInt(value));
                        setSelectedCrypto(crypto || null);
                      }}
                    >
                      <SelectTrigger className="w-full h-12 bg-gray-50 border-0 rounded-lg">
                        <SelectValue placeholder="請選擇數位貨幣" />
                      </SelectTrigger>
                      <SelectContent>
                        {cryptoCurrencies.map((currency) => (
                          <SelectItem key={currency.id} value={currency.id.toString()}>
                            {currency.code}-{currency.protocol}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {selectedCrypto && (
                  <div>
                    <Label className="text-gray-700 mb-2 block">錢包地址</Label>
                    <div className="flex flex-col gap-3">
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <p className="text-sm text-gray-900 break-all font-mono">
                          {selectedCrypto.walletAddress}
                        </p>
                      </div>

                      <div className="relative bg-white border-2 border-blue-500 rounded-lg p-8 flex items-center justify-center">
                        {qrCodeUrl ? (
                          <img
                            src={qrCodeUrl}
                            alt={`${selectedCrypto.code} 二维码`}
                            className="w-40 h-40"
                          />
                        ) : (
                          <div className="w-40 h-40 bg-gray-100 animate-pulse rounded" />
                        )}
                        <div className="absolute top-2 left-2 w-8 h-8 border-l-4 border-t-4 border-blue-500" />
                        <div className="absolute top-2 right-2 w-8 h-8 border-r-4 border-t-4 border-blue-500" />
                        <div className="absolute bottom-2 left-2 w-8 h-8 border-l-4 border-b-4 border-blue-500" />
                        <div className="absolute bottom-2 right-2 w-8 h-8 border-r-4 border-b-4 border-blue-500" />
                      </div>

                      <Button
                        type="button"
                        onClick={() => handleCopyAddress(selectedCrypto.walletAddress)}
                        className="w-full h-10 bg-white border border-blue-500 text-blue-600 hover:bg-blue-50"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        複製
                      </Button>
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-gray-700 mb-2 block">充幣數量</Label>
                  <Input
                    type="number"
                    value={cryptoAmount}
                    onChange={(e) => setCryptoAmount(e.target.value)}
                    placeholder="請輸入充幣數量"
                    className="h-12 bg-gray-50 border-0 rounded-lg"
                    required
                  />
                  {selectedCrypto && (
                    <div className="mt-2 text-xs text-gray-500">
                      最低: {selectedCrypto.minAmount} | 最高: {selectedCrypto.maxAmount}
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-gray-700 mb-2 block">支付憑證</Label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePaymentProofChange}
                      className="hidden"
                      id="payment-proof"
                    />
                    <label
                      htmlFor="payment-proof"
                      className="block w-full h-32 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors flex items-center justify-center"
                    >
                      {paymentProofPreview ? (
                        <img
                          src={paymentProofPreview}
                          alt="支付凭证"
                          className="w-full h-full object-contain rounded-lg"
                        />
                      ) : (
                        <div className="flex flex-col items-center">
                          <Camera className="w-10 h-10 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-500">點擊上傳支付憑證</span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <Button
                  type="button"
                  disabled={isSubmitting}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white text-base font-medium rounded-lg"
                  onClick={() => {
                    console.log('Button clicked!');
                    handleSubmit();
                  }}
                >
                  {isSubmitting ? '提交中...' : '提交'}
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'records' && (
            <div className="px-4 py-2">
              {isLoadingRecords ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-3 text-sm text-gray-500">加載中...</p>
                </div>
              ) : depositRecords.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-block w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">暫無入金記錄</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {depositRecords.map((record) => (
                    <div
                      key={record.id}
                      className="bg-gray-50 rounded-xl p-4 border border-gray-100"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <DollarSign className="w-4 h-4 text-blue-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {record.cryptoCode}
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
                            : '申請中'}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">數量</span>
                          <span className="text-gray-900 font-medium">
                            {record.amount}
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
                              已到賬: {record.amount} {record.cryptoCode}
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
