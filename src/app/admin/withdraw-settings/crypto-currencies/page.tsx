'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import {
  Search,
  Plus,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  ChevronUp,
  ChevronDown,
  Wallet,
  X,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

interface DigitalCurrencyCurrency {
  id: number;
  currency: string;
  network: string;
  minAmount: number;
  maxAmount: number;
  fee: number;
  feeType: 'fixed' | 'percentage';
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export default function CryptoCurrenciesPage() {
  const [currencies, setCurrencies] = useState<DigitalCurrencyCurrency[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedCurrencies, setSelectedCurrencies] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(15);
  const [totalCount, setTotalCount] = useState(0);

  // 对话框状态
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<DigitalCurrencyCurrency | null>(null);
  const [viewingCurrency, setViewingCurrency] = useState<DigitalCurrencyCurrency | null>(null);

  // 表单状态
  const [formData, setFormData] = useState({
    currency: '',
    network: '',
    fee: 0,
    minAmount: 0,
    maxAmount: 10000000,
    status: 'active' as 'active' | 'inactive',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCurrencies();
  }, [currentPage, sortField, sortOrder]);

  const fetchCurrencies = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/withdraw-settings/crypto-currencies?page=${currentPage}&pageSize=${pageSize}&sortBy=${sortField}&sortOrder=${sortOrder}&search=${searchQuery}`
      );
      const data = await response.json();
      if (response.ok && data.success) {
        setCurrencies(data.currencies || []);
        setTotalCount(data.total || 0);
      } else {
        toast.error(data.error || '获取数字货币币种列表失败');
      }
    } catch (error) {
      console.error('Failed to fetch digital currency currencies:', error);
      toast.error('获取数字货币币种列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchCurrencies();
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    fetchCurrencies();
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCurrencies(new Set(currencies.map(c => c.id)));
    } else {
      setSelectedCurrencies(new Set());
    }
  };

  const handleSelectCurrency = (currencyId: number, checked: boolean) => {
    const newSelected = new Set(selectedCurrencies);
    if (checked) {
      newSelected.add(currencyId);
    } else {
      newSelected.delete(currencyId);
    }
    setSelectedCurrencies(newSelected);
  };

  const handleDelete = async (currencyId: number) => {
    if (!confirm('确定要删除此数字货币币种设置吗？')) return;

    try {
      const response = await fetch(`/api/admin/withdraw-settings/crypto-currencies/${currencyId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('删除成功');
        fetchCurrencies();
      } else {
        const data = await response.json();
        toast.error(data.error || '删除失败');
      }
    } catch (error) {
      console.error('Failed to delete digital currency currency:', error);
      toast.error('删除失败');
    }
  };

  const handleBatchDelete = async () => {
    if (selectedCurrencies.size === 0) {
      toast.warning('请选择要删除的记录');
      return;
    }

    if (!confirm(`确定要删除选中的 ${selectedCurrencies.size} 条记录吗？`)) return;

    try {
      for (const currencyId of selectedCurrencies) {
        await fetch(`/api/admin/withdraw-settings/crypto-currencies/${currencyId}`, {
          method: 'DELETE',
        });
      }

      toast.success('批量删除成功');
      setSelectedCurrencies(new Set());
      fetchCurrencies();
    } catch (error) {
      console.error('Failed to batch delete:', error);
      toast.error('批量删除失败');
    }
  };

  // 打开创建对话框
  const handleOpenCreateDialog = () => {
    setFormData({
      currency: '',
      network: '',
      fee: 0,
      minAmount: 0,
      maxAmount: 10000000,
      status: 'active',
    });
    setIsCreateDialogOpen(true);
  };

  // 打开编辑对话框
  const handleOpenEditDialog = async (currencyId: number) => {
    try {
      const response = await fetch(`/api/admin/withdraw-settings/crypto-currencies/${currencyId}`);
      const data = await response.json();
      if (response.ok && data.success) {
        setEditingCurrency(data.currency);
        setFormData({
          currency: data.currency.currency,
          network: data.currency.network,
          fee: data.currency.fee,
          minAmount: data.currency.minAmount,
          maxAmount: data.currency.maxAmount,
          status: data.currency.status,
        });
        setIsEditDialogOpen(true);
      } else {
        toast.error(data.error || '获取详情失败');
      }
    } catch (error) {
      console.error('Failed to fetch currency details:', error);
      toast.error('获取详情失败');
    }
  };

  // 打开查看对话框
  const handleOpenViewDialog = async (currencyId: number) => {
    try {
      const response = await fetch(`/api/admin/withdraw-settings/crypto-currencies/${currencyId}`);
      const data = await response.json();
      if (response.ok && data.success) {
        setViewingCurrency({
          id: data.currency.id,
          currency: data.currency.currency,
          network: data.currency.network,
          minAmount: data.currency.minAmount,
          maxAmount: data.currency.maxAmount,
          fee: data.currency.fee,
          feeType: data.currency.feeType,
          status: data.currency.status,
          created_at: data.currency.created_at,
          updated_at: data.currency.updated_at,
        });
        setIsViewDialogOpen(true);
      } else {
        toast.error(data.error || '获取详情失败');
      }
    } catch (error) {
      console.error('Failed to fetch currency details:', error);
      toast.error('获取详情失败');
    }
  };

  // 提交创建
  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/withdraw-settings/crypto-currencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currency: formData.currency,
          network: formData.network,
          minAmount: formData.minAmount,
          maxAmount: formData.maxAmount,
          fee: formData.fee,
          status: formData.status,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success('创建成功');
          setIsCreateDialogOpen(false);
          fetchCurrencies();
        } else {
          toast.error(data.error || '创建失败');
        }
      } else {
        const data = await response.json();
        toast.error(data.error || '创建失败');
      }
    } catch (error) {
      console.error('Failed to create currency:', error);
      toast.error('创建失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 提交编辑
  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCurrency) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/admin/withdraw-settings/crypto-currencies/${editingCurrency.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currency: formData.currency,
          network: formData.network,
          minAmount: formData.minAmount,
          maxAmount: formData.maxAmount,
          fee: formData.fee,
          status: formData.status,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success('更新成功');
          setIsEditDialogOpen(false);
          fetchCurrencies();
        } else {
          toast.error(data.error || '更新失败');
        }
      } else {
        const data = await response.json();
        toast.error(data.error || '更新失败');
      }
    } catch (error) {
      console.error('Failed to update currency:', error);
      toast.error('更新失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6">
      {/* 页面标题和面包屑 */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <span>资源</span>
          <span>/</span>
          <span className="text-gray-900 font-medium">数字货币币种设置</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">数字货币币种设置</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          {/* 搜索和操作栏 */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="搜索品种、协议"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleSearch} variant="outline">
                搜索
              </Button>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              {selectedCurrencies.size > 0 && (
                <Button variant="destructive" onClick={handleBatchDelete}>
                  批量删除 ({selectedCurrencies.size})
                </Button>
              )}
              <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleOpenCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                创建 数字货币币种设置
              </Button>
            </div>
          </div>

          {/* 表格 */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300"
                      checked={selectedCurrencies.size === currencies.length && currencies.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('id')}
                  >
                    <div className="flex items-center gap-1">
                      ID
                      {sortField === 'id' && (
                        sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>品种</TableHead>
                  <TableHead>协议</TableHead>
                  <TableHead>兑USD汇率</TableHead>
                  <TableHead>提币费率</TableHead>
                  <TableHead>最小提币数量</TableHead>
                  <TableHead>最大提币数量</TableHead>
                  <TableHead>是否展示</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : currencies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-16">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                          <Wallet className="h-8 w-8 text-gray-400" />
                        </div>
                        <div className="text-center">
                          <p className="text-gray-500 mb-1">数字货币币种设置不符合给定的标准。</p>
                          <Button onClick={handleOpenCreateDialog} className="mt-2">
                            <Plus className="h-4 w-4 mr-2" />
                            创建 数字货币币种设置
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  currencies.map((currency) => (
                    <TableRow key={currency.id} className="hover:bg-gray-50">
                      <TableCell>
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-gray-300"
                          checked={selectedCurrencies.has(currency.id)}
                          onChange={(e) => handleSelectCurrency(currency.id, e.target.checked)}
                        />
                      </TableCell>
                      <TableCell className="font-mono">{currency.id}</TableCell>
                      <TableCell className="font-medium">{currency.currency}</TableCell>
                      <TableCell>{currency.network}</TableCell>
                      <TableCell>1.00</TableCell>
                      <TableCell>{currency.fee.toFixed(2)}</TableCell>
                      <TableCell>{currency.minAmount.toFixed(6)}</TableCell>
                      <TableCell>{currency.maxAmount.toFixed(2)}</TableCell>
                      <TableCell>
                        {currency.status === 'active' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            是
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            否
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleOpenViewDialog(currency.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleOpenEditDialog(currency.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(currency.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-500">
                {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalCount)} of {totalCount}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  上一页
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 创建对话框 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>创建数字货币币种设置</DialogTitle>
            <DialogDescription>
              创建新的数字货币币种配置，用于前端提币功能。
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitCreate}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">
                    品种 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="currency"
                    placeholder="例如：USDT"
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="network">
                    协议 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="network"
                    placeholder="例如：ERC-20"
                    value={formData.network}
                    onChange={(e) => setFormData({ ...formData, network: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fee">提币费率</Label>
                  <Input
                    id="fee"
                    type="number"
                    step="0.01"
                    value={formData.fee}
                    onChange={(e) => setFormData({ ...formData, fee: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">状态</Label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="active">启用</option>
                    <option value="inactive">禁用</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minAmount">
                    最小提币数量 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="minAmount"
                    type="number"
                    step="0.000001"
                    value={formData.minAmount}
                    onChange={(e) => setFormData({ ...formData, minAmount: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxAmount">
                    最大提币数量 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="maxAmount"
                    type="number"
                    step="0.000001"
                    value={formData.maxAmount}
                    onChange={(e) => setFormData({ ...formData, maxAmount: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                取消
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                创建
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 编辑对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>编辑数字货币币种设置</DialogTitle>
            <DialogDescription>
              修改数字货币币种配置信息。
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-currency">
                    品种 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-currency"
                    placeholder="例如：USDT"
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-network">
                    协议 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-network"
                    placeholder="例如：ERC-20"
                    value={formData.network}
                    onChange={(e) => setFormData({ ...formData, network: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-fee">提币费率</Label>
                  <Input
                    id="edit-fee"
                    type="number"
                    step="0.01"
                    value={formData.fee}
                    onChange={(e) => setFormData({ ...formData, fee: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">状态</Label>
                  <select
                    id="edit-status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="active">启用</option>
                    <option value="inactive">禁用</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-minAmount">
                    最小提币数量 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-minAmount"
                    type="number"
                    step="0.000001"
                    value={formData.minAmount}
                    onChange={(e) => setFormData({ ...formData, minAmount: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-maxAmount">
                    最大提币数量 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-maxAmount"
                    type="number"
                    step="0.000001"
                    value={formData.maxAmount}
                    onChange={(e) => setFormData({ ...formData, maxAmount: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                取消
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                保存
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 查看详情对话框 */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>数字货币币种设置详情</DialogTitle>
            <DialogDescription>
              查看数字货币币种配置的详细信息。
            </DialogDescription>
          </DialogHeader>
          {viewingCurrency && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">ID</Label>
                  <p className="font-mono mt-1">{viewingCurrency.id}</p>
                </div>
                <div>
                  <Label className="text-gray-500">品种</Label>
                  <p className="font-medium mt-1">{viewingCurrency.currency}</p>
                </div>
              </div>
              <div>
                <Label className="text-gray-500">协议</Label>
                <p className="mt-1">{viewingCurrency.network}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">兑USD汇率</Label>
                  <p className="mt-1">1.00</p>
                </div>
                <div>
                  <Label className="text-gray-500">提币费率</Label>
                  <p className="mt-1">{viewingCurrency.fee.toFixed(2)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">最小提币数量</Label>
                  <p className="mt-1">{viewingCurrency.minAmount.toFixed(6)}</p>
                </div>
                <div>
                  <Label className="text-gray-500">最大提币数量</Label>
                  <p className="mt-1">{viewingCurrency.maxAmount.toFixed(6)}</p>
                </div>
              </div>
              <div>
                <Label className="text-gray-500">是否展示</Label>
                <p className="mt-1">
                  {viewingCurrency.status === 'active' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      是
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      否
                    </span>
                  )}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">创建时间</Label>
                  <p className="mt-1 text-sm">
                    {new Date(viewingCurrency.created_at).toLocaleString('zh-CN')}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500">更新时间</Label>
                  <p className="mt-1 text-sm">
                    {new Date(viewingCurrency.updated_at).toLocaleString('zh-CN')}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" onClick={() => setIsViewDialogOpen(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
