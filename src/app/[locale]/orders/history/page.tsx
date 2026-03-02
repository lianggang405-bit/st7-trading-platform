'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { AuthGuard } from '@/components/auth-guard';
import { PageShell } from '@/components/layout/page-shell';
import { useAuthStore } from '@/stores/authStore';

export default function OrderHistoryPage() {
  const router = useRouter();
  const { isHydrated } = useAuthStore();

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
                <h1 className="text-2xl font-bold">歷史</h1>
              </div>
              
              <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
                <p className="text-gray-500 mb-4">暫無歷史記錄</p>
                <button
                  onClick={() => router.push('/market')}
                  className="px-6 py-3 bg-blue-500 text-white rounded-xl font-semibold"
                >
                  前往市場
                </button>
              </div>
            </div>
          </div>
        </AuthGuard>
      )}
    </PageShell>
  );
}
