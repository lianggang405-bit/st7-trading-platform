'use client';

import { useRouter, usePathname } from 'next/navigation';
import { ChevronLeft, Clock, AlertCircle } from 'lucide-react';
import { AuthGuard } from '@/components/auth-guard';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';

export default function SecondsConfigPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1];
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
                <h1 className="text-2xl font-bold">秒合约设置</h1>
              </div>

              {/* 占位页面内容 */}
              <Card className="bg-white">
                <CardContent className="p-8">
                  <div className="flex flex-col items-center justify-center text-center space-y-6">
                    {/* 图标 */}
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                      <Clock className="w-10 h-10 text-gray-400" />
                    </div>

                    {/* 标题和说明 */}
                    <div className="space-y-2">
                      <h2 className="text-xl font-semibold text-gray-900">
                        功能开发中
                      </h2>
                      <p className="text-gray-500 max-w-md">
                        秒合约设置功能正在开发中，敬请期待！
                        <br />
                        此功能将在后续版本中推出。
                      </p>
                    </div>

                    {/* 提示信息 */}
                    <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md">
                      <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="text-left">
                        <p className="text-sm text-yellow-800 font-medium">
                          提示
                        </p>
                        <p className="text-sm text-yellow-700">
                          如需了解更多信息，请联系客服或查看帮助文档。
                        </p>
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex gap-4">
                      <Button
                        onClick={() => router.push(`/${locale}/market`)}
                        variant="outline"
                      >
                        返回市场
                      </Button>
                      <Button
                        onClick={() => router.push(`/${locale}/trade`)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        去交易
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </AuthGuard>
      )}
    </PageShell>
  );
}
