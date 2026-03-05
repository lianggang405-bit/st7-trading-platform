/**
 * 账户信息栏组件
 * 显示账户信息、余额、账户ID和信用分
 */
'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '../../stores/authStore';
import { useAssetStore } from '../../stores/assetStore';
import * as authApi from '@/api/auth';

export function AccountInfo() {
  const t = useTranslations('profile');
  const { user } = useAuthStore();
  const { balance: assetBalance, syncFromBackend } = useAssetStore();
  const [showBalance, setShowBalance] = useState(true);
  const [creditScore, setCreditScore] = useState<number>(100);

  // 使用 assetStore 的余额，因为交易会实时更新 assetStore
  const balance = assetBalance;
  const accountId = user?.id || '1088765';

  // 根据账户类型显示不同的名称
  // 模拟账户显示"模擬帳戶"，正式账户显示邮箱地址
  const accountTypeName = user?.accountType === 'demo' ? t('demoAccount') : user?.email || t('assetAccount');

  // 获取信用分
  useEffect(() => {
    async function fetchCreditScore() {
      try {
        const response = await authApi.getCreditScore();
        if (response.success && response.creditScore !== undefined) {
          setCreditScore(response.creditScore);
        }
      } catch (error) {
        console.error('Failed to fetch credit score:', error);
      }
    }

    if (user) {
      fetchCreditScore();
    }
  }, [user]);

  // 从后端同步资产信息（确保显示最新余额）
  useEffect(() => {
    if (user) {
      syncFromBackend().catch(error => {
        console.error('Failed to sync assets:', error);
      });
    }
  }, [user, syncFromBackend]);

  // 信用分颜色
  const getCreditScoreColor = (score: number) => {
    if (score === 100) return 'text-green-300';
    if (score >= 90) return 'text-yellow-300';
    if (score >= 80) return 'text-orange-400';
    return 'text-red-500';
  };

  // 信用分等级
  const getCreditScoreLevel = (score: number) => {
    if (score === 100) return t('creditScore.excellent');
    if (score >= 90) return t('creditScore.good');
    if (score >= 80) return t('creditScore.medium');
    return t('creditScore.poor');
  };

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-6">
      {/* 账户名称和ID */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-white text-sm font-medium">{accountTypeName}</div>
          <div className="text-blue-100 text-xs mt-1">{accountId}</div>
        </div>
        {/* 眼睛图标 - 切换余额显示 */}
        <button
          onClick={() => setShowBalance(!showBalance)}
          className="text-white hover:text-blue-100 transition-colors active:scale-95"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {showBalance ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            ) : null}
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>
      </div>

      {/* 余额 */}
      <div className="mb-3">
        <div className="text-white text-3xl font-bold">
          {showBalance ? `$${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '••••••••'}
        </div>
        <div className="text-blue-100 text-xs mt-1">{t('balance')}</div>
      </div>

      {/* 信用分 */}
      <div className="bg-white/10 rounded-lg px-3 py-2 backdrop-blur-sm">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {/* 信用分图标 */}
              <svg className="w-4 h-4 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-blue-100 text-xs">{t('creditScore.title')}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-lg font-bold ${getCreditScoreColor(creditScore)}`}>
              {creditScore}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${getCreditScoreColor(creditScore)} bg-white/20`}>
              {getCreditScoreLevel(creditScore)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
