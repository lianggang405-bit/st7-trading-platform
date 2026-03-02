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
import { RefreshCw, Plus, Edit2, Trash2, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import adminFetch from '@/lib/admin-fetch';

interface WireCurrency {
  id: number;
  code: string;
  name: string;
  nameEn: string;
  symbol: string;
  minAmount: number;
  maxAmount: number;
  fee: number;
  feeType: 'fixed' | 'percentage';
  status: 'active' | 'inactive';
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

export default function WireCurrenciesPage() {
  const [currencies, setCurrencies] = useState<WireCurrency[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<WireCurrency | null>(null);
  const [formData, setFormData] = useState<{
    code: string;
    name: string;
    nameEn: string;
    symbol: string;
    minAmount: number;
    maxAmount: number;
    fee: number;
    feeType: 'fixed' | 'percentage';
    status: 'active' | 'inactive';
    icon?: string;
  }>({
    code: '',
    name: '',
    nameEn: '',
    symbol: '',
    minAmount: 100,
    maxAmount: 1000000,
    fee: 10,
    feeType: 'fixed',
    status: 'active',
    icon: '',
  });
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    fetchCurrencies();
  }, []);

  const fetchCurrencies = async () => {
    setLoading(true);
    try {
      const response = await adminFetch('/api/admin/deposit-settings/wire-currencies');
      const data = await response.json();
      if (data.success) {
        setCurrencies(data.currencies || []);
      }
    } catch (error) {
      console.error('Failed to fetch currencies:', error);
      toast.error('获取电汇币种失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.code || !formData.name || !formData.nameEn || !formData.symbol) {
      toast.error('请填写完整信息');
      return;
    }

    if (formData.minAmount >= formData.maxAmount) {
      toast.error('最小金额必须小于最大金额');
      return;
    }

    setSaveLoading(true);
    try {
      const url = selectedCurrency
        ? `/api/admin/deposit-settings/wire-currencies/${selectedCurrency.id}`
        : '/api/admin/deposit-settings/wire-currencies';
      const method = selectedCurrency ? 'PATCH' : 'POST';

      const response = await adminFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(selectedCurrency ? '币种更新成功' : '币种创建成功');
        setDialogOpen(false);
        resetFormData();
        fetchCurrencies();
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
    if (!confirm('确认删除该电汇币种？')) return;

    try {
      const response = await adminFetch(`/api/admin/deposit-settings/wire-currencies/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        toast.success('币种删除成功');
        fetchCurrencies();
      } else {
        toast.error(data.error || '删除失败');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('删除失败，请稍后重试');
    }
  };

  const handleToggleStatus = async (currency: WireCurrency) => {
    try {
      const newStatus = currency.status === 'active' ? 'inactive' : 'active';
      const response = await adminFetch(`/api/admin/deposit-settings/wire-currencies/${currency.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`币种已${newStatus === 'active' ? '启用' : '禁用'}`);
        fetchCurrencies();
      } else {
        toast.error(data.error || '操作失败');
      }
    } catch (error) {
      console.error('Toggle status error:', error);
      toast.error('操作失败，请稍后重试');
    }
  };

  const handleEdit = (currency: WireCurrency) => {
    setSelectedCurrency(currency);
    setFormData({
      code: currency.code,
      name: currency.name,
      nameEn: currency.nameEn,
      symbol: currency.symbol,
      minAmount: currency.minAmount,
      maxAmount: currency.maxAmount,
      fee: currency.fee,
      feeType: currency.feeType,
      status: currency.status,
      icon: currency.icon,
    });
    setDialogOpen(true);
  };

  const resetFormData = () => {
    setSelectedCurrency(null);
    setFormData({
      code: '',
      name: '',
      nameEn: '',
      symbol: '',
      minAmount: 100,
      maxAmount: 1000000,
      fee: 10,
      feeType: 'fixed',
      status: 'active',
      icon: '',
    });
  };

  const getStatusBadge = (status: string) => {
    return status === 'active'
      ? <Badge className="bg-green-500/10 text-green-400">启用</Badge>
      : <Badge className="bg-gray-500/10 text-gray-400">禁用</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* 面包屑 */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-400">桌面</span>
        <span className="text-gray-600">/</span>
        <span className="text-gray-400">充币设置</span>
        <span className="text-gray-600">/</span>
        <span className="text-white">电汇币种设置</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-white">电汇币种设置</h1>
        <p className="text-gray-400 mt-1">配置电汇充币支持的币种及费用</p>
      </div>

      {/* 操作栏 */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="text-gray-400">
              共 {currencies.length} 个币种
            </div>
            <div className="flex gap-2">
              <Button
                onClick={fetchCurrencies}
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
                    添加币种
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-800 border-slate-700">
                  <DialogHeader>
                    <DialogTitle className="text-white">
                      {selectedCurrency ? '编辑电汇币种' : '添加电汇币种'}
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                      配置电汇充币支持的币种信息
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-gray-300">币种代码</Label>
                        <Input
                          value={formData.code}
                          onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                          placeholder="USD"
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-300">币种符号</Label>
                        <Input
                          value={formData.symbol}
                          onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                          placeholder="$"
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-gray-300">币种名称（中文）</Label>
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="美元"
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-300">币种名称（英文）</Label>
                        <Input
                          value={formData.nameEn}
                          onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                          placeholder="US Dollar"
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-gray-300">最小金额</Label>
                        <Input
                          type="number"
                          value={formData.minAmount}
                          onChange={(e) => setFormData({ ...formData, minAmount: parseFloat(e.target.value) })}
                          placeholder="100"
                          min="0"
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-300">最大金额</Label>
                        <Input
                          type="number"
                          value={formData.maxAmount}
                          onChange={(e) => setFormData({ ...formData, maxAmount: parseFloat(e.target.value) })}
                          placeholder="1000000"
                          min="0"
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-gray-300">手续费</Label>
                        <Input
                          type="number"
                          value={formData.fee}
                          onChange={(e) => setFormData({ ...formData, fee: parseFloat(e.target.value) })}
                          placeholder="10"
                          min="0"
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-300">手续费类型</Label>
                        <div className="flex gap-4 mt-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="feeType"
                              value="fixed"
                              checked={formData.feeType === 'fixed'}
                              onChange={(e) => setFormData({ ...formData, feeType: e.target.value as 'fixed' | 'percentage' })}
                              className="accent-blue-500"
                            />
                            <span className="text-gray-300">固定金额</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="feeType"
                              value="percentage"
                              checked={formData.feeType === 'percentage'}
                              onChange={(e) => setFormData({ ...formData, feeType: e.target.value as 'fixed' | 'percentage' })}
                              className="accent-blue-500"
                            />
                            <span className="text-gray-300">百分比</span>
                          </label>
                        </div>
                      </div>
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
      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-400/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <div className="text-3xl font-bold text-white">{currencies.length}</div>
                <div className="text-sm text-gray-400">币种总数</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-400/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <div className="text-3xl font-bold text-white">
                  {currencies.filter(c => c.status === 'active').length}
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
                <DollarSign className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <div className="text-3xl font-bold text-white">
                  {currencies.reduce((sum, c) => sum + c.maxAmount, 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-400">总限额 (USD)</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 币种列表 */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">电汇币种列表</CardTitle>
          <CardDescription className="text-gray-400">
            共 {currencies.length} 个币种
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-400">加载中...</div>
            </div>
          ) : currencies.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-400">暂无电汇币种</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-gray-400">币种</TableHead>
                    <TableHead className="text-gray-400">名称</TableHead>
                    <TableHead className="text-gray-400">最小金额</TableHead>
                    <TableHead className="text-gray-400">最大金额</TableHead>
                    <TableHead className="text-gray-400">手续费</TableHead>
                    <TableHead className="text-gray-400">状态</TableHead>
                    <TableHead className="text-gray-400 text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currencies.map((currency) => (
                    <TableRow key={currency.id} className="border-slate-700 hover:bg-slate-700/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-5 h-5 text-blue-400" />
                          <span className="text-gray-300 font-medium">{currency.code}</span>
                          <span className="text-gray-500">({currency.symbol})</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-gray-300">{currency.name}</div>
                          <div className="text-xs text-gray-500">{currency.nameEn}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-300">{currency.minAmount?.toLocaleString() || '0'}</TableCell>
                      <TableCell className="text-gray-300">{currency.maxAmount?.toLocaleString() || '0'}</TableCell>
                      <TableCell className="text-gray-300">
                        {currency.feeType === 'percentage' ? `${currency.fee ?? 0}%` : `${currency.fee ?? 0} ${currency.code || ''}`}
                      </TableCell>
                      <TableCell>{getStatusBadge(currency.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Switch
                            checked={currency.status === 'active'}
                            onCheckedChange={() => handleToggleStatus(currency)}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(currency)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(currency.id)}
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
