'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
  Copy,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import adminFetch from '@/lib/admin-fetch';

interface CryptoAddress {
  id: number;
  currency: string;
  protocol: string;
  network?: string;
  address: string;
  usdPrice: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

const CURRENCIES = ['USDT', 'ETH', 'BTC', 'SOL', 'BNB'] as const;

const PROTOCOLS = ['ERC20', 'TRC20', 'BEP20', 'SOL', 'BTC', 'ETH'] as const;

const STATUS_OPTIONS = [
  { value: 'active', label: '启用', color: 'bg-green-500' },
  { value: 'inactive', label: '禁用', color: 'bg-red-500' },
  { value: 'maintenance', label: '维护中', color: 'bg-yellow-500' },
] as const;

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
  const [copiedAddress, setCopiedAddress] = useState<number | null>(null);

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<CryptoAddress | null>(null);

  // Form data
  const [formData, setFormData] = useState<{
    currency: string;
    protocol: string;
    address: string;
    usdPrice: string;
    status: 'active' | 'inactive' | 'maintenance';
  }>({
    currency: '',
    protocol: '',
    address: '',
    usdPrice: '',
    status: 'active',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 防抖搜索
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setCurrentPage(1);
      fetchAddresses();
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  useEffect(() => {
    fetchAddresses();
  }, [currentPage, sortField, sortOrder]);

  const fetchAddresses = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminFetch(
        `/api/admin/wallet/crypto-addresses?page=${currentPage}&limit=${pageSize}&sort=${sortField}&order=${sortOrder}&search=${searchQuery}`
      );
      
      const data = await response.json();
      if (data.success) {
        setAddresses(data.addresses || []);
        setTotalCount(data.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch crypto addresses:', error);
      toast.error('获取数据失败，请刷新页面重试');
    } finally {
      setLoading(false);
    }
  }, [currentPage, sortField, sortOrder, searchQuery, pageSize]);

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
      console.error('Failed to delete crypto address:', error);
      toast.error('删除失败，请稍后重试');
    }
  };

  const handleCopyAddress = async (address: string, addressId: number) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(addressId);
      toast.success('地址已复制到剪贴板');
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (error) {
      console.error('Failed to copy address:', error);
      toast.error('复制失败，请手动复制');
    }
  };

  const handleToggleStatus = async (address: CryptoAddress) => {
    const newStatus = address.status === 'active' ? 'inactive' : 'active';
    
    try {
      const response = await adminFetch(`/api/admin/wallet/crypto-addresses/${address.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`状态已${newStatus === 'active' ? '启用' : '禁用'}`);
        fetchAddresses();
      } else {
        toast.error(data.error || '状态更新失败');
      }
    } catch (error) {
      console.error('Failed to toggle status:', error);
      toast.error('状态更新失败，请稍后重试');
    }
  };

  const handleCreate = async () => {
    // 验证必填字段
    if (!formData.currency) {
      toast.error('请选择品种');
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

    setIsSubmitting(true);
    try {
      const response = await adminFetch('/api/admin/wallet/crypto-addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          usdPrice: parseFloat(formData.usdPrice) || 0,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('创建成功');
        setIsCreateDialogOpen(false);
        resetForm();
        fetchAddresses();
      } else {
        toast.error(data.error || '创建失败');
      }
    } catch (error) {
      console.error('Failed to create crypto address:', error);
      toast.error('创建失败，请稍后重试');
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

    console.log('[CryptoAddresses] Editing address:', { id: selectedAddress.id, formData });
    setIsSubmitting(true);
    try {
      const response = await adminFetch(`/api/admin/wallet/crypto-addresses/${selectedAddress.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          usdPrice: parseFloat(formData.usdPrice) || 0,
        }),
      });

      console.log('[CryptoAddresses] Edit response:', response);
      const data = await response.json();
      console.log('[CryptoAddresses] Edit data:', data);
      
      if (data.success) {
        toast.success('更新成功');
        setIsEditDialogOpen(false);
        setSelectedAddress(null);
        resetForm();
        fetchAddresses();
      } else {
        toast.error(data.error || '更新失败');
      }
    } catch (error) {
      console.error('Failed to update crypto address:', error);
      toast.error('更新失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (address: CryptoAddress) => {
    setSelectedAddress(address);
    setFormData({
      currency: address.currency,
      protocol: address.protocol || '',
      address: address.address,
      usdPrice: address.usdPrice.toString(),
      status: (address.status || 'active') as 'active' | 'inactive' | 'maintenance',
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
      status: 'active' as const,
    });
  };

  const formatPrice = (value: number) => {
    return value.toFixed(8);
  };

  const getStatusBadge = (status?: string) => {
    const statusInfo = STATUS_OPTIONS.find(s => s.value === status);
    if (!statusInfo) {
      return <Badge variant="secondary">未知</Badge>;
    }
    return (
      <Badge className={`${statusInfo.color} text-white`}>
        {statusInfo.label}
      </Badge>
    );
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
              placeholder="搜索品种、协议、地址..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
                    协议 <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.protocol}
                    onValueChange={(value) => setFormData({ ...formData, protocol: value })}
                  >
                    <SelectTrigger className="col-span-3 bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600 text-white">
                      {PROTOCOLS.map((protocol) => (
                        <SelectItem key={protocol} value={protocol}>
                          {protocol}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="address" className="text-right">
                    付款地址 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="address"
                    placeholder="付款地址"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="col-span-3 bg-slate-700 border-slate-600 text-white font-mono"
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
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="status" className="text-right">
                    状态
                  </Label>
                  <div className="col-span-3 flex items-center gap-2">
                    <Select
                      value={formData.status}
                      onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger className="w-full bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="—" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600 text-white">
                        {STATUS_OPTIONS.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      创建中...
                    </>
                  ) : (
                    '确认'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 数据表格 */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
              <span className="ml-2 text-gray-400">加载中...</span>
            </div>
          ) : (
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
                    <TableHead className="bg-slate-800 text-gray-400 whitespace-nowrap">状态</TableHead>
                    <TableHead className="bg-slate-800 text-gray-400 whitespace-nowrap w-48">操作</TableHead>
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
                      <TableCell className="text-gray-300 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs max-w-xs truncate" title={addr.address}>
                            {addr.address}
                          </span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-gray-400 hover:text-white"
                                  onClick={() => handleCopyAddress(addr.address, addr.id)}
                                >
                                  {copiedAddress === addr.id ? (
                                    <CheckCircle2 className="w-3 h-3 text-green-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{copiedAddress === addr.id ? '已复制' : '复制地址'}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-400 whitespace-nowrap font-mono text-xs">{formatPrice(addr.usdPrice)}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getStatusBadge(addr.status)}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Switch
                                  checked={addr.status === 'active'}
                                  onCheckedChange={() => handleToggleStatus(addr)}
                                  className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500"
                                />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{addr.status === 'active' ? '点击禁用' : '点击启用'}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex gap-1">
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
          )}

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
                协议 <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.protocol}
                onValueChange={(value) => setFormData({ ...formData, protocol: value })}
              >
                <SelectTrigger className="col-span-3 bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600 text-white">
                  {PROTOCOLS.map((protocol) => (
                    <SelectItem key={protocol} value={protocol}>
                      {protocol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-address" className="text-right">
                付款地址 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-address"
                placeholder="付款地址"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="col-span-3 bg-slate-700 border-slate-600 text-white font-mono"
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
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-status" className="text-right">
                状态
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Select
                  value={formData.status}
                  onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger className="w-full bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600 text-white">
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  更新中...
                </>
              ) : (
                '确认'
              )}
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
                <div className="col-span-3 text-white font-medium">{selectedAddress.currency}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-gray-400">协议</Label>
                <div className="col-span-3 text-white">{selectedAddress.protocol}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-gray-400">付款地址</Label>
                <div className="col-span-3">
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-slate-700 px-3 py-2 rounded text-sm font-mono break-all">
                      {selectedAddress.address}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-white"
                      onClick={() => handleCopyAddress(selectedAddress.address, selectedAddress.id)}
                    >
                      {copiedAddress === selectedAddress.id ? (
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-gray-400">USD价格</Label>
                <div className="col-span-3 text-white font-mono">{formatPrice(selectedAddress.usdPrice)}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-gray-400">状态</Label>
                <div className="col-span-3">{getStatusBadge(selectedAddress.status)}</div>
              </div>
              {selectedAddress.createdAt && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right text-gray-400">创建时间</Label>
                  <div className="col-span-3 text-white text-sm">
                    {new Date(selectedAddress.createdAt).toLocaleString('zh-CN')}
                  </div>
                </div>
              )}
              {selectedAddress.updatedAt && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right text-gray-400">更新时间</Label>
                  <div className="col-span-3 text-white text-sm">
                    {new Date(selectedAddress.updatedAt).toLocaleString('zh-CN')}
                  </div>
                </div>
              )}
              {selectedAddress.createdBy && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right text-gray-400">创建者</Label>
                  <div className="col-span-3 text-white">{selectedAddress.createdBy}</div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsViewDialogOpen(false);
                setSelectedAddress(null);
              }}
              className="border-slate-600 hover:bg-slate-700"
            >
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
