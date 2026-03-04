'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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

interface LeverageSetting {
  id: number;
  type: string;
  value: number;
  symbol: string;
}

export default function EditLeveragePage() {
  const params = useParams();
  const router = useRouter();
  const settingId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [setting, setSetting] = useState<LeverageSetting | null>(null);
  const [formData, setFormData] = useState({
    type: '倍数',
    value: '',
    symbol: '',
  });

  useEffect(() => {
    if (settingId) {
      fetchSetting();
    }
  }, [settingId]);

  const fetchSetting = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/contract/leverage/${settingId}`);
      const data = await response.json();
      
      if (data.success) {
        const settingData = data.setting;
        setSetting(settingData);
        setFormData({
          type: settingData.type,
          value: settingData.value.toString(),
          symbol: settingData.symbol,
        });
      } else {
        toast.error(data.error || '获取倍数设置失败');
        router.push('/admin/contract/leverage');
      }
    } catch (error) {
      console.error('Failed to fetch setting:', error);
      toast.error('获取倍数设置失败');
      router.push('/admin/contract/leverage');
    } finally {
      setLoading(false);
    }
  };

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

      const response = await fetch(`/api/admin/contract/leverage/${settingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('倍数设置更新成功');
        router.push('/admin/contract/leverage');
      } else {
        toast.error(data.error || '更新失败');
      }
    } catch (error) {
      console.error('Failed to update leverage setting:', error);
      toast.error('更新失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-3 text-gray-400">加载中...</span>
      </div>
    );
  }

  if (!setting) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">未找到倍数设置信息</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/admin/contract/leverage')}
          className="mt-4"
        >
          返回列表
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 面包屑导航 */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>资源</span> / <span>倍数设置</span> / <span className="text-white">编辑</span>
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
        <h1 className="text-2xl font-bold text-white">编辑倍数设置</h1>
      </div>

      {/* 表单 */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">倍数设置信息</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
            {/* ID (只读) */}
            <div className="space-y-2">
              <Label htmlFor="id" className="text-white">
                ID
              </Label>
              <Input
                id="id"
                type="text"
                value={setting.id}
                disabled
                className="bg-slate-700 border-slate-600 text-gray-400"
              />
            </div>

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
                {saving ? '保存中...' : '保存'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
