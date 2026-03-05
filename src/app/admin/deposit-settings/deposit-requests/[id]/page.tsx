'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface DepositRequest {
  id: number;
  account: string;
  email?: string;
  currency: string;
  paymentAddress: string;
  amount: number;
  usdAmount: number;
  proofImage: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

export default function DepositRequestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [request, setRequest] = useState<DepositRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    amount: '',
    usdAmount: '',
  });

  useEffect(() => {
    if (params.id) {
      fetchRequest();
    }
  }, [params.id]);

  const fetchRequest = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/wallet/deposit-requests/${params.id}`);
      const data = await response.json();
      
      if (data.success && data.request) {
        // 适配数据格式
        const formattedRequest = {
          ...data.request,
          account: data.request.account || data.request.email || '',
          email: data.request.email || data.request.account || '',
          paymentAddress: data.request.paymentAddress || data.request.txHash || '',
          usdAmount: data.request.usdAmount || data.request.amount,
        };
        setRequest(formattedRequest);
        setFormData({
          amount: formattedRequest.amount.toString(),
          usdAmount: formattedRequest.usdAmount.toString(),
        });
      }
    } catch (error) {
      console.error('Failed to fetch deposit request:', error);
      toast.error('获取充币申请失败');
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewImage = (imageSrc: string) => {
    setPreviewImage(imageSrc);
  };

  const handleClosePreview = () => {
    setPreviewImage(null);
  };

  const handleSubmit = async (continueEditing: boolean = false) => {
    if (!request) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/wallet/deposit-requests/${params.id}`, {
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
          router.push('/admin/deposit-settings/deposit-requests');
        } else {
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
        <span>充币设置</span> / <span>充币申请</span> / <span className="text-white">更新 充币申请: {request.id}</span>
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
              <div className="flex-1 text-white">{request.account || request.email}</div>
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
                {request.proofImage ? (
                  <div className="space-y-3">
                    <div
                      className="rounded-lg overflow-hidden border border-slate-700 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                      onClick={() => handlePreviewImage(request.proofImage)}
                      title="点击查看大图"
                    >
                      <img
                        src={request.proofImage}
                        alt="付款凭证"
                        className="w-full max-w-md"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          toast.error('图片加载失败');
                        }}
                        onLoad={(e) => {
                          e.currentTarget.style.display = 'block';
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 text-center">点击图片查看大图</p>
                  </div>
                ) : (
                  <span className="text-gray-500">—</span>
                )}
              </div>
            </div>

            {/* 状态 */}
            <div className="flex justify-between items-start py-3 border-b border-slate-700">
              <Label className="text-gray-400 text-sm min-w-[120px]">状态</Label>
              <div className="flex-1 text-white">{request.status}</div>
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
                })}
                <span className="ml-2 text-gray-500">GMT</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          onClick={() => router.push('/admin/deposit-settings/deposit-requests')}
          variant="secondary"
          className="bg-slate-700 hover:bg-slate-600"
        >
          取消
        </Button>
        <Button
          onClick={() => handleSubmit(true)}
          disabled={isSubmitting}
          className="bg-slate-600 hover:bg-slate-500"
        >
          {isSubmitting ? '保存中...' : '保存并继续编辑'}
        </Button>
        <Button
          onClick={() => handleSubmit(false)}
          disabled={isSubmitting}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isSubmitting ? '保存中...' : '保存'}
        </Button>
      </div>

      {/* 图片预览弹窗 */}
      <Dialog open={!!previewImage} onOpenChange={handleClosePreview}>
        <DialogContent className="max-w-4xl bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">付款凭证预览</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <div className="flex justify-center items-center bg-slate-900 rounded-lg p-4">
              <img
                src={previewImage}
                alt="付款凭证"
                className="max-w-full max-h-[600px] object-contain"
                onError={(e) => {
                  toast.error('图片加载失败');
                  handleClosePreview();
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
