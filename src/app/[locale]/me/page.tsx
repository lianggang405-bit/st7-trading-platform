'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AccountInfo } from '../../../components/account/account-info';
import { DepositWithdrawButtons } from '../../../components/account/deposit-withdraw-buttons';
import { FunctionList } from '../../../components/account/function-list';
import { FloatingChatButton } from '../../../components/common/floating-chat-button';
import { BottomTab } from '../../../components/layout/bottom-tab';
import { WithdrawHistory } from '../../../components/account/withdraw-history';

function MeContent() {
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');

  // 如果 tab=withdraw-history，显示出金记录页面
  if (tab === 'withdraw-history') {
    return <WithdrawHistory />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 顶部賬戶信息栏 */}
      <AccountInfo />

      {/* 入金/出金按钮 */}
      <DepositWithdrawButtons />

      {/* 功能列表 */}
      <div className="px-4 mt-4">
        <FunctionList />
      </div>

      {/* 悬浮客服按钮 */}
      <FloatingChatButton />
    </div>
  );
}

function MeLoading() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20 flex items-center justify-center">
      <div className="animate-pulse text-gray-500">Loading...</div>
    </div>
  );
}

export default function MePage() {
  return (
    <Suspense fallback={<MeLoading />}>
      <MeContent />
    </Suspense>
  );
}
