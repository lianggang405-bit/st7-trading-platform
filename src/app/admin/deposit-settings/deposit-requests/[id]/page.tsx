'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import adminFetch from '@/lib/admin-fetch';

interface DepositRequest {
  id: number;
  account: string;
  currency: string;
  paymentAddress: string;
  amount: number;
  usdAmount: number;
  proofImage: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function DepositRequestDetailPage() {
  const router = useRouter();
  const [request, setRequest] = useState<DepositRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    usdAmount: '',
  });

  useEffect(() => {
    fetchRequest();
  }, []);

  const fetchRequest = async () => {
    setLoading(true);
    try {
      const pathParts = window.location.pathname.split('/');
      const id = pathParts[pathParts.length - 1];
      
      const response = await adminFetch(`/api/admin/wallet/deposit-requests/${id}`);
      const data = await response.json();
      
      if (data.success && data.request) {
        setRequest(data.request);
        setFormData({
          amount: data.request.amount.toString(),
          usdAmount: data.request.usdAmount.toString(),
        });
      }
    } catch (error) {
      console.error('Failed to fetch deposit request:', error);
      toast.error('获取充币申请失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (continueEditing: boolean = false) => {
    if (!request) return;

    setIsSubmitting(true);
    try {
      const pathParts = window.location.pathname.split('/');
      const id = pathParts[pathParts.length - 1];

      const response = await adminFetch(`/api/admin/wallet/deposit-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(formData.amount),
          usdAmount: parseFloat(formData.usdAmount),
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success(continueEditing ? '更新成功' : '充币申请已更新');
        if (!continueEditing) {
          router.back();
        } else {
          // 刷新数据
          fetchRequest();
        }
      } else {
        toast.error(data.error || '更新失败');
      }
    } catch (error) {
      console.error('Failed to update deposit request:', error);
      toast.error('更新失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">加载中...</div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">未找到充币申请</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>桌面</span> / <span>充币设置</span> / <span>充币申请</span> / <span className="text-white">更新 充币申请: {request.id}</span>
      </div>
      
      <div>
        <h1 className="text-2xl font-bold text-white">更新 充币申请: {request.id}</h1>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="pt-6">
          <div className="space-y-6">
            {/* 账号 */}
            <div className="flex justify-between items-start py-3 border-b border-slate-700">
              <Label className="text-gray-400 text-sm min-w-[120px]">账号</Label>
              <div className="flex-1 text-white">{request.account}</div>
            </div>

            {/* 品种 */}
            <div className="flex justify-between items-start py-3 border-b border-slate-700">
              <Label className="text-gray-400 text-sm min-w-[120px]">品种</Label>
              <div className="flex-1 text-white">{request.currency}</div>
            </div>

            {/* 付款地址 */}
            <div className="flex justify-between items-start py-3 border-b border-slate-700">
              <Label className="text-gray-400 text-sm min-w-[120px]">付款地址</Label>
              <div className="flex-1 text-white font-mono text-sm break-all">{request.paymentAddress}</div>
            </div>

            {/* 付款数量 */}
            <div className="flex justify-between items-start py-3 border-b border-slate-700">
              <Label className="text-gray-400 text-sm min-w-[120px]">付款数量</Label>
              <div className="flex-1">
                <Input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  step="0.00000001"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>

            {/* USD数量 */}
            <div className="flex justify-between items-start py-3 border-b border-slate-700">
              <Label className="text-gray-400 text-sm min-w-[120px]">USD数量</Label>
              <div className="flex-1">
                <Input
                  type="number"
                  value={formData.usdAmount}
                  onChange={(e) => setFormData({ ...formData, usdAmount: e.target.value })}
                  step="0.00000001"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>

            {/* 付款凭证 */}
            <div className="flex justify-between items-start py-3 border-b border-slate-700">
              <Label className="text-gray-400 text-sm min-w-[120px]">付款凭证</Label>
              <div className="flex-1 space-y-3">
                {request.proofImage && (
                  <div className="rounded-lg overflow-hidden border border-slate-700">
                    <img
                      src={request.proofImage}
                      alt="付款凭证"
                      className="w-full max-w-md"
                    />
                  </div>
                )}
                <div className="text-xs text-gray-500 font-mono">{request.proofImage}</div>
              </div>
            </div>

            {/* 申请时间 */}
            <div className="flex justify-between items-start py-3">
              <Label className="text-gray-400 text-sm min-w-[120px]">申请时间</Label>
              <div className="flex-1 text-white text-sm">
                {new Date(request.createdAt).toLocaleString('zh-CN', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: false,
                }).replace(/\//g, '/')}
                <span className="ml-2 text-gray-500">Europe/London</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 操作按钮 */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="border-slate-600 text-slate-300 hover:bg-slate-700"
        >
          取消
        </Button>
        <Button
          variant="outline"
          onClick={() => handleSubmit(true)}
          disabled={isSubmitting}
          className="border-blue-600 text-blue-400 hover:bg-blue-600/10"
        >
          {isSubmitting ? '保存中...' : '更新 & 继续修改'}
        </Button>
        <Button
          onClick={() => handleSubmit(false)}
          disabled={isSubmitting}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isSubmitting ? '提交中...' : '更新 充币申请'}
        </Button>
      </div>
    </div>
  );
}
