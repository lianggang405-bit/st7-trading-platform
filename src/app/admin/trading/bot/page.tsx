'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BotRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // 重定向到正确的页面
    router.replace('/admin/trading/bots');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-gray-400">正在跳转到调控机器人页面...</p>
      </div>
    </div>
  );
}
