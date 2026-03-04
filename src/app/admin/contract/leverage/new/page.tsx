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
import {
  ArrowLeft,
  Save,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

// 常用交易对选项
const commonSymbols = [
  'BTC', 'ETH', 'XAUUSD', 'XAGUSD', 'EURUSD', 'GBPUSD', 'USDJPY',
  'SOL', 'XRP', 'BNB', 'DOGE', 'ADA', 'LTC',
];

// 类型选项
const typeOptions = ['倍数'];

export default function NewLeveragePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    type: '倍数',
    value: '',
    symbol: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 验证
    if (!formData.type.trim()) {
      toast.error('类型不能为空');
      return;
    }

    if (!formData.value) {
      toast.error('值不能为空');
      return;
    }

    if (!formData.symbol.trim()) {
      toast.error('品种不能为空');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        type: formData.type,
        value: parseFloat(formData.value),
        symbol: formData.symbol,
      };

      const response = await fetch('/api/admin/contract/leverage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('倍数设置创建成功');
        router.push('/admin/contract/leverage');
      } else {
        toast.error(data.error || '创建失败');
      }
    } catch (error) {
      console.error('Failed to create leverage setting:', error);
      toast.error('创建失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 面包屑导航 */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>资源</span> / <span>倍数设置</span> / <span className="text-white">新建</span>
      </div>

      {/* 页面标题和操作栏 */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/admin/contract/leverage')}
          className="text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回
        </Button>
        <h1 className="text-2xl font-bold text-white">创建倍数设置</h1>
      </div>

      {/* 表单 */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">倍数设置信息</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
            {/* 类型 */}
            <div className="space-y-2">
              <Label htmlFor="type" className="text-white">
                类型 <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="请选择类型" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  {typeOptions.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 值 */}
            <div className="space-y-2">
              <Label htmlFor="value" className="text-white">
                值 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="value"
                type="number"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="请输入倍数值"
                required
              />
              <p className="text-xs text-gray-400">
                例如：100、200、500 等
              </p>
            </div>

            {/* 品种 */}
            <div className="space-y-2">
              <Label htmlFor="symbol" className="text-white">
                品种 <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.symbol}
                onValueChange={(value) => setFormData({ ...formData, symbol: value })}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="请选择品种" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  {commonSymbols.map((symbol) => (
                    <SelectItem key={symbol} value={symbol}>
                      {symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-400">
                也可以手动输入其他品种代码
              </p>
              {/* 手动输入选项 */}
              <Input
                type="text"
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white mt-2"
                placeholder="或手动输入品种代码"
              />
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/contract/leverage')}
                className="border-slate-600 hover:bg-slate-700"
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <Save className="w-4 h-4 mr-2" />
                {saving ? '创建中...' : '创建'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
