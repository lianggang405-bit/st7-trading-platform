'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AuthGuard } from '../../../components/auth-guard';
import { PageShell } from '../../../components/layout/page-shell';
import { Price } from '../../../components/data';
import { ConfirmDialog } from '../../../components/ui/confirm-dialog';
import { useAuthStore } from '../../../stores/authStore';
import { useMarketStore } from '../../../stores/marketStore';
import { usePositionStore } from '../../../stores/positionStore';
import { useAssetStore } from '../../../stores/assetStore';
import { useRiskControlStore } from '../../../stores/riskControlStore';
import { formatSymbol } from '../../../lib/formatSymbol';

export default function PositionPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1];
  const { user, logout, isHydrated } = useAuthStore();
  const marketState = useMarketStore();
  const symbols = marketState?.symbols ?? [];
  const tick = marketState?.tick;
  const { positions, closePosition, updatePositions } = usePositionStore();
  const { updateFloatingProfit, onClosePosition, equity, usedMargin, balance, freeMargin } = useAssetStore();
  const { marginLevel, warning, danger, updateRisk, checkAndForceClose } = useRiskControlStore();

  // 确认对话框状态
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  // 调试日志
  console.log('[PositionPage] Current asset state:', {
    balance,
    freeMargin,
    usedMargin,
    equity,
    positionsCount: positions.length,
  });

  // 实时更新所有持仓的盈亏
  useEffect(() => {
    const uniqueSymbols = [...new Set(positions.map(pos => pos.symbol))];
    uniqueSymbols.forEach(symbol => {
      const symbolData = symbols.find(s => s.symbol === symbol);
      if (symbolData) {
        updatePositions(symbol, symbolData.price);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbols]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleClosePosition = (id: string) => {
    const position = positions.find(pos => pos.id === id);
    if (!position) {
      closePosition(id);
      return;
    }

    const symbolName = formatSymbol(position.symbol);
    const direction = position.side === 'buy' ? '买涨' : '买跌';
    const profit = position.profit;
    const profitColor = profit >= 0 ? 'text-green-500' : 'text-red-500';

    setConfirmDialog({
      open: true,
      title: '确认平仓',
      description: (
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-500">交易对：</span>
            <span className="font-semibold">{symbolName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">方向：</span>
            <span className={`font-semibold ${position.side === 'buy' ? 'text-green-500' : 'text-red-500'}`}>
              {direction}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">开仓价格：</span>
            <span className="font-semibold">{position.openPrice.toFixed(4)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">当前价格：</span>
            <span className="font-semibold">{position.currentPrice.toFixed(4)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">数量：</span>
            <span className="font-semibold">{position.volume}</span>
          </div>
          <div className="flex justify-between border-t pt-2 mt-2">
            <span className="text-gray-500">盈亏：</span>
            <span className={`font-bold ${profitColor}`}>
              {profit >= 0 ? '+' : ''}{profit.toFixed(2)}
            </span>
          </div>
        </div>
      ),
      onConfirm: async () => {
        const result = await closePosition(id);
        if (!result.success) {
          console.error('平仓失败:', result.error);
          alert(`平仓失败: ${result.error}`);
        }
      },
    });
  };

  const totalProfit = positions.reduce((sum, pos) => sum + pos.profit, 0);

  useEffect(() => {
    updateFloatingProfit(totalProfit);
  }, [totalProfit, updateFloatingProfit]);

  useEffect(() => {
    updateRisk({ equity, usedMargin });
    checkAndForceClose(positions, closePosition, onClosePosition);
  }, [equity, usedMargin, positions, updateRisk, checkAndForceClose, closePosition, onClosePosition]);

  const getPricePrecision = (price: number) => {
    return price >= 1000 ? 2 : 4;
  };

  return (
    <PageShell loading={!isHydrated}>
      {isHydrated && (
        <AuthGuard>
          <div className="min-h-screen bg-gray-50 pb-20">
            <div className="max-w-7xl mx-auto px-4 py-6">
              
              {/* 顶部标签导航 */}
              <div className="bg-white rounded-2xl p-1.5 flex gap-2 mb-6 shadow-sm">
                <button className="flex-1 py-3 px-4 bg-blue-500 text-white rounded-xl font-semibold text-base transition-colors">
                  持仓
                </button>
                <button 
                  onClick={() => router.push(`/${locale}/orders/pending`)}
                  className="flex-1 py-3 px-4 text-gray-600 font-medium text-base hover:bg-gray-50 rounded-xl transition-colors"
                >
                  掛單
                </button>
                <button 
                  onClick={() => router.push(`/${locale}/orders/history`)}
                  className="flex-1 py-3 px-4 text-gray-600 font-medium text-base hover:bg-gray-50 rounded-xl transition-colors"
                >
                  歷史
                </button>
              </div>

              {/* 账户数据卡片 */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 mb-6 shadow-sm border border-gray-200">
                {/* 盈亏展示 */}
                <div className="text-center mb-6">
                  <p className="text-gray-500 text-sm mb-1">盈虧</p>
                  <p className={`text-4xl font-bold ${totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {totalProfit >= 0 ? '+' : ''}{totalProfit.toFixed(2)}
                  </p>
                </div>

                {/* 保证金和风险率 */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">當前保證金</span>
                    <span className="text-gray-900 font-semibold">{usedMargin.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">可用保證金</span>
                    <span className="text-gray-900 font-semibold">{freeMargin.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">風險率</span>
                    <span className={`font-semibold ${
                      danger ? 'text-red-500' : warning ? 'text-yellow-500' : marginLevel >= 100 ? 'text-green-500' : 'text-gray-900'
                    }`}>
                      {usedMargin === 0 ? '0.0000%' : `${marginLevel.toFixed(4)}%`}
                    </span>
                  </div>
                </div>
              </div>

              {/* 风险提示 */}
              {danger && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-red-600 text-sm">
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">危險狀態：風險率過高</span>
                  </div>
                </div>
              )}

              {warning && !danger && (
                <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-yellow-600 text-sm">
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">預警狀態：風險率偏高</span>
                  </div>
                </div>
              )}

              {/* 持仓列表 */}
              {positions.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
                  <div className="flex justify-center mb-4">
                    <svg className="w-24 h-24 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <p className="text-gray-400 text-lg font-medium">暫無數據</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {positions.map((position) => (
                    <div key={position.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                      <div className="flex items-start justify-between gap-3">
                        {/* 左侧信息 */}
                        <div className="flex-1 min-w-0">
                          {/* 交易对和方向 */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                                  position.side === 'buy'
                                    ? 'bg-green-100 text-green-600'
                                    : 'bg-red-100 text-red-600'
                                }`}
                              >
                                {position.side === 'buy' ? '買入' : '賣出'}
                              </span>
                              <span className="text-base font-bold text-gray-900">{formatSymbol(position.symbol)}</span>
                            </div>
                            <span className="text-xs text-gray-400">
                              {new Date(position.openTime).toLocaleString('zh-CN', {
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>

                          {/* 信息网格 */}
                          <div className="grid grid-cols-3 gap-3 mb-3">
                            <div>
                              <p className="text-xs text-gray-400 mb-1">手數</p>
                              <p className="text-sm font-semibold text-gray-900">{position.volume}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400 mb-1">開倉價</p>
                              <p className="text-sm font-semibold text-gray-900">
                                <Price value={position.openPrice} precision={getPricePrecision(position.openPrice)} />
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400 mb-1">當前價</p>
                              <p className="text-sm font-semibold text-gray-900">
                                <Price value={position.currentPrice} precision={getPricePrecision(position.currentPrice)} />
                              </p>
                            </div>
                          </div>

                          {/* 盈亏 */}
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">盈虧</span>
                            <span className={`text-lg font-bold ${position.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {position.profit >= 0 ? '+' : ''}{position.profit.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* 平仓按钮 */}
                        <div className="flex-shrink-0">
                          <button
                            onClick={() => handleClosePosition(position.id)}
                            className="inline-flex items-center justify-center px-5 py-2.5 bg-red-500 text-white rounded-lg font-semibold text-sm hover:bg-red-600 transition-colors"
                          >
                            平倉
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 确认对话框 */}
          <ConfirmDialog
            open={confirmDialog.open}
            onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
            title={confirmDialog.title}
            description={confirmDialog.description}
            onConfirm={confirmDialog.onConfirm}
            confirmText="确认平仓"
            cancelText="取消"
          />
        </AuthGuard>
      )}
    </PageShell>
  );
}
