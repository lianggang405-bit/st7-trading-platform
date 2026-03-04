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

// 常用秒数选项
const commonSeconds = [30, 60, 180, 300, 600];

// 状态选项
const statusOptions = [
  { value: 'normal', label: '正常' },
  { value: 'disabled', label: '禁用' },
];

interface SecondsConfig {
  id: number;
  seconds: number;
  status: string;
  profitRate: number;
  maxAmount: number;
  minAmount: number;
}

export default function EditSecondsConfigPage() {
  const params = useParams();
  const router = useRouter();
  const configId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<SecondsConfig | null>(null);
  const [formData, setFormData] = useState({
    seconds: '',
    status: 'normal',
    profitRate: '',
    maxAmount: '',
    minAmount: '',
  });

  useEffect(() => {
    if (configId) {
      fetchConfig();
    }
  }, [configId]);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/contract/seconds-config/${configId}`);
      const data = await response.json();
      
      if (data.success) {
        const configData = data.config;
        setConfig(configData);
        setFormData({
          seconds: configData.seconds.toString(),
          status: configData.status,
          profitRate: configData.profitRate.toString(),
          maxAmount: configData.maxAmount.toString(),
          minAmount: configData.minAmount.toString(),
        });
      } else {
        toast.error(data.error || '获取秒数设置失败');
        router.push('/admin/contract/seconds-config');
      }
    } catch (error) {
      console.error('Failed to fetch config:', error);
      toast.error('获取秒数设置失败');
      router.push('/admin/contract/seconds-config');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 验证
    if (!formData.seconds) {
      toast.error('秒数不能为空');
      return;
    }

    if (!formData.profitRate) {
      toast.error('收益率不能为空');
      return;
    }

    if (!formData.maxAmount) {
      toast.error('最高金额不能为空');
      return;
    }

    if (!formData.minAmount) {
      toast.error('最低金额不能为空');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        seconds: parseInt(formData.seconds),
        status: formData.status,
        profitRate: parseFloat(formData.profitRate),
        maxAmount: parseFloat(formData.maxAmount),
        minAmount: parseFloat(formData.minAmount),
      };

      const response = await fetch(`/api/admin/contract/seconds-config/${configId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('秒数设置更新成功');
        router.push('/admin/contract/seconds-config');
      } else {
        toast.error(data.error || '更新失败');
      }
    } catch (error) {
      console.error('Failed to update seconds config:', error);
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

  if (!config) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">未找到秒数设置信息</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/admin/contract/seconds-config')}
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
        <span>资源</span> / <span>秒数设置</span> / <span className="text-white">编辑</span>
      </div>

      {/* 页面标题和操作栏 */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/admin/contract/seconds-config')}
          className="text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回
        </Button>
        <h1 className="text-2xl font-bold text-white">编辑秒数设置</h1>
      </div>

      {/* 表单 */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">秒数设置信息</CardTitle>
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
                value={config.id}
                disabled
                className="bg-slate-700 border-slate-600 text-gray-400"
              />
            </div>

            {/* 秒数 */}
            <div className="space-y-2">
              <Label htmlFor="seconds" className="text-white">
                秒数 <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.seconds}
                onValueChange={(value) => setFormData({ ...formData, seconds: value })}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="请选择秒数" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  {commonSeconds.map((sec) => (
                    <SelectItem key={sec} value={sec.toString()}>
                      {sec} 秒
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-400">
                或者手动输入其他秒数
              </p>
              <Input
                id="seconds"
                type="number"
                value={formData.seconds}
                onChange={(e) => setFormData({ ...formData, seconds: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white mt-2"
                placeholder="请输入秒数"
                min="1"
              />
            </div>

            {/* 状态 */}
            <div className="space-y-2">
              <Label htmlFor="status" className="text-white">
                状态 <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="请选择状态" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  {statusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 收益率 */}
            <div className="space-y-2">
              <Label htmlFor="profitRate" className="text-white">
                收益率 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="profitRate"
                type="number"
                step="0.01"
                value={formData.profitRate}
                onChange={(e) => setFormData({ ...formData, profitRate: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="0.85"
                required
              />
              <p className="text-xs text-gray-400">
                例如：0.85 表示 85% 的收益率
              </p>
            </div>

            {/* 最高金额 */}
            <div className="space-y-2">
              <Label htmlFor="maxAmount" className="text-white">
                最高金额 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="maxAmount"
                type="number"
                step="0.01"
                value={formData.maxAmount}
                onChange={(e) => setFormData({ ...formData, maxAmount: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="10000"
                required
              />
            </div>

            {/* 最低金额 */}
            <div className="space-y-2">
              <Label htmlFor="minAmount" className="text-white">
                最低金额 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="minAmount"
                type="number"
                step="0.01"
                value={formData.minAmount}
                onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="10"
                required
              />
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/contract/seconds-config')}
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
