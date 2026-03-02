'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Search, Plus, Filter, Eye, Edit, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { useToast } from '@/hooks/use-toast';

export interface WireCurrency {
  id: number;
  currencyName: string;
  usdPrice: number;
  createdAt?: string;
  updatedAt?: string;
}

interface ApiResponse {
  success: boolean;
  data?: WireCurrency[];
  records?: WireCurrency[];
  total?: number;
  page?: number;
  pageSize?: number;
  message?: string;
}

export default function WireCurrencySettingsPage() {
  const t = useTranslations();
  const router = useRouter();
  const { toast } = useToast();

  const [currencies, setCurrencies] = useState<WireCurrency[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [sortField, setSortField] = useState<'id' | 'currencyName' | 'usdPrice'>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    currencyName: '',
    usdPrice: 0,
  });

  const [selectedCurrency, setSelectedCurrency] = useState<WireCurrency | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Fetch currencies
  const fetchCurrencies = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
        sortField,
        sortOrder,
      });

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(`/api/admin/deposit/wire-currency?${params.toString()}`);
      const result: ApiResponse = await response.json();

      if (result.success) {
        const data = result.records || result.data || [];
        setCurrencies(data);
        setTotal(result.total || data.length);
      } else {
        toast({
          variant: 'destructive',
          title: t('admin.common.error'),
          description: result.message || t('admin.common.fetchFailed'),
        });
      }
    } catch (error) {
      console.error('Failed to fetch wire currencies:', error);
      toast({
        variant: 'destructive',
        title: t('admin.common.error'),
        description: t('admin.common.fetchFailed'),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrencies();
  }, [currentPage, sortField, sortOrder]);

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1);
    fetchCurrencies();
  };

  // Handle sort
  const handleSort = (field: 'id' | 'currencyName' | 'usdPrice') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Handle create
  const handleCreate = async () => {
    try {
      const response = await fetch('/api/admin/deposit/wire-currency', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result: ApiResponse = await response.json();

      if (result.success) {
        toast({
          title: t('admin.common.success'),
          description: t('admin.deposit.wireCurrencySettings.createSuccess'),
        });
        setIsCreateDialogOpen(false);
        setFormData({ currencyName: '', usdPrice: 0 });
        fetchCurrencies();
      } else {
        toast({
          variant: 'destructive',
          title: t('admin.common.error'),
          description: result.message || t('admin.common.createFailed'),
        });
      }
    } catch (error) {
      console.error('Failed to create currency:', error);
      toast({
        variant: 'destructive',
        title: t('admin.common.error'),
        description: t('admin.common.createFailed'),
      });
    }
  };

  // Handle edit
  const handleEdit = async () => {
    if (!selectedCurrency) return;

    try {
      const response = await fetch(`/api/admin/deposit/wire-currency/${selectedCurrency.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result: ApiResponse = await response.json();

      if (result.success) {
        toast({
          title: t('admin.common.success'),
          description: t('admin.deposit.wireCurrencySettings.updateSuccess'),
        });
        setIsEditDialogOpen(false);
        setSelectedCurrency(null);
        setFormData({ currencyName: '', usdPrice: 0 });
        fetchCurrencies();
      } else {
        toast({
          variant: 'destructive',
          title: t('admin.common.error'),
          description: result.message || t('admin.common.updateFailed'),
        });
      }
    } catch (error) {
      console.error('Failed to update currency:', error);
      toast({
        variant: 'destructive',
        title: t('admin.common.error'),
        description: t('admin.common.updateFailed'),
      });
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedCurrency) return;

    try {
      const response = await fetch(`/api/admin/deposit/wire-currency/${selectedCurrency.id}`, {
        method: 'DELETE',
      });

      const result: ApiResponse = await response.json();

      if (result.success) {
        toast({
          title: t('admin.common.success'),
          description: t('admin.deposit.wireCurrencySettings.deleteSuccess'),
        });
        setIsDeleteDialogOpen(false);
        setSelectedCurrency(null);
        fetchCurrencies();
      } else {
        toast({
          variant: 'destructive',
          title: t('admin.common.error'),
          description: result.message || t('admin.common.deleteFailed'),
        });
      }
    } catch (error) {
      console.error('Failed to delete currency:', error);
      toast({
        variant: 'destructive',
        title: t('admin.common.error'),
        description: t('admin.common.deleteFailed'),
      });
    }
  };

  // Handle batch delete
  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;

    try {
      const response = await fetch('/api/admin/deposit/wire-currency/batch', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: selectedIds }),
      });

      const result: ApiResponse = await response.json();

      if (result.success) {
        toast({
          title: t('admin.common.success'),
          description: t('admin.deposit.wireCurrencySettings.batchDeleteSuccess'),
        });
        setSelectedIds([]);
        fetchCurrencies();
      } else {
        toast({
          variant: 'destructive',
          title: t('admin.common.error'),
          description: result.message || t('admin.common.deleteFailed'),
        });
      }
    } catch (error) {
      console.error('Failed to batch delete currencies:', error);
      toast({
        variant: 'destructive',
        title: t('admin.common.error'),
        description: t('admin.common.deleteFailed'),
      });
    }
  };

  // Open edit dialog
  const openEditDialog = (currency: WireCurrency) => {
    setSelectedCurrency(currency);
    setFormData({
      currencyName: currency.currencyName,
      usdPrice: currency.usdPrice,
    });
    setIsEditDialogOpen(true);
  };

  // Open delete dialog
  const openDeleteDialog = (currency: WireCurrency) => {
    setSelectedCurrency(currency);
    setIsDeleteDialogOpen(true);
  };

  // Open view dialog
  const openViewDialog = (currency: WireCurrency) => {
    setSelectedCurrency(currency);
    setIsViewDialogOpen(true);
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(currencies.map(c => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  // Handle select single
  const handleSelectSingle = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(itemId => itemId !== id));
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-screen border-r border-border bg-card">
          <div className="p-4">
            <nav className="space-y-2">
              {/* 主页 */}
              <button className="flex items-center justify-between w-full px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span>主页</span>
                </div>
              </button>

              {/* 设置 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center justify-between w-full px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>设置</span>
                    </div>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuItem onClick={() => router.push('/admin/settings/system')}>
                    系统设置
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/admin/settings/security')}>
                    安全设置
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* 用户管理 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center justify-between w-full px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <span>用户管理</span>
                    </div>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuItem onClick={() => router.push('/admin/users')}>
                    用户列表
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/admin/kyc')}>
                    实名管理
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/admin/demo-accounts')}>
                    模拟账户
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/admin/user-levels')}>
                    用户等级
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* 品种交易 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center justify-between w-full px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      <span>品种交易</span>
                    </div>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuItem onClick={() => router.push('/admin/trading/symbols')}>
                    品种管理
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/admin/trading/fee-rates')}>
                    费率设置
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* 信息管理 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center justify-between w-full px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>信息管理</span>
                    </div>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuItem onClick={() => router.push('/admin/info/announcements')}>
                    公告管理
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/admin/info/help-center')}>
                    帮助中心
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* 合约设置 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center justify-between w-full px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <span>合约设置</span>
                    </div>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuItem onClick={() => router.push('/admin/contract/leverage')}>
                    倍数设置
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/admin/contract/orders')}>
                    合约订单
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/admin/contract/demo-orders')}>
                    模拟合约订单
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* 秒合约设置 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center justify-between w-full px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>秒合约设置</span>
                    </div>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuItem onClick={() => router.push('/admin/flash-contract/trading')}>
                    秒合约交易
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/admin/flash-contract/demo-trading')}>
                    模拟秒合约交易
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/admin/flash-contract/durations')}>
                    秒数设置
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* 钱包 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center justify-between w-full px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      <span>钱包</span>
                    </div>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuItem onClick={() => router.push('/admin/wallet/user-wallets')}>
                    用户钱包
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/admin/wallet/financial-records')}>
                    财务记录
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* 充币设置 */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 px-3 py-1 text-sm font-medium text-primary">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>充币设置</span>
                  <ChevronUp className="w-4 h-4 ml-auto" />
                </div>
                <div className="ml-4 space-y-1">
                  <button
                    onClick={() => router.push('/admin/deposit/wire-currency-settings')}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-primary bg-accent rounded-md transition-colors"
                  >
                    <span>•</span>
                    <span>电汇币种设置</span>
                  </button>
                  <button
                    onClick={() => router.push('/admin/deposit/wire-info-settings')}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
                  >
                    <span>•</span>
                    <span>电汇信息设置</span>
                  </button>
                  <button
                    onClick={() => router.push('/admin/deposit/crypto-address-settings')}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
                  >
                    <span>•</span>
                    <span>数字货币地址设置</span>
                  </button>
                  <button
                    onClick={() => router.push('/admin/deposit/crypto-applications')}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
                  >
                    <span>•</span>
                    <span>充币申请</span>
                  </button>
                  <button
                    onClick={() => router.push('/admin/deposit/bank-applications')}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
                  >
                    <span>•</span>
                    <span>银行卡充币申请</span>
                  </button>
                </div>
              </div>

              {/* 提币设置 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center justify-between w-full px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>提币设置</span>
                    </div>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuItem onClick={() => router.push('/admin/withdraw/crypto-currency-settings')}>
                    数字货币币种设置
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/admin/withdraw/fiat-currency-settings')}>
                    支持法币设置
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/admin/withdraw/crypto-applications')}>
                    提币申请
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/admin/withdraw/bank-applications')}>
                    银行卡提币申请
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* 管理员 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center justify-between w-full px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <span>管理员</span>
                    </div>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuItem onClick={() => router.push('/admin/admins')}>
                    管理员列表
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <span>资源</span>
            <span>/</span>
            <span className="text-foreground">电汇币种设置</span>
          </div>

          {/* Page Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-foreground">电汇币种设置</h1>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="搜索"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10 w-64"
                />
              </div>
              <Button onClick={handleSearch} size="sm">
                搜索
              </Button>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-2" />
                    创建 电汇币种设置
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>创建电汇币种设置</DialogTitle>
                    <DialogDescription>
                      填写下方信息以创建新的电汇币种配置。
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="currencyName">币种名称</Label>
                      <Input
                        id="currencyName"
                        placeholder="例如: USDT"
                        value={formData.currencyName}
                        onChange={(e) => setFormData({ ...formData, currencyName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="usdPrice">USD价格</Label>
                      <Input
                        id="usdPrice"
                        type="number"
                        step="0.00000001"
                        placeholder="0"
                        value={formData.usdPrice}
                        onChange={(e) => setFormData({ ...formData, usdPrice: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      取消
                    </Button>
                    <Button onClick={handleCreate}>创建</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Table */}
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="flex items-center gap-1">
                            <Checkbox
                              checked={selectedIds.length === currencies.length && currencies.length > 0}
                              onCheckedChange={handleSelectAll}
                            />
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem onClick={() => handleSelectAll(true)}>
                            全选
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSelectAll(false)}>
                            取消全选
                          </DropdownMenuItem>
                          {selectedIds.length > 0 && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={handleBatchDelete} className="text-destructive">
                                删除选中
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('id')}>
                      <div className="flex items-center gap-1">
                        ID
                        {sortField === 'id' && (
                          sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('currencyName')}>
                      <div className="flex items-center gap-1">
                        币种名称
                        {sortField === 'currencyName' && (
                          sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('usdPrice')}>
                      <div className="flex items-center gap-1">
                        USD价格
                        {sortField === 'usdPrice' && (
                          sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="w-24">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        加载中...
                      </TableCell>
                    </TableRow>
                  ) : currencies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        暂无数据
                      </TableCell>
                    </TableRow>
                  ) : (
                    currencies.map((currency) => (
                      <TableRow key={currency.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.includes(currency.id)}
                            onCheckedChange={(checked) => handleSelectSingle(currency.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell className="font-mono">{currency.id}</TableCell>
                        <TableCell className="font-medium">{currency.currencyName}</TableCell>
                        <TableCell className="font-mono">
                          {currency.usdPrice.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 8,
                          })}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openViewDialog(currency)}>
                                <Eye className="w-4 h-4 mr-2" />
                                查看
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEditDialog(currency)}>
                                <Edit className="w-4 h-4 mr-2" />
                                编辑
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => openDeleteDialog(currency)}
                                className="text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                删除
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between p-4 border-t border-border bg-card">
              <div className="text-sm text-muted-foreground">
                {total > 0 ? (
                  <span>
                    {total > 0 ? `${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, total)}` : '0'}
                    {' of '}
                    {total}
                  </span>
                ) : (
                  <span>0 of 0</span>
                )}
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        </main>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑电汇币种设置</DialogTitle>
            <DialogDescription>
              修改下方信息以更新电汇币种配置。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-currencyName">币种名称</Label>
              <Input
                id="edit-currencyName"
                placeholder="例如: USDT"
                value={formData.currencyName}
                onChange={(e) => setFormData({ ...formData, currencyName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-usdPrice">USD价格</Label>
              <Input
                id="edit-usdPrice"
                type="number"
                step="0.00000001"
                placeholder="0"
                value={formData.usdPrice}
                onChange={(e) => setFormData({ ...formData, usdPrice: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleEdit}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除电汇币种设置</DialogTitle>
            <DialogDescription>
              确定要删除此电汇币种配置吗？此操作不可恢复。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>电汇币种详情</DialogTitle>
          </DialogHeader>
          {selectedCurrency && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">ID</Label>
                  <p className="text-foreground font-mono mt-1">{selectedCurrency.id}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">币种名称</Label>
                  <p className="text-foreground font-medium mt-1">{selectedCurrency.currencyName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">USD价格</Label>
                  <p className="text-foreground font-mono mt-1">
                    {selectedCurrency.usdPrice.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 8,
                    })}
                  </p>
                </div>
                {selectedCurrency.createdAt && (
                  <div>
                    <Label className="text-muted-foreground">创建时间</Label>
                    <p className="text-foreground font-mono mt-1">
                      {new Date(selectedCurrency.createdAt).toLocaleString('zh-CN')}
                    </p>
                  </div>
                )}
                {selectedCurrency.updatedAt && (
                  <div>
                    <Label className="text-muted-foreground">更新时间</Label>
                    <p className="text-foreground font-mono mt-1">
                      {new Date(selectedCurrency.updatedAt).toLocaleString('zh-CN')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
