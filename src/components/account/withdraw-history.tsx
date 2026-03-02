'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface WithdrawalRecord {
  id: number;
  user_id: string;
  currency_id: number;
  amount: number;
  fee: number;
  arrival_amount: number;
  withdrawal_address: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  remark: string | null;
  created_at: string;
  updated_at: string;
}

interface DigitalCurrency {
  id: number;
  name: string;
  protocol: string;
  symbol: string;
}

export function WithdrawHistory() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuthStore();

  const [records, setRecords] = useState<WithdrawalRecord[]>([]);
  const [currencies, setCurrencies] = useState<Map<number, DigitalCurrency>>(new Map());
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchWithdrawHistory();
    fetchCurrencies();
  }, [currentPage]);

  const fetchWithdrawHistory = async () => {
    setLoading(true);
    try {
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(
        `/api/app/withdraw/history?page=${currentPage}&pageSize=${pageSize}`,
        { headers }
      );

      const data = await response.json();
      if (data.success) {
        setRecords(data.data || []);
        setTotalCount(data.total || 0);
      } else {
        toast.error(data.error || '获取出金记录失败');
      }
    } catch (error) {
      console.error('Failed to fetch withdrawal history:', error);
      toast.error('获取出金记录失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrencies = async () => {
    try {
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/app/withdraw/crypto-currencies', { headers });
      const data = await response.json();
      if (data.success) {
        const currencyMap = new Map<number, DigitalCurrency>();
        data.currencies.forEach((currency: DigitalCurrency) => {
          currencyMap.set(currency.id, currency);
        });
        setCurrencies(currencyMap);
      }
    } catch (error) {
      console.error('Failed to fetch currencies:', error);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          text: '待审核',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          icon: Clock,
        };
      case 'approved':
        return {
          text: '已批准',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          icon: CheckCircle2,
        };
      case 'completed':
        return {
          text: '已完成',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          icon: CheckCircle2,
        };
      case 'rejected':
        return {
          text: '已拒绝',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          icon: XCircle,
        };
      case 'cancelled':
        return {
          text: '已取消',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          icon: XCircle,
        };
      default:
        return {
          text: '未知',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          icon: AlertCircle,
        };
    }
  };

  const handleClose = () => {
    const locale = searchParams.get('locale') || 'zh-TW';
    router.push(`/${locale}/me`);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 顶部导航 */}
      <div className="sticky top-0 bg-white z-10 border-b">
        <div className="px-4 py-4 flex items-center justify-between">
          <button
            onClick={handleClose}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="w-6 h-6" />
            <span className="ml-1">返回</span>
          </button>
          <h1 className="text-lg font-medium text-gray-900">出金记录</h1>
          <div className="w-16"></div>
        </div>
      </div>

      {/* 记录列表 */}
      <div className="px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500">暂无出金记录</p>
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((record) => {
              const currency = currencies.get(record.currency_id);
              const statusInfo = getStatusInfo(record.status);
              const StatusIcon = statusInfo.icon;

              return (
                <Card key={record.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">
                          {currency?.name || '未知币种'}
                        </span>
                        {currency?.protocol && (
                          <span className="text-xs text-gray-500">
                            ({currency.protocol})
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(record.created_at).toLocaleString('zh-CN')}
                      </div>
                    </div>
                    <div
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.color} ${statusInfo.bgColor}`}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {statusInfo.text}
                    </div>
                  </div>

                  <div className="space-y-2 pt-3 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">提币数量</span>
                      <span className="font-medium text-gray-900">
                        {record.amount.toFixed(8)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">手续费</span>
                      <span className="font-medium text-gray-900">
                        {record.fee.toFixed(8)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">到账数量</span>
                      <span className="font-medium text-green-600">
                        {record.arrival_amount.toFixed(8)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">提币地址</span>
                      <span className="font-mono text-xs text-gray-900 max-w-[200px] truncate">
                        {record.withdrawal_address}
                      </span>
                    </div>
                    {record.remark && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">备注</span>
                        <span className="text-gray-900">{record.remark}</span>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              上一页
            </Button>
            <span className="text-sm text-gray-600">
              第 {currentPage} / {totalPages} 页
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              下一页
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
