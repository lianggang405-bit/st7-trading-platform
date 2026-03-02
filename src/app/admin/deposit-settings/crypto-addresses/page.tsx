'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Plus,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import adminFetch from '@/lib/admin-fetch';

interface CryptoAddress {
  id: number;
  currency: string;
  protocol: string;
  address: string;
  memo?: string;
  status: 'active' | 'inactive';
  usdPrice: number;
  createdAt: string;
  updatedAt: string;
}

// 常见的数字货币和协议
const CURRENCY_OPTIONS = [
  { value: 'USDT', label: 'USDT' },
  { value: 'BTC', label: 'BTC' },
  { value: 'ETH', label: 'ETH' },
  { value: 'BNB', label: 'BNB' },
  { value: 'SOL', label: 'SOL' },
  { value: 'XRP', label: 'XRP' },
  { value: 'DOGE', label: 'DOGE' },
];

const PROTOCOL_OPTIONS: Record<string, string[]> = {
  USDT: ['ERC20', 'TRC20', 'BEP20', 'OMNI'],
  BTC: ['BTC', 'BRC-20'],
  ETH: ['ERC20', 'ETH'],
  BNB: ['BEP20', 'BSC'],
  SOL: ['SOL', 'SPL'],
  XRP: ['XRP'],
  DOGE: ['DOGE', 'BEP20', 'ERC20'],
};

