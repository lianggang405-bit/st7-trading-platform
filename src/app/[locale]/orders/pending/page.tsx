'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ChevronLeft, X } from 'lucide-react';
import { AuthGuard } from '@/components/auth-guard';
import { PageShell } from '@/components/layout/page-shell';
import { useAuthStore } from '@/stores/authStore';
import { usePositionStore } from '@/stores/positionStore';
import { formatSymbol } from '@/lib/formatSymbol';
import * as tradingApi from '@/api/trading';

export default function PendingOrdersPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1];
  const { isHydrated } = useAuthStore();
  const { closePosition } = usePositionStore();
  const [orders, setOrders] = useState<tradingApi.Position[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取挂单列表
  const fetchPendingOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await tradingApi.getOrders({ status: 'pending' });
      if (result.success && result.orders) {
        setOrders(result.orders);
      } else {
        setError(result.error || '获取挂单失败');
      }
    } catch (err) {
      setError('获取挂单失败');
      console.error('Failed to fetch pending orders:', err);
    } finally {
      setLoading(false);
    }
  };

  // 取消挂单
  const handleCancelOrder = async (id: string) => {
    try {
      const result = await closePosition(id);
      if (result.success) {
        // 刷新列表
        await fetchPendingOrders();
      } else {
        alert(`取消挂单失败: ${result.error}`);
      }
    } catch (err) {
      alert('取消挂单失败');
      console.error('Failed to cancel order:', err);
    }
  };

  useEffect(() => {
    if (isHydrated) {
      fetchPendingOrders();
    }
  }, [isHydrated]);

  const getPricePrecision = (price: number) => {
    return price >= 1000 ? 2 : 4;
  };

  return (
    <PageShell loading={!isHydrated}>
      {isHydrated && (
        <AuthGuard>
          <div className="min-h-screen bg-gray-50 pb-20">
            <div className="max-w-7xl mx-auto px-4 py-6">
              {/* 返回按钮和标题 */}
              <div className="flex items-center gap-3 mb-6">
                <button
                  onClick={() => router.back()}
                  className="flex items-center text-gray-600 hover:text-gray-900"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <h1 className="text-2xl font-bold">掛單</h1>
              </div>

              {loading ? (
                <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
                  <p className="text-gray-500">加載中...</p>
                </div>
              ) : error ? (
                <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
                  <p className="text-red-500 mb-4">{error}</p>
                  <button
                    onClick={fetchPendingOrders}
                    className="px-6 py-3 bg-blue-500 text-white rounded-xl font-semibold"
                  >
                    重試
                  </button>
                </div>
              ) : orders.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
                  <p className="text-gray-500 mb-4">暫無掛單</p>
                  <button
                    onClick={() => router.push(`/${locale}/market`)}
                    className="px-6 py-3 bg-blue-500 text-white rounded-xl font-semibold"
                  >
                    前往市場
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((order) => (
                    <div key={order.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                      <div className="flex items-start justify-between gap-3">
                        {/* 左侧信息 */}
                        <div className="flex-1 min-w-0">
                          {/* 交易对和方向 */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                                  order.side === 'buy'
                                    ? 'bg-green-100 text-green-600'
                                    : 'bg-red-100 text-red-600'
                                }`}
                              >
                                {order.side === 'buy' ? '買入' : '賣出'}
                              </span>
                              <span className="text-base font-bold text-gray-900">{formatSymbol(order.symbol)}</span>
                            </div>
                            <button
                              onClick={() => handleCancelOrder(order.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="取消掛單"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          {/* 订单信息 */}
                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">委託價格</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {order.openPrice.toFixed(getPricePrecision(order.openPrice))}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">數量</p>
                              <p className="text-sm font-semibold text-gray-900">{order.volume}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">保證金</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {order.margin ? order.margin.toFixed(2) : '-'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">槓桿</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {order.leverage ? `${order.leverage}x` : '1x'}
                              </p>
                            </div>
                          </div>

                          {/* 时间 */}
                          <div className="text-xs text-gray-400">
                            {new Date(order.openTime).toLocaleString('zh-CN', {
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </AuthGuard>
      )}
    </PageShell>
  );
}
