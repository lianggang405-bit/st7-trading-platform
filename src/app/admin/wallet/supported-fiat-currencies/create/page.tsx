'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function CreateSupportedFiatCurrencyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    usd_rate: '1',
    withdrawal_fee: '0',
    min_withdrawal: '10',
    max_withdrawal: '1000000',
    is_visible: true,
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 验证必填字段
    if (!formData.name || !formData.min_withdrawal || !formData.max_withdrawal) {
      toast.error('请填写所有必填字段');
      return;
    }

    // 验证数值
    const usdRate = parseFloat(formData.usd_rate);
    const withdrawalFee = parseFloat(formData.withdrawal_fee);
    const minWithdrawal = parseFloat(formData.min_withdrawal);
    const maxWithdrawal = parseFloat(formData.max_withdrawal);

    if (isNaN(usdRate) || isNaN(withdrawalFee) || isNaN(minWithdrawal) || isNaN(maxWithdrawal)) {
      toast.error('请输入有效的数值');
      return;
    }

    if (minWithdrawal < 0 || maxWithdrawal < 0 || usdRate < 0 || withdrawalFee < 0) {
      toast.error('数值不能为负数');
      return;
    }

    if (minWithdrawal >= maxWithdrawal) {
      toast.error('最小提币数量必须小于最大提币数量');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/wallet/supported-fiat-currencies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          usd_rate: usdRate,
          withdrawal_fee: withdrawalFee,
          min_withdrawal: minWithdrawal,
          max_withdrawal: maxWithdrawal,
          is_visible: formData.is_visible,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('支持法币设置创建成功');
        router.push('/admin/wallet/supported-fiat-currencies');
      } else {
        toast.error(data.error || '创建支持法币设置失败');
      }
    } catch (error) {
      console.error('Failed to create supported fiat currency:', error);
      toast.error('创建支持法币设置失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题和面包屑 */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <span>资源</span>
          <span>/</span>
          <span>支持法币设置</span>
          <span>/</span>
          <span className="text-gray-900 font-medium">创建 支持法币设置</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">创建 支持法币设置</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 表单字段 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 品种名称 */}
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-1">
                  品种名称 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="例如：USD, EUR, CNY"
                  disabled={loading}
                />
              </div>

              {/* 兑USD汇率 */}
              <div className="space-y-2">
                <Label htmlFor="usd_rate" className="flex items-center gap-1">
                  兑USD汇率 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="usd_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.usd_rate}
                  onChange={(e) => handleInputChange('usd_rate', e.target.value)}
                  placeholder="1.00"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500">
                  该法币对USD的汇率，例如：1 USD = 0.92 EUR，则填入 0.92
                </p>
              </div>

              {/* 提币费率 */}
              <div className="space-y-2">
                <Label htmlFor="withdrawal_fee">提币费率</Label>
                <Input
                  id="withdrawal_fee"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.withdrawal_fee}
                  onChange={(e) => handleInputChange('withdrawal_fee', e.target.value)}
                  placeholder="0.00"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500">每次提币收取的手续费（以该法币为单位）</p>
              </div>

              {/* 最小提币数量 */}
              <div className="space-y-2">
                <Label htmlFor="min_withdrawal" className="flex items-center gap-1">
                  最小提币数量 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="min_withdrawal"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.min_withdrawal}
                  onChange={(e) => handleInputChange('min_withdrawal', e.target.value)}
                  placeholder="10"
                  disabled={loading}
                />
              </div>

              {/* 最大提币数量 */}
              <div className="space-y-2">
                <Label htmlFor="max_withdrawal" className="flex items-center gap-1">
                  最大提币数量 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="max_withdrawal"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.max_withdrawal}
                  onChange={(e) => handleInputChange('max_withdrawal', e.target.value)}
                  placeholder="1000000"
                  disabled={loading}
                />
              </div>

              {/* 是否展示 */}
              <div className="space-y-2 flex flex-col justify-end">
                <Label htmlFor="is_visible">是否展示</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_visible"
                    checked={formData.is_visible}
                    onCheckedChange={(checked) => handleInputChange('is_visible', checked)}
                    disabled={loading}
                  />
                  <span className="text-sm text-gray-500">
                    {formData.is_visible ? '是（在前端展示）' : '否（在前端隐藏）'}
                  </span>
                </div>
              </div>
            </div>

            {/* 提示信息 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>提示：</strong>
                配置完成后，用户在前端进行法币提币时将按照此设置进行验证和计费。
                请确保所有数值配置准确。
              </p>
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回
              </Button>
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? '保存中...' : '保存'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
