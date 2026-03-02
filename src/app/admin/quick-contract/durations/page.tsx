'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { RefreshCw, Plus, Edit2, Trash2, Timer, TrendingUp, ArrowUp } from 'lucide-react';
import { toast } from 'sonner';
import adminFetch from '@/lib/admin-fetch';

interface DurationConfig {
  id: number;
  duration: number;
  payoutRate: number;
  minAmount: number;
  maxAmount: number;
  status: 'active' | 'inactive';
  sort: number;
  createdAt: string;
  updatedAt: string;
}

export default function QuickContractDurationsPage() {
  const [configs, setConfigs] = useState<DurationConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<DurationConfig | null>(null);
  const [formData, setFormData] = useState<{
    duration: number;
    payoutRate: number;
    minAmount: number;
    maxAmount: number;
    status: 'active' | 'inactive';
    sort: number;
  }>({
    duration: 10,
    payoutRate: 1.85,
    minAmount: 1,
    maxAmount: 10000,
    status: 'active',
    sort: 0,
  });
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const response = await adminFetch('/api/admin/quick-contract/durations');
      const data = await response.json();
      if (data.success) {
        setConfigs(data.configs || []);
      }
    } catch (error) {
      console.error('Failed to fetch configs:', error);
      toast.error('获取秒数配置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.duration || formData.duration <= 0) {
      toast.error('请输入有效的秒数');
      return;
    }

    if (formData.payoutRate < 1 || formData.payoutRate > 10) {
      toast.error('赔付倍率必须在 1 到 10 之间');
      return;
    }

    if (formData.minAmount < 0.01) {
      toast.error('最小金额不能小于 0.01 USDT');
      return;
    }

    if (formData.maxAmount <= formData.minAmount) {
      toast.error('最大金额必须大于最小金额');
      return;
    }

    setSaveLoading(true);
    try {
      const url = selectedConfig
        ? `/api/admin/quick-contract/durations/${selectedConfig.id}`
        : '/api/admin/quick-contract/durations';
      const method = selectedConfig ? 'PATCH' : 'POST';

      const response = await adminFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(selectedConfig ? '秒数配置更新成功' : '秒数配置创建成功');
        setDialogOpen(false);
        resetFormData();
        fetchConfigs();
      } else {
        toast.error(data.error || '操作失败');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('操作失败，请稍后重试');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确认删除该秒数配置？')) return;

    try {
      const response = await adminFetch(`/api/admin/quick-contract/durations/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        toast.success('秒数配置删除成功');
        fetchConfigs();
      } else {
        toast.error(data.error || '删除失败');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('删除失败，请稍后重试');
    }
  };

  const handleToggleStatus = async (config: DurationConfig) => {
    try {
      const newStatus = config.status === 'active' ? 'inactive' : 'active';
      const response = await adminFetch(`/api/admin/quick-contract/durations/${config.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`配置已${newStatus === 'active' ? '启用' : '禁用'}`);
        fetchConfigs();
      } else {
        toast.error(data.error || '操作失败');
      }
    } catch (error) {
      console.error('Toggle status error:', error);
      toast.error('操作失败，请稍后重试');
    }
  };

  const handleEdit = (config: DurationConfig) => {
    setSelectedConfig(config);
    setFormData({
      duration: config.duration,
      payoutRate: config.payoutRate,
      minAmount: config.minAmount,
      maxAmount: config.maxAmount,
      status: config.status,
      sort: config.sort,
    });
    setDialogOpen(true);
  };

  const resetFormData = () => {
    setSelectedConfig(null);
    setFormData({
      duration: 10,
      payoutRate: 1.85,
      minAmount: 1,
      maxAmount: 10000,
      status: 'active',
      sort: 0,
    });
  };

  const getStatusBadge = (status: string) => {
    return status === 'active'
      ? <Badge className="bg-green-500/10 text-green-400">启用</Badge>
      : <Badge className="bg-gray-500/10 text-gray-400">禁用</Badge>;
  };

  const getPayoutRateColor = (rate: number) => {
    if (rate < 1.5) return 'text-gray-400';
    if (rate < 1.8) return 'text-green-400';
    if (rate < 2.0) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6">
      {/* 面包屑 */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-400">桌面</span>
        <span className="text-gray-600">/</span>
        <span className="text-gray-400">秒合约设置</span>
        <span className="text-gray-600">/</span>
        <span className="text-white">秒数设置</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-white">秒合约秒数设置</h1>
        <p className="text-gray-400 mt-1">配置秒合约的可用秒数选项和赔付参数</p>
      </div>

      {/* 操作栏 */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="text-gray-400">
              共 {configs.length} 个秒数配置
            </div>
            <div className="flex gap-2">
              <Button
                onClick={fetchConfigs}
                variant="outline"
                size="icon"
                className="border-slate-600 hover:bg-slate-700"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Dialog open={dialogOpen} onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) resetFormData();
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-1" />
                    添加秒数
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-800 border-slate-700">
                  <DialogHeader>
                    <DialogTitle className="text-white">
                      {selectedConfig ? '编辑秒数配置' : '添加秒数配置'}
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                      配置秒合约的秒数选项和赔付参数
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-gray-300">秒数</Label>
                        <Input
                          type="number"
                          value={formData.duration}
                          onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                          placeholder="10"
                          min="1"
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-300">赔付倍率</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.payoutRate}
                          onChange={(e) => setFormData({ ...formData, payoutRate: parseFloat(e.target.value) })}
                          placeholder="1.85"
                          min="1"
                          max="10"
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-gray-300">最小金额 (USDT)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.minAmount}
                          onChange={(e) => setFormData({ ...formData, minAmount: parseFloat(e.target.value) })}
                          placeholder="1"
                          min="0.01"
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-300">最大金额 (USDT)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.maxAmount}
                          onChange={(e) => setFormData({ ...formData, maxAmount: parseFloat(e.target.value) })}
                          placeholder="10000"
                          min="0.01"
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-300">排序</Label>
                      <Input
                        type="number"
                        value={formData.sort}
                        onChange={(e) => setFormData({ ...formData, sort: parseInt(e.target.value) })}
                        placeholder="0"
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                      <p className="text-xs text-gray-500">数值越小越靠前</p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDialogOpen(false);
                        resetFormData();
                      }}
                      className="border-slate-600 hover:bg-slate-700"
                    >
                      取消
                    </Button>
                    <Button onClick={handleSave} disabled={saveLoading}>
                      {saveLoading ? '保存中...' : '保存'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 统计卡片 */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-400/10 flex items-center justify-center">
                <Timer className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <div className="text-3xl font-bold text-white">{configs.length}</div>
                <div className="text-sm text-gray-400">秒数配置数</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-400/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <div className="text-3xl font-bold text-white">
                  {configs.filter(c => c.status === 'active').length}
                </div>
                <div className="text-sm text-gray-400">已启用</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-400/10 flex items-center justify-center">
                <ArrowUp className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <div className="text-3xl font-bold text-white">
                  {configs.length > 0 ? Math.max(...configs.map(c => c.payoutRate)) : 0}
                </div>
                <div className="text-sm text-gray-400">最高赔付</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-400/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <div className="text-3xl font-bold text-white">
                  {configs.reduce((sum, c) => sum + c.maxAmount, 0).toFixed(0)} USDT
                </div>
                <div className="text-sm text-gray-400">总限额</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 配置列表 */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">秒数配置列表</CardTitle>
          <CardDescription className="text-gray-400">
            共 {configs.length} 个配置
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-400">加载中...</div>
            </div>
          ) : configs.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-400">暂无秒数配置</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-gray-400">秒数</TableHead>
                    <TableHead className="text-gray-400">赔付倍率</TableHead>
                    <TableHead className="text-gray-400">最小金额</TableHead>
                    <TableHead className="text-gray-400">最大金额</TableHead>
                    <TableHead className="text-gray-400">排序</TableHead>
                    <TableHead className="text-gray-400">状态</TableHead>
                    <TableHead className="text-gray-400 text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {configs.map((config) => (
                    <TableRow key={config.id} className="border-slate-700 hover:bg-slate-700/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Timer className="w-5 h-5 text-blue-400" />
                          <span className="text-gray-300 font-medium">{config.duration} 秒</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`text-2xl font-bold ${getPayoutRateColor(config.payoutRate)}`}>
                          {config.payoutRate.toFixed(2)}x
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-300">{config.minAmount} USDT</TableCell>
                      <TableCell className="text-gray-300">{config.maxAmount} USDT</TableCell>
                      <TableCell className="text-gray-300">{config.sort}</TableCell>
                      <TableCell>{getStatusBadge(config.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Switch
                            checked={config.status === 'active'}
                            onCheckedChange={() => handleToggleStatus(config)}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(config)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(config.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
