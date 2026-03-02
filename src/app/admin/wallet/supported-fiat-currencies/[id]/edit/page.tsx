'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';

export default function EditSupportedFiatCurrencyPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    usd_rate: '1',
    withdrawal_fee: '0',
    min_withdrawal: '10',
    max_withdrawal: '1000000',
    is_visible: true,
  });

  // 加载数据
  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const response = await fetch(`/api/admin/wallet/supported-fiat-currencies/${id}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '获取数据失败');
      }

      const result = await response.json();
      const data = result.data;

      if (data) {
        setFormData({
          name: data.name || '',
          usd_rate: data.usd_rate?.toString() || '1',
          withdrawal_fee: data.withdrawal_fee?.toString() || '0',
          min_withdrawal: data.min_withdrawal?.toString() || '10',
          max_withdrawal: data.max_withdrawal?.toString() || '1000000',
          is_visible: data.is_visible ?? true,
        });
      }
    } catch (error) {
      console.error('Failed to fetch supported fiat currency:', error);
      toast.error(error instanceof Error ? error.message : '获取数据失败');
      router.back();
    } finally {
      setLoading(false);
    }
  };

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

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/wallet/supported-fiat-currencies/${id}`, {
        method: 'PATCH',
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
        toast.success('支持法币设置更新成功');
        router.push('/admin/wallet/supported-fiat-currencies');
      } else {
        toast.error(data.error || '更新支持法币设置失败');
      }
    } catch (error) {
      console.error('Failed to update supported fiat currency:', error);
      toast.error('更新支持法币设置失败');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和面包屑 */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <span>资源</span>
          <span>/</span>
          <span>支持法币设置</span>
          <span>/</span>
          <span className="text-gray-900 font-medium">编辑 支持法币设置</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">编辑 支持法币设置</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 表单字段 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ID（只读） */}
              <div className="space-y-2">
                <Label htmlFor="id">ID</Label>
                <Input
                  id="id"
                  value={id}
                  disabled
                  className="bg-gray-50"
                />
              </div>

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
                  disabled={saving}
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
                  disabled={saving}
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
                  disabled={saving}
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
                  disabled={saving}
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
                  disabled={saving}
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
                    disabled={saving}
                  />
                  <span className="text-sm text-gray-500">
                    {formData.is_visible ? '是（在前端展示）' : '否（在前端隐藏）'}
                  </span>
                </div>
              </div>

              {/* 创建时间（只读） */}
              <div className="space-y-2 flex flex-col justify-end">
                <Label>创建时间</Label>
                <Input
                  value={new Date().toLocaleString('zh-TW')}
                  disabled
                  className="bg-gray-50"
                />
              </div>
            </div>

            {/* 提示信息 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>提示：</strong>
                修改配置后，用户在前端进行法币提币时将按照新的设置进行验证和计费。
                请谨慎修改，确保所有数值配置准确。
              </p>
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={saving}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回
              </Button>
              <Button type="submit" disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? '保存中...' : '保存'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
