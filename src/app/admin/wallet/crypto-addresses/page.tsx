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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
} from 'lucide-react';
import { toast } from 'sonner';

interface CryptoAddress {
  id: number;
  currency: string;
  protocol: string;
  address: string;
  usdPrice: number;
}

const CURRENCIES = ['USDT', 'ETH', 'BTC'] as const;

export default function CryptoAddressesPage() {
  const [addresses, setAddresses] = useState<CryptoAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedAddresses, setSelectedAddresses] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(15);
  const [totalCount, setTotalCount] = useState(0);

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<CryptoAddress | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    currency: '',
    protocol: '',
    address: '',
    usdPrice: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAddresses();
  }, [currentPage, sortField, sortOrder]);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/wallet/crypto-addresses?page=${currentPage}&limit=${pageSize}&sort=${sortField}&order=${sortOrder}&search=${searchQuery}`
      );
      
      if (!response.ok) {
        console.error('Failed to fetch crypto addresses:', response.status, response.statusText);
        return;
      }
      
      const data = await response.json();
      if (data.success) {
        setAddresses(data.addresses || []);
        setTotalCount(data.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch crypto addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
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

  const handleDelete = async (addressId: number) => {
    if (!confirm('确定要删除此数字货币地址设置吗？')) return;

    try {
      const response = await fetch(`/api/admin/wallet/crypto-addresses/${addressId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        toast.error('网络错误，请稍后重试');
        return;
      }
      
      const data = await response.json();
      if (data.success) {
        toast.success('删除成功');
        fetchAddresses();
      } else {
        toast.error('删除失败');
      }
    } catch (error) {
      console.error('Failed to delete crypto address:', error);
      toast.error('删除失败');
    }
  };

  const handleCreate = async () => {
    // 验证必填字段
    if (!formData.currency) {
      toast.error('请选择品种');
      return;
    }
    if (!formData.address) {
      toast.error('请输入付款地址');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/wallet/crypto-addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          usdPrice: parseFloat(formData.usdPrice) || 0,
        }),
      });

      if (!response.ok) {
        toast.error('网络错误，请稍后重试');
        return;
      }

      const data = await response.json();
      if (data.success) {
        toast.success('创建成功');
        setIsCreateDialogOpen(false);
        resetForm();
        fetchAddresses();
      } else {
        toast.error(data.message || '创建失败');
      }
    } catch (error) {
      console.error('Failed to create crypto address:', error);
      toast.error('创建失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedAddress) return;

    // 验证必填字段
    if (!formData.currency) {
      toast.error('请选择品种');
      return;
    }
    if (!formData.address) {
      toast.error('请输入付款地址');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/wallet/crypto-addresses/${selectedAddress.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          usdPrice: parseFloat(formData.usdPrice) || 0,
        }),
      });

      if (!response.ok) {
        toast.error('网络错误，请稍后重试');
        return;
      }

      const data = await response.json();
      if (data.success) {
        toast.success('更新成功');
        setIsEditDialogOpen(false);
        setSelectedAddress(null);
        resetForm();
        fetchAddresses();
      } else {
        toast.error(data.message || '更新失败');
      }
    } catch (error) {
      console.error('Failed to update crypto address:', error);
      toast.error('更新失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (address: CryptoAddress) => {
    setSelectedAddress(address);
    setFormData({
      currency: address.currency,
      protocol: address.protocol,
      address: address.address,
      usdPrice: address.usdPrice.toString(),
    });
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (address: CryptoAddress) => {
    setSelectedAddress(address);
    setIsViewDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      currency: '',
      protocol: '',
      address: '',
      usdPrice: '',
    });
  };

  const formatPrice = (value: number) => {
    return value.toFixed(8);
  };

  return (
    <div className="space-y-6">
      {/* 面包屑导航 */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>资源</span> / <span className="text-white">数字货币地址设置</span>
      </div>

      {/* 页面标题和操作栏 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">数字货币地址设置</h1>
        <div className="flex gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="搜索"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchAddresses()}
              className="pl-9 bg-slate-700 border-slate-600 text-white"
            />
          </div>
          <Button variant="outline" size="icon" className="border-slate-600 hover:bg-slate-700">
            <Filter className="w-4 h-4" />
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                创建数字货币地址设置
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700 text-white">
              <DialogHeader>
                <DialogTitle>创建 数字货币地址设置</DialogTitle>
                <DialogDescription className="text-gray-400">
                  填写下方信息以创建新的数字货币地址配置。
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="currency" className="text-right">
                    品种 <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => setFormData({ ...formData, currency: value })}
                  >
                    <SelectTrigger className="col-span-3 bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600 text-white">
                      {CURRENCIES.map((currency) => (
                        <SelectItem key={currency} value={currency}>
                          {currency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="protocol" className="text-right">
                    协议
                  </Label>
                  <Input
                    id="protocol"
                    placeholder="协议"
                    value={formData.protocol}
                    onChange={(e) => setFormData({ ...formData, protocol: e.target.value })}
                    className="col-span-3 bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="address" className="text-right">
                    付款地址
                  </Label>
                  <Input
                    id="address"
                    placeholder="付款地址"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="col-span-3 bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="usdPrice" className="text-right">
                    USD价格
                  </Label>
                  <Input
                    id="usdPrice"
                    type="number"
                    step="0.00000001"
                    placeholder="USD价格"
                    value={formData.usdPrice}
                    onChange={(e) => setFormData({ ...formData, usdPrice: e.target.value })}
                    className="col-span-3 bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    resetForm();
                  }}
                  className="border-slate-600 hover:bg-slate-700"
                >
                  取消
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmitting ? '创建中...' : '确认'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 数据表格 */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700 hover:bg-slate-700/50">
                  <TableHead className="w-12 bg-slate-800 whitespace-nowrap">
                    <input
                      type="checkbox"
                      className="rounded border-gray-500 bg-slate-700"
                      checked={selectedAddresses.size === addresses.length && addresses.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </TableHead>
                  <TableHead className="bg-slate-800 text-gray-400 whitespace-nowrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-blue-400 hover:text-blue-300 whitespace-nowrap"
                      onClick={() => handleSort('id')}
                    >
                      ID
                      {sortField === 'id' && (
                        sortOrder === 'asc' ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="bg-slate-800 text-gray-400 whitespace-nowrap">品种</TableHead>
                  <TableHead className="bg-slate-800 text-gray-400 whitespace-nowrap">协议</TableHead>
                  <TableHead className="bg-slate-800 text-gray-400 whitespace-nowrap">付款地址</TableHead>
                  <TableHead className="bg-slate-800 text-gray-400 whitespace-nowrap">USD价格</TableHead>
                  <TableHead className="bg-slate-800 text-gray-400 whitespace-nowrap w-32">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {addresses.map((addr) => (
                  <TableRow key={addr.id} className="border-slate-700 hover:bg-slate-700/30">
                    <TableCell className="whitespace-nowrap">
                      <input
                        type="checkbox"
                        className="rounded border-gray-500 bg-slate-700"
                        checked={selectedAddresses.has(addr.id)}
                        onChange={(e) => handleSelectAddress(addr.id, e.target.checked)}
                      />
                    </TableCell>
                    <TableCell className="text-blue-400 font-medium whitespace-nowrap">{addr.id}</TableCell>
                    <TableCell className="text-blue-400 font-medium whitespace-nowrap">{addr.currency}</TableCell>
                    <TableCell className="text-gray-300 whitespace-nowrap">{addr.protocol}</TableCell>
                    <TableCell className="text-gray-300 whitespace-nowrap font-mono text-xs max-w-md truncate" title={addr.address}>{addr.address}</TableCell>
                    <TableCell className="text-gray-400 whitespace-nowrap font-mono text-xs">{formatPrice(addr.usdPrice)}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-white"
                          onClick={() => openViewDialog(addr)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-white"
                          onClick={() => openEditDialog(addr)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-red-400"
                          onClick={() => handleDelete(addr.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* 分页 */}
          <div className="flex items-center justify-between p-4 border-t border-slate-700">
            <div className="text-sm text-gray-400">
              {totalCount > 0 ? `${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, totalCount)} of ${totalCount}` : '0-0 of 0'}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="border-slate-600 hover:bg-slate-700"
              >
                上一页
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={addresses.length < pageSize}
                className="border-slate-600 hover:bg-slate-700"
              >
                下一页
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 编辑对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>编辑 数字货币地址设置</DialogTitle>
            <DialogDescription className="text-gray-400">
              修改下方信息以更新数字货币地址配置。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-currency" className="text-right">
                品种 <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger className="col-span-3 bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600 text-white">
                  {CURRENCIES.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-protocol" className="text-right">
                协议
              </Label>
              <Input
                id="edit-protocol"
                placeholder="协议"
                value={formData.protocol}
                onChange={(e) => setFormData({ ...formData, protocol: e.target.value })}
                className="col-span-3 bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-address" className="text-right">
                付款地址
              </Label>
              <Input
                id="edit-address"
                placeholder="付款地址"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="col-span-3 bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-usdPrice" className="text-right">
                USD价格
              </Label>
              <Input
                id="edit-usdPrice"
                type="number"
                step="0.00000001"
                placeholder="USD价格"
                value={formData.usdPrice}
                onChange={(e) => setFormData({ ...formData, usdPrice: e.target.value })}
                className="col-span-3 bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setSelectedAddress(null);
                resetForm();
              }}
              className="border-slate-600 hover:bg-slate-700"
            >
              取消
            </Button>
            <Button
              onClick={handleEdit}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? '更新中...' : '确认'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 查看对话框 */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>数字货币地址详情</DialogTitle>
          </DialogHeader>
          {selectedAddress && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-gray-400">ID</Label>
                <div className="col-span-3 text-white font-mono">{selectedAddress.id}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-gray-400">品种</Label>
                <div className="col-span-3 text-blue-400 font-medium">{selectedAddress.currency}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-gray-400">协议</Label>
                <div className="col-span-3 text-white">{selectedAddress.protocol}</div>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right text-gray-400">付款地址</Label>
                <div className="col-span-3 text-white font-mono text-xs break-all bg-slate-700 p-2 rounded">
                  {selectedAddress.address}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-gray-400">USD价格</Label>
                <div className="col-span-3 text-white font-mono">{formatPrice(selectedAddress.usdPrice)}</div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)} className="bg-blue-600 hover:bg-blue-700">
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
