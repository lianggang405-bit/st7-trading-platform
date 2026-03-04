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

interface TradingPair {
  id: number;
  symbol: string;
}

interface TradingBot {
  id: number;
  name: string;
  pairId: number;
  floatValue: number;
}

export default function EditBotPage() {
  const params = useParams();
  const router = useRouter();
  const botId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pairs, setPairs] = useState<TradingPair[]>([]);
  const [bot, setBot] = useState<TradingBot | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    pairId: '',
    floatValue: 0,
  });

  useEffect(() => {
    if (botId) {
      Promise.all([fetchBot(), fetchTradingPairs()]);
    }
  }, [botId]);

  const fetchBot = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/trading/bots/${botId}`);
      const data = await response.json();
      
      if (data.success) {
        const botData = data.bot;
        setBot(botData);
        setFormData({
          name: botData.name,
          pairId: botData.pairId.toString(),
          floatValue: botData.floatValue,
        });
      } else {
        toast.error(data.error || '获取机器人信息失败');
        router.push('/admin/trading/bots');
      }
    } catch (error) {
      console.error('Failed to fetch bot:', error);
      toast.error('获取机器人信息失败');
      router.push('/admin/trading/bots');
    } finally {
      setLoading(false);
    }
  };

  const fetchTradingPairs = async () => {
    try {
      const response = await fetch('/api/admin/trading/pairs');
      const data = await response.json();
      if (data.success) {
        setPairs(data.pairs || []);
      }
    } catch (error) {
      console.error('Failed to fetch trading pairs:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 验证
    if (!formData.name.trim()) {
      toast.error('名称不能为空');
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
        floatValue: formData.floatValue,
      };

      const response = await fetch(`/api/admin/trading/bots/${botId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('调控机器人更新成功');
        router.push('/admin/trading/bots');
      } else {
        toast.error(data.error || '更新失败');
      }
    } catch (error) {
      console.error('Failed to update bot:', error);
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

  if (!bot) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">未找到机器人信息</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/admin/trading/bots')}
          className="mt-4"
        >
          返回列表
        </Button>
      </div>
    );
  }

  const getPairSymbol = (pairId: number) => {
    const pair = pairs.find((p) => p.id === pairId);
    return pair?.symbol || `ID: ${pairId}`;
  };

  return (
    <div className="space-y-6">
      {/* 面包屑导航 */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>资源</span> / <span>调控机器人</span> / <span className="text-white">编辑</span>
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
        <h1 className="text-2xl font-bold text-white">编辑调控机器人</h1>
      </div>

      {/* 表单 */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">机器人信息</CardTitle>
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
                value={bot.id}
                disabled
                className="bg-slate-700 border-slate-600 text-gray-400"
              />
            </div>

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

            {/* 交易对 (只读) */}
            <div className="space-y-2">
              <Label htmlFor="pairId" className="text-white">
                交易对
              </Label>
              <Input
                id="pairId"
                type="text"
                value={getPairSymbol(bot.pairId)}
                disabled
                className="bg-slate-700 border-slate-600 text-gray-400"
              />
              <p className="text-xs text-gray-400">交易对创建后不可修改</p>
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
