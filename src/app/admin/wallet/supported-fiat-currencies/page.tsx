'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
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
  Search,
  Plus,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  ChevronUp,
  ChevronDown,
  DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';

interface SupportedFiatCurrency {
  id: number;
  name: string;
  usd_rate: number;
  withdrawal_fee: number;
  min_withdrawal: number;
  max_withdrawal: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export default function SupportedFiatCurrenciesPage() {
  const router = useRouter();
  const [currencies, setCurrencies] = useState<SupportedFiatCurrency[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedCurrencies, setSelectedCurrencies] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(15);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchCurrencies();
  }, [currentPage, sortField, sortOrder]);

  const fetchCurrencies = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/wallet/supported-fiat-currencies?page=${currentPage}&pageSize=${pageSize}&sortBy=${sortField}&sortOrder=${sortOrder}&search=${searchQuery}`
      );
      const data = await response.json();
      if (response.ok) {
        setCurrencies(data.data || []);
        setTotalCount(data.total || 0);
      } else {
        toast.error(data.error || '获取支持法币列表失败');
      }
    } catch (error) {
      console.error('Failed to fetch supported fiat currencies:', error);
      toast.error('获取支持法币列表失败');
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
    if (!confirm('确定要删除此支持法币设置吗？')) return;

    try {
      const response = await fetch(`/api/admin/wallet/supported-fiat-currencies/${currencyId}`, {
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
      console.error('Failed to delete supported fiat currency:', error);
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
        await fetch(`/api/admin/wallet/supported-fiat-currencies/${currencyId}`, {
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

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6">
      {/* 页面标题和面包屑 */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <span>资源</span>
          <span>/</span>
          <span className="text-gray-900 font-medium">支持法币设置</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">支持法币设置</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          {/* 搜索和操作栏 */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="搜索品种"
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
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => router.push('/admin/wallet/supported-fiat-currencies/create')}
              >
                <Plus className="h-4 w-4 mr-2" />
                创建 支持法币设置
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
                      className="rounded border-gray-300"
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
                    <TableCell colSpan={9} className="text-center py-8">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : currencies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-16">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                          <DollarSign className="h-8 w-8 text-gray-400" />
                        </div>
                        <div className="text-center">
                          <p className="text-gray-500 mb-1">支持法币设置不符合给定的标准。</p>
                          <Button
                            className="mt-2"
                            onClick={() => router.push('/admin/wallet/supported-fiat-currencies/create')}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            创建 支持法币设置
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
                          className="rounded border-gray-300"
                          checked={selectedCurrencies.has(currency.id)}
                          onChange={(e) => handleSelectCurrency(currency.id, e.target.checked)}
                        />
                      </TableCell>
                      <TableCell className="font-mono">{currency.id}</TableCell>
                      <TableCell className="font-medium">{currency.name}</TableCell>
                      <TableCell>{currency.usd_rate.toFixed(2)}</TableCell>
                      <TableCell>{currency.withdrawal_fee.toFixed(2)}</TableCell>
                      <TableCell>{currency.min_withdrawal.toFixed(2)}</TableCell>
                      <TableCell>{currency.max_withdrawal.toFixed(2)}</TableCell>
                      <TableCell>
                        {currency.is_visible ? (
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
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => router.push(`/admin/wallet/supported-fiat-currencies/${currency.id}/edit`)}
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
    </div>
  );
}
