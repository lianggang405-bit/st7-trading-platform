'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { AuthGuard } from '../../../components/auth-guard';
import { PageShell } from '../../../components/layout/page-shell';
import { useAuthStore } from '../../../stores/authStore';
import { useStakingStore, PERIOD_OPTIONS, type StakingPeriod } from '../../../stores/stakingStore';
import { useAssetStore } from '../../../stores/assetStore';
import { Price } from '../../../components/data';

// 质押操作类型
type Action = 'deposit' | 'withdraw';

export default function WealthPage() {
  const t = useTranslations('wealth');
  const { isHydrated } = useAuthStore();
  const { balance } = useAssetStore();
  const { assets, records, totalValue, totalReward, initAssets, stake, unstake, updateRewards, updatePrices, checkExpiredStakes, getExpiringStakes } = useStakingStore();

  // UI 状态
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [action, setAction] = useState<Action>('deposit');
  const [amount, setAmount] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<StakingPeriod>(30);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'staking' | 'records'>('staking');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'crypto' | 'metal' | 'forex'>('all');
  const [showExpiringAlert, setShowExpiringAlert] = useState(false);

  // 资产分类定义
  const categoryMap = {
    crypto: { label: t('categoryCrypto'), icon: '₿' },
    metal: { label: t('categoryMetal'), icon: '🥇' },
    forex: { label: t('categoryForex'), icon: '💱' },
  };

  // 根据分类筛选资产
  const filteredAssets = selectedCategory === 'all'
    ? assets
    : assets.filter((asset: any) => asset.category === selectedCategory);

  // 初始化数据
  useEffect(() => {
    if (assets.length === 0) {
      initAssets();
    }
  }, [assets.length, initAssets]);

  // 模擬收益增長、價格更新和檢查到期質押
  useEffect(() => {
    const rewardInterval = setInterval(() => {
      updateRewards();
    }, 5000);

    const priceInterval = setInterval(() => {
      updatePrices();
    }, 10000); // 每10秒更新一次价格

    const checkExpiredInterval = setInterval(() => {
      checkExpiredStakes();
    }, 30000); // 每30秒檢查一次到期質押

    // 檢查即將到期的質押記錄（每60秒）
    const checkExpiringInterval = setInterval(() => {
      const expiringStakes = getExpiringStakes(24); // 24小时内到期
      setShowExpiringAlert(expiringStakes.length > 0);
    }, 60000);

    // 初始檢查
    const expiringStakes = getExpiringStakes(24);
    setShowExpiringAlert(expiringStakes.length > 0);

    return () => {
      clearInterval(rewardInterval);
      clearInterval(priceInterval);
      clearInterval(checkExpiredInterval);
      clearInterval(checkExpiringInterval);
    };
  }, [updateRewards, updatePrices, checkExpiredStakes, getExpiringStakes]);

  // 獲取选中的资产
  const selectedAssetData = assets.find((a: any) => a.id === selectedAsset);

  // 打开操作弹窗
  const handleOpenModal = (assetId: string, type: Action) => {
    setSelectedAsset(assetId);
    setAction(type);
    setAmount('');
    setSelectedPeriod(30); // 重置为默认30天
    setIsModalOpen(true);
  };

  // 确认操作
  const handleConfirm = () => {
    if (!selectedAsset || !amount) return;

    const numAmount = parseFloat(amount);
    const asset = assets.find((a: any) => a.id === selectedAsset);
    if (!asset) return;

    if (action === 'deposit') {
      // 质押
      if (numAmount < asset.minAmount) {
        alert(`${t('minStakeAmountError')} ${asset.minAmount} ${asset.symbol}`);
        return;
      }
      if (numAmount > asset.maxAmount) {
        alert(`${t('maxStakeAmountError')} ${asset.maxAmount} ${asset.symbol}`);
        return;
      }
      stake(selectedAsset, numAmount, selectedPeriod);
    } else {
      // 解质押
      if (numAmount > asset.stakingAmount) {
        alert(t('unstakeAmountError'));
        return;
      }
      unstake(selectedAsset, numAmount);
    }

    setIsModalOpen(false);
    setSelectedAsset(null);
    setAmount('');
  };

  // 格式化时间
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return t('time.justNow');
    if (diff < 3600000) return `${Math.floor(diff / 60000)}${t('time.minutesAgo')}`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}${t('time.hoursAgo')}`;
    return `${Math.floor(diff / 86400000)}${t('time.daysAgo')}`;
  };

  return (
    <PageShell loading={false}>
      <AuthGuard>
        <div className="min-h-screen bg-gray-50 pb-20">
          {/* 顶部总览卡片 */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 pt-6 pb-12">
            <h1 className="text-white text-xl font-bold mb-4">{t('staking')}</h1>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                <p className="text-white/80 text-sm mb-1">{t('totalStakingValue')}</p>
                <p className="text-white text-2xl font-bold">
                  <Price value={totalValue} precision={2} /> USDT
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                <p className="text-white/80 text-sm mb-1">{t('accumulatedRewards')}</p>
                <p className="text-green-300 text-2xl font-bold">
                  +<Price value={totalReward} precision={4} /> USDT
                </p>
              </div>
            </div>
          </div>

          {/* Tab 切换 */}
          <div className="bg-white px-4 py-2 -mt-6 mx-4 rounded-2xl shadow-sm mb-4">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('staking')}
                className={`flex-1 py-3 text-center font-semibold transition-colors ${
                  activeTab === 'staking'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 border-b-2 border-transparent'
                }`}
              >
                {t('stakingTab')}
              </button>
              <button
                onClick={() => setActiveTab('records')}
                className={`flex-1 py-3 text-center font-semibold transition-colors ${
                  activeTab === 'records'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 border-b-2 border-transparent'
                }`}
              >
                {t('recordsTab')}
              </button>
            </div>
          </div>

          <div className="px-4">
            {/* 到期提醒横幅 */}
            {showExpiringAlert && (
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-4 animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">⏰</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-orange-800 mb-1">{t('expiringSoon')}</h3>
                    <p className="text-sm text-orange-700">
                      {t('expiringMessage')}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowExpiringAlert(false);
                      setActiveTab('records');
                    }}
                    className="text-sm font-semibold text-orange-600 hover:text-orange-800"
                  >
                    {t('viewDetails')}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'staking' ? (
              <>
                {/* 资产分类筛选 */}
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                      selectedCategory === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {t('categoryAll')}
                  </button>
                  <button
                    onClick={() => setSelectedCategory('crypto')}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                      selectedCategory === 'crypto'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="mr-1">{categoryMap.crypto.icon}</span>
                    {categoryMap.crypto.label}
                  </button>
                  <button
                    onClick={() => setSelectedCategory('metal')}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                      selectedCategory === 'metal'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="mr-1">{categoryMap.metal.icon}</span>
                    {categoryMap.metal.label}
                  </button>
                  <button
                    onClick={() => setSelectedCategory('forex')}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                      selectedCategory === 'forex'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="mr-1">{categoryMap.forex.icon}</span>
                    {categoryMap.forex.label}
                  </button>
                </div>

                {/* 资产列表 */}
                <div className="space-y-4">
                  {filteredAssets.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                      <div className="text-gray-400 mb-2">{t('noAssets')}</div>
                    </div>
                  ) : (
                    filteredAssets.map((asset: any) => (
                      <div key={asset.id} className="bg-white rounded-2xl p-4 shadow-sm">
                        {/* 资产信息 */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-2xl">
                              {asset.icon}
                            </div>
                            <div>
                              <div className="font-bold text-gray-900">{asset.symbol}</div>
                              <div className="text-sm text-gray-500">{asset.name}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-600">{asset.baseApr}%</div>
                            <div className="text-xs text-gray-500">{t('baseApr')}</div>
                          </div>
                        </div>

                        {/* 质押信息 */}
                        <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                          <div>
                            <p className="text-xs text-gray-400 mb-1">{t('staked')}</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {asset.stakingAmount.toFixed(4)} {asset.symbol}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 mb-1">{t('minValue')}</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {asset.minAmount} {asset.symbol}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 mb-1">{t('totalStaking')}</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {asset.totalStaking.toFixed(0)} {asset.symbol}
                            </p>
                          </div>
                        </div>

                        {/* 操作按钮 */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenModal(asset.id, 'deposit')}
                            className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                          >
                            {t('stakeBtn')}
                          </button>
                          {asset.stakingAmount > 0 && (
                            <button
                              onClick={() => handleOpenModal(asset.id, 'withdraw')}
                              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                            >
                              {t('unstakeBtn')}
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              /* 记录列表 */
              <div className="space-y-3">
                {records.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                    <div className="text-gray-400 mb-2">{t('noRecords')}</div>
                    <div className="text-sm text-gray-400">{t('startStaking')}</div>
                  </div>
                ) : (
                  records.map((record: any) => (
                    <div key={record.id} className="bg-white rounded-2xl p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            record.type === 'deposit' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                          }`}>
                            {record.type === 'deposit' ? '↓' : '↑'}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">
                              {record.type === 'deposit' ? t('stakingType') : t('unstakingType')}
                            </div>
                            <div className="text-xs text-gray-500">{record.symbol}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-bold ${record.type === 'deposit' ? 'text-blue-600' : 'text-green-600'}`}>
                            {record.type === 'deposit' ? '-' : '+'}{record.amount.toFixed(4)} {record.symbol}
                          </div>
                          <div className="text-xs text-gray-500">{formatTime(record.timestamp)}</div>
                        </div>
                      </div>
                      {/* 质押详情 */}
                      {record.period && record.apr && (
                        <div className="flex items-center gap-3 pt-2">
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <span>{t('period')}:</span>
                            <span className="font-semibold text-gray-700">{record.period}天</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <span>收益率:</span>
                            <span className="font-semibold text-green-600">{record.apr.toFixed(2)}%</span>
                          </div>
                          {record.unlockTime && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <span>{t('unlock')}:</span>
                              <span className="font-semibold text-gray-700">
                                {new Date(record.unlockTime).toLocaleDateString('zh-TW')}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                      {record.reward && record.reward > 0 && (
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <span className="text-sm text-gray-500">{t('reward')}</span>
                          <span className="text-sm font-bold text-green-600">
                            +{record.reward.toFixed(4)} USDT
                          </span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 温馨提示 */}
            <div className="mt-6 bg-yellow-50 rounded-2xl p-4">
              <h3 className="text-sm font-bold text-yellow-800 mb-2">{t('stakingTips')}</h3>
              <div className="space-y-1 text-xs text-yellow-700">
                <p>{t('tip1')}</p>
                <p>{t('tip2')}</p>
                <p>{t('tip3')}</p>
                <p>{t('tip4')}</p>
                <p>{t('tip5')}</p>
              </div>
            </div>
          </div>

          {/* 操作弹窗 */}
          {isModalOpen && selectedAssetData && (
            <>
              {/* 遮罩层 */}
              <div
                className="fixed inset-0 bg-black/50 z-10"
                onClick={() => setIsModalOpen(false)}
              />
              {/* 弹窗内容 */}
              <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-20 p-6 animate-slide-up">
                <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  {action === 'deposit' ? t('modalTitle') : t('modalUnstakeTitle')} {selectedAssetData.symbol}
                </h2>

                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('amountLabel')} ({selectedAssetData.symbol})
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={t('amountPlaceholder')}
                    className="w-full px-4 py-3 bg-gray-100 rounded-xl text-lg font-semibold"
                    step="0.0001"
                    min={selectedAssetData.minAmount}
                    max={action === 'deposit' ? selectedAssetData.maxAmount : selectedAssetData.stakingAmount}
                  />
                  <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span>{t('minAmount')}: {selectedAssetData.minAmount}</span>
                    <span>{t('maxAmount')}: {action === 'deposit' ? selectedAssetData.maxAmount : selectedAssetData.stakingAmount}</span>
                  </div>
                </div>

                {/* 质押期限选择（仅质押时显示） */}
                {action === 'deposit' && (
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('stakingPeriod')}
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {PERIOD_OPTIONS.map((option) => {
                        const actualApr = selectedAssetData.getApr(option.value);
                        return (
                          <button
                            key={option.value}
                            onClick={() => setSelectedPeriod(option.value)}
                            className={`flex flex-col items-center p-3 rounded-xl transition-colors ${
                              selectedPeriod === option.value
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            <span className="text-xs font-bold mb-1">{option.label}</span>
                            <span className={`text-xs ${selectedPeriod === option.value ? 'text-blue-100' : 'text-gray-500'}`}>
                              +{((option.bonus - 1) * 100).toFixed(0)}%
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 收益信息 */}
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  {action === 'deposit' ? (
                    <>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-500">{t('baseAprLabel')}</span>
                        <span className="font-bold text-gray-600">{selectedAssetData.baseApr}%</span>
                      </div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-500">{t('actualAprLabel')}</span>
                        <span className="font-bold text-green-600">{selectedAssetData.getApr(selectedPeriod).toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">{t('estimatedDailyReward')}</span>
                        <span className="font-bold text-gray-900">
                          {parseFloat(amount) * (selectedAssetData.getApr(selectedPeriod) / 100) / 365} USDT
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{t('unstakeAmount')}</span>
                      <span className="font-bold text-gray-900">
                        {parseFloat(amount) || 0} {selectedAssetData.symbol}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200"
                  >
                    {t('cancelBtn')}
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={!amount || parseFloat(amount) <= 0}
                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                  >
                    {t('confirmBtn')}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </AuthGuard>
    </PageShell>
  );
}
