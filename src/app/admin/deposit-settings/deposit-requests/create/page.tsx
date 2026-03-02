'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import adminFetch from '@/lib/admin-fetch';
import { ArrowLeft } from 'lucide-react';

export default function CreateDepositRequestPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    userId: '',
    type: 'crypto',
    currency: '',
    amount: '',
    txHash: '',
    remark: '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.userId || !formData.currency || !formData.amount) {
      toast.error('请填写必填字段');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await adminFetch('/api/admin/wallet/deposit-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: parseInt(formData.userId),
          type: formData.type,
          currency: formData.currency,
          amount: parseFloat(formData.amount),
          txHash: formData.txHash || undefined,
          remark: formData.remark || undefined,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('充币申请创建成功');
        router.back();
      } else {
        toast.error(data.error || '创建失败');
      }
    } catch (error) {
      console.error('Failed to create deposit request:', error);
      toast.error('创建失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 面包屑导航 */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>资源</span> / <span>充币申请</span> / <span className="text-white">创建充币申请</span>
      </div>

      {/* 标题和返回按钮 */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold text-white">创建充币申请</h1>
      </div>

      {/* 表单 */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="pt-6">
          <div className="space-y-6 max-w-2xl">
            {/* 用户ID */}
            <div className="space-y-2">
              <Label className="text-gray-400">用户ID *</Label>
              <Input
                type="number"
                value={formData.userId}
                onChange={(e) => handleChange('userId', e.target.value)}
                placeholder="请输入用户ID"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            {/* 充币类型 */}
            <div className="space-y-2">
              <Label className="text-gray-400">充币类型</Label>
              <select
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-md"
              >
                <option value="crypto">数字货币</option>
                <option value="wire">电汇</option>
                <option value="bank">银行卡</option>
              </select>
            </div>

            {/* 币种 */}
            <div className="space-y-2">
              <Label className="text-gray-400">币种 *</Label>
              <Input
                type="text"
                value={formData.currency}
                onChange={(e) => handleChange('currency', e.target.value)}
                placeholder="如: USDT, BTC, ETH"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            {/* 金额 */}
            <div className="space-y-2">
              <Label className="text-gray-400">金额 *</Label>
              <Input
                type="number"
                step="0.00000001"
                value={formData.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
                placeholder="请输入金额"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            {/* 交易哈希 */}
            <div className="space-y-2">
              <Label className="text-gray-400">交易哈希 (TX Hash)</Label>
              <Input
                type="text"
                value={formData.txHash}
                onChange={(e) => handleChange('txHash', e.target.value)}
                placeholder="可选，请输入交易哈希"
                className="bg-slate-700 border-slate-600 text-white font-mono text-sm"
              />
            </div>

            {/* 备注 */}
            <div className="space-y-2">
              <Label className="text-gray-400">备注</Label>
              <textarea
                value={formData.remark}
                onChange={(e) => handleChange('remark', e.target.value)}
                placeholder="可选，请输入备注信息"
                rows={4}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-md resize-none"
              />
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                取消
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? '提交中...' : '创建'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
