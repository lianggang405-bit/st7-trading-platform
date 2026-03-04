'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function TradingPairCreatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    currencyId: '1',
    symbol: '',
    isVisible: true,
    minOrderSize: '0.001',
    maxOrderSize: '999999',
    contractFee: '0.1',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.symbol.trim()) {
      toast.error('请输入交易对名称');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/trading/pairs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currencyId: parseInt(formData.currencyId),
          symbol: formData.symbol.trim(),
          isVisible: formData.isVisible,
          minOrderSize: parseFloat(formData.minOrderSize),
          maxOrderSize: parseFloat(formData.maxOrderSize),
          contractFee: parseFloat(formData.contractFee),
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('交易对创建成功');
        router.push('/admin/trading/pairs');
      } else {
        toast.error(data.error || '创建交易对失败');
      }
    } catch (error) {
      console.error('Failed to create trading pair:', error);
      toast.error('创建交易对失败');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="space-y-6 px-2 sm:px-0">
      {/* 面包屑导航 - 手机端隐藏 */}
      <div className="hidden sm:flex items-center gap-2 text-sm text-gray-400">
        <span>资源</span>
        <span>/</span>
        <span>交易对</span>
        <span>/</span>
        <span className="text-white">新建交易对</span>
      </div>

      {/* 页面标题和操作栏 */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white flex-shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl sm:text-2xl font-bold text-white truncate">新建交易对</h1>
      </div>

      {/* 表单卡片 */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">交易对信息</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* 法币ID */}
              <div className="space-y-2">
                <Label htmlFor="currencyId" className="text-gray-300">
                  法币ID
                </Label>
                <Input
                  id="currencyId"
                  type="number"
                  placeholder="请输入法币ID"
                  value={formData.currencyId}
                  onChange={(e) => handleInputChange('currencyId', e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                  disabled={loading}
                />
              </div>

              {/* 交易对名称 */}
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="symbol" className="text-gray-300">
                  交易对名称 <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="symbol"
                  placeholder="例如：BTC/USDT"
                  value={formData.symbol}
                  onChange={(e) => handleInputChange('symbol', e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                  disabled={loading}
                />
              </div>

              {/* 是否展示 */}
              <div className="space-y-2">
                <Label htmlFor="isVisible" className="text-gray-300">
                  是否展示
                </Label>
                <div className="flex items-center gap-3">
                  <Switch
                    id="isVisible"
                    checked={formData.isVisible}
                    onCheckedChange={(checked) => handleInputChange('isVisible', checked)}
                    disabled={loading}
                  />
                  <span className="text-gray-300">{formData.isVisible ? '展示' : '隐藏'}</span>
                </div>
              </div>

              {/* 合约最小下单数量 */}
              <div className="space-y-2">
                <Label htmlFor="minOrderSize" className="text-gray-300">
                  合约最小下单数量
                </Label>
                <Input
                  id="minOrderSize"
                  type="number"
                  step="0.000001"
                  placeholder="请输入最小下单数量"
                  value={formData.minOrderSize}
                  onChange={(e) => handleInputChange('minOrderSize', e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                  disabled={loading}
                />
              </div>

              {/* 合约最大下单数量 */}
              <div className="space-y-2">
                <Label htmlFor="maxOrderSize" className="text-gray-300">
                  合约最大下单数量
                </Label>
                <Input
                  id="maxOrderSize"
                  type="number"
                  step="0.000001"
                  placeholder="请输入最大下单数量"
                  value={formData.maxOrderSize}
                  onChange={(e) => handleInputChange('maxOrderSize', e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                  disabled={loading}
                />
              </div>

              {/* 合约手续费% */}
              <div className="space-y-2">
                <Label htmlFor="contractFee" className="text-gray-300">
                  合约手续费%
                </Label>
                <Input
                  id="contractFee"
                  type="number"
                  step="0.0001"
                  placeholder="请输入手续费比例"
                  value={formData.contractFee}
                  onChange={(e) => handleInputChange('contractFee', e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                  disabled={loading}
                />
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-3 pt-4 border-t border-slate-700">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="border-slate-600 hover:bg-slate-700 text-white"
                disabled={loading}
              >
                取消
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? '保存中...' : '保存'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