export default function CryptoAddressesPage() {
  const [addresses, setAddresses] = useState<CryptoAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAddresses, setSelectedAddresses] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(15);
  const [totalCount, setTotalCount] = useState(0);
  
  // 创建对话框状态
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    currency: '',
    protocol: '',
    address: '',
    usdPrice: 1,
    status: 'active' as 'active' | 'inactive',
  });

  useEffect(() => {
    fetchAddresses();
  }, [currentPage]);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const response = await adminFetch(
        `/api/admin/wallet/crypto-addresses?page=${currentPage}&limit=${pageSize}&search=${searchQuery}`
      );
      const data = await response.json();
      if (data.success) {
        setAddresses(data.addresses || []);
        setTotalCount(data.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch crypto addresses:', error);
      toast.error('获取数字货币地址列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchAddresses();
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAddresses(new Set(addresses.map(a => a.id)));
    } else {
      setSelectedAddresses(new Set());
    }
  };

  const handleSelectAddress = (addressId: number, checked: boolean) => {
    const newSelected = new Set(selectedAddresses);
    if (checked) {
      newSelected.add(addressId);
    } else {
      newSelected.delete(addressId);
    }
    setSelectedAddresses(newSelected);
  };

  const handleView = (address: CryptoAddress) => {
    toast.info(`查看地址详情：${address.address}`);
  };

  const handleEdit = (address: CryptoAddress) => {
    setDialogMode('edit');
    setEditingId(address.id);
    setFormData({
      currency: address.currency,
      protocol: address.protocol,
      address: address.address,
      usdPrice: address.usdPrice,
      status: address.status,
    });
    setDialogOpen(true);
  };

  const handleToggleStatus = async (address: CryptoAddress) => {
    const newStatus = address.status === 'active' ? 'inactive' : 'active';
    try {
      const response = await adminFetch(`/api/admin/wallet/crypto-addresses/${address.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(newStatus === 'active' ? '已启用' : '已禁用');
        fetchAddresses();
      } else {
        toast.error(data.error || '状态更新失败');
      }
    } catch (error) {
      console.error('Failed to toggle status:', error);
      toast.error('状态更新失败');
    }
  };

  const handleDelete = async (addressId: number) => {
    if (!confirm('确定要删除此数字货币地址吗？')) return;

    try {
      const response = await adminFetch(`/api/admin/wallet/crypto-addresses/${addressId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        toast.success('删除成功');
        fetchAddresses();
      } else {
        toast.error(data.error || '删除失败');
      }
    } catch (error) {
      console.error('Failed to delete address:', error);
      toast.error('删除失败');
    }
  };

  const handleBatchDelete = async () => {
    if (selectedAddresses.size === 0) {
      toast.warning('请选择要删除的记录');
      return;
    }

    if (!confirm(`确定要删除选中的 ${selectedAddresses.size} 条记录吗？`)) return;

    try {
      for (const addressId of selectedAddresses) {
        await adminFetch(`/api/admin/wallet/crypto-addresses/${addressId}`, {
          method: 'DELETE',
        });
      }

      toast.success('批量删除成功');
      setSelectedAddresses(new Set());
      fetchAddresses();
    } catch (error) {
      console.error('Failed to batch delete:', error);
      toast.error('批量删除失败');
    }
  };

  const handleOpenCreateDialog = () => {
    setDialogMode('create');
    setEditingId(null);
    setDialogOpen(true);
    setFormData({
      currency: '',
      protocol: '',
      address: '',
      usdPrice: 1,
      status: 'active',
    });
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setFormData({
      currency: '',
      protocol: '',
      address: '',
      usdPrice: 1,
      status: 'active',
    });
    setEditingId(null);
  };

  const handleSubmit = async () => {
    // 验证表单
    if (!formData.currency) {
      toast.error('请选择币种');
      return;
    }
    if (!formData.protocol) {
      toast.error('请选择协议');
      return;
    }
    if (!formData.address) {
      toast.error('请输入付款地址');
      return;
    }
    if (formData.usdPrice <= 0) {
      toast.error('USD价格必须大于0');
      return;
    }

    setIsSubmitting(true);
    try {
      if (dialogMode === 'create') {
        // 创建新地址
        const response = await adminFetch('/api/admin/wallet/crypto-addresses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const data = await response.json();
        if (data.success) {
          toast.success('地址添加成功');
          handleCloseDialog();
          fetchAddresses();
        } else {
          toast.error(data.error || '添加失败');
        }
      } else {
        // 更新现有地址
        const response = await adminFetch(`/api/admin/wallet/crypto-addresses/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const data = await response.json();
        if (data.success) {
          toast.success('地址更新成功');
          handleCloseDialog();
          fetchAddresses();
        } else {
          toast.error(data.error || '更新失败');
        }
      }
    } catch (error) {
      console.error('Failed to save address:', error);
      toast.error(dialogMode === 'create' ? '添加失败' : '更新失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCurrencyChange = (value: string) => {
    setFormData({
      ...formData,
      currency: value,
      protocol: '', // 重置协议选择
    });
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  const getStatusButton = (address: CryptoAddress) => {
    const isActive = address.status === 'active';
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleToggleStatus(address)}
        className={`h-7 px-2 ${
          isActive
            ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
            : 'bg-gray-500/10 text-gray-400 hover:bg-gray-500/20'
        }`}
      >
        {isActive ? '启用' : '禁用'}
      </Button>
    );
  };

  return (
    <div className="space-y-6">
      {/* 页面标题和面包屑 */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <span>资源</span>
          <span>/</span>
          <span className="text-gray-900 font-medium">数字货币地址设置</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">数字货币地址设置</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          {/* 搜索和操作栏 */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="搜索品种、协议、地址"
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
              {selectedAddresses.size > 0 && (
                <Button variant="destructive" onClick={handleBatchDelete}>
                  批量删除 ({selectedAddresses.size})
                </Button>
              )}
              <Button onClick={handleOpenCreateDialog} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                创建 数字货币地址设置
              </Button>
            </div>
          </div>

          {/* 表格 */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300"
                      checked={addresses.length > 0 && selectedAddresses.size === addresses.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </TableHead>
                  <TableHead className="w-20">ID</TableHead>
                  <TableHead>品种</TableHead>
                  <TableHead>协议</TableHead>
                  <TableHead>付款地址</TableHead>
                  <TableHead className="w-32">USD价格</TableHead>
                  <TableHead className="w-24">状态</TableHead>
                  <TableHead className="w-32">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {addresses.map((addr) => (
                  <TableRow key={addr.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-gray-300"
                        checked={selectedAddresses.has(addr.id)}
                        onChange={(e) => handleSelectAddress(addr.id, e.target.checked)}
                      />
                    </TableCell>
                    <TableCell className="text-gray-600">{addr.id}</TableCell>
                    <TableCell className="font-medium">{addr.currency}</TableCell>
                    <TableCell className="text-gray-600">{addr.protocol}</TableCell>
                    <TableCell className="font-mono text-sm">
                      <div className="flex items-center gap-2">
                        <span className="truncate max-w-xs">{addr.address}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => {
                            navigator.clipboard.writeText(addr.address);
                            toast.success('地址已复制');
                          }}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600">{addr.usdPrice}</TableCell>
                    <TableCell>{getStatusButton(addr)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleView(addr)}>
                            <Eye className="mr-2 h-4 w-4" />
                            查看详情
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(addr)}>
                            <Edit className="mr-2 h-4 w-4" />
                            编辑
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(addr.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            删除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {addresses.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      暂无数据
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600">
                显示 {Math.min((currentPage - 1) * pageSize + 1, totalCount)}-
                {Math.min(currentPage * pageSize, totalCount)} 共 {totalCount} 条
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  上一页
                </Button>
                <span className="text-sm text-gray-600">
                  第 {currentPage} / {totalPages} 页
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 创建/编辑对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'create' ? '创建数字货币地址' : '编辑数字货币地址'}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === 'create' 
                ? '配置新的数字货币收款地址信息'
                : '修改数字货币收款地址信息'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="currency" className="text-right">
                币种
              </Label>
              <Select 
                value={formData.currency} 
                onValueChange={handleCurrencyChange}
                disabled={dialogMode === 'edit'}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="选择币种" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="protocol" className="text-right">
                协议
              </Label>
              <Select 
                value={formData.protocol} 
                onValueChange={(value) => setFormData({ ...formData, protocol: value })}
                disabled={!formData.currency}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={formData.currency ? '选择协议' : '请先选择币种'} />
                </SelectTrigger>
                <SelectContent>
                  {formData.currency && PROTOCOL_OPTIONS[formData.currency]?.map((protocol) => (
                    <SelectItem key={protocol} value={protocol}>
                      {protocol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address" className="text-right">
                付款地址
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="输入钱包地址"
                className="col-span-3 font-mono text-sm"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="usdPrice" className="text-right">
                USD价格
              </Label>
              <Input
                id="usdPrice"
                type="number"
                step="0.01"
                min="0"
                value={formData.usdPrice}
                onChange={(e) => setFormData({ ...formData, usdPrice: parseFloat(e.target.value) || 0 })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                状态
              </Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: 'active' | 'inactive') => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">启用</SelectItem>
                  <SelectItem value="inactive">禁用</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? '提交中...' : (dialogMode === 'create' ? '创建' : '保存')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
