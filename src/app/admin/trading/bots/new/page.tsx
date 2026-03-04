'use client';

import { useState, useEffect } from 'react';
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

interface TradingPair {
  id: number;
  symbol: string;
}

export default function NewBotPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pairs, setPairs] = useState<TradingPair[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    pairId: '',
    floatValue: 0,
  });

  // 获取交易对列表
  useEffect(() => {
    fetchTradingPairs();
  }, []);

  const fetchTradingPairs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/trading/pairs');
      const data = await response.json();
      if (data.success) {
        setPairs(data.pairs || []);
      }
    } catch (error) {
      console.error('Failed to fetch trading pairs:', error);
      toast.error('获取交易对列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 验证
    if (!formData.name.trim()) {
      toast.error('名称不能为空');
      return;
    }

    if (!formData.pairId) {
      toast.error('请选择交易对');
      return;
    }

    if (formData.floatValue === undefined || formData.floatValue === null) {
      toast.error('浮点值不能为空');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        pairId: parseInt(formData.pairId),
        floatValue: formData.floatValue,
      };

      const response = await fetch('/api/admin/trading/bots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('调控机器人创建成功');
        router.push('/admin/trading/bots');
      } else {
        toast.error(data.error || '创建失败');
      }
    } catch (error) {
      console.error('Failed to create bot:', error);
      toast.error('创建失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 面包屑导航 */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>资源</span> / <span>调控机器人</span> / <span className="text-white">新建</span>
      </div>

      {/* 页面标题和操作栏 */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/admin/trading/bots')}
          className="text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回
        </Button>
        <h1 className="text-2xl font-bold text-white">创建调控机器人</h1>
      </div>

      {/* 表单 */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">机器人信息</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <span className="ml-3 text-gray-400">加载中...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
              {/* 名称 */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white">
                  名称 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="请输入机器人名称"
                  required
                />
              </div>

              {/* 交易对 */}
              <div className="space-y-2">
                <Label htmlFor="pairId" className="text-white">
                  交易对 <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.pairId}
                  onValueChange={(value) => setFormData({ ...formData, pairId: value })}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="请选择交易对" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    {pairs.map((pair) => (
                      <SelectItem key={pair.id} value={pair.id.toString()}>
                        {pair.symbol}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {pairs.length === 0 && (
                  <p className="text-sm text-yellow-500">
                    暂无可用交易对，请先创建交易对
                  </p>
                )}
              </div>

              {/* 浮点值 */}
              <div className="space-y-2">
                <Label htmlFor="floatValue" className="text-white">
                  浮点值 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="floatValue"
                  type="number"
                  step="0.00000001"
                  value={formData.floatValue}
                  onChange={(e) => setFormData({ ...formData, floatValue: parseFloat(e.target.value) || 0 })}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="0.00000000"
                  required
                />
                <p className="text-xs text-gray-400">
                  数据源真实的实时价格 + 浮点值 = 调控后的行情实时价格
                </p>
              </div>

              {/* 操作按钮 */}
              <div className="flex items-center gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/admin/trading/bots')}
                  className="border-slate-600 hover:bg-slate-700"
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  disabled={saving || pairs.length === 0}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? '创建中...' : '创建'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
