'use client';

import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { toast } from 'sonner';

interface CurrencyKx {
  id: number;
  currency: string;
  dataStart: string;
  dataEnd: string;
}

export default function CurrencyKxesPage() {
  const [currencies, setCurrencies] = useState<CurrencyKx[]>([]);
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
        `/api/admin/trading/currencies?page=${currentPage}&limit=${pageSize}&sort=${sortField}&order=${sortOrder}&search=${searchQuery}`
      );
      const data = await response.json();
      if (data.success) {
        setCurrencies(data.currencies || []);
        setTotalCount(data.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch currencies:', error);
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
    if (!confirm('确定要删除此数据吗？')) return;

    try {
      const response = await fetch(`/api/admin/trading/currencies/${currencyId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        toast.success('删除成功');
        fetchCurrencies();
      } else {
        toast.error('删除失败');
      }
    } catch (error) {
      console.error('Failed to delete currency:', error);
      toast.error('删除失败');
    }
  };

  return (
    <div className="space-y-6">
      {/* 面包屑导航 */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>资源</span> / <span className="text-white">Currency Kxes</span>
      </div>

      {/* 页面标题和操作栏 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Currency Kxes</h1>
        <div className="flex gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="搜索"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchCurrencies()}
              className="pl-9 bg-slate-700 border-slate-600 text-white"
            />
          </div>
          <Button variant="outline" size="icon" className="border-slate-600 hover:bg-slate-700">
            <Filter className="w-4 h-4" />
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            创建 Currency Kx
          </Button>
        </div>
      </div>

      {/* 数据表格 */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700 hover:bg-slate-700/50">
                <TableHead className="w-12 bg-slate-800">
                  <input
                    type="checkbox"
                    className="rounded border-gray-500 bg-slate-700"
                    checked={selectedCurrencies.size === currencies.length && currencies.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </TableHead>
                <TableHead className="bg-slate-800 text-gray-400">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-blue-400 hover:text-blue-300"
                    onClick={() => handleSort('id')}
                  >
                    ID
                    {sortField === 'id' && (
                      sortOrder === 'asc' ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />
                    )}
                  </Button>
                </TableHead>
                <TableHead className="bg-slate-800 text-gray-400">交易币</TableHead>
                <TableHead className="bg-slate-800 text-gray-400">DATASTART</TableHead>
                <TableHead className="bg-slate-800 text-gray-400">DATAEND</TableHead>
                <TableHead className="bg-slate-800 text-gray-400 w-32">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currencies.map((currency) => (
                <TableRow key={currency.id} className="border-slate-700 hover:bg-slate-700/30">
                  <TableCell>
                    <input
                      type="checkbox"
                      className="rounded border-gray-500 bg-slate-700"
                      checked={selectedCurrencies.has(currency.id)}
                      onChange={(e) => handleSelectCurrency(currency.id, e.target.checked)}
                    />
                  </TableCell>
                  <TableCell className="text-blue-400 font-medium">{currency.id}</TableCell>
                  <TableCell className="text-gray-300 font-medium">{currency.currency}</TableCell>
                  <TableCell className="text-gray-400">{currency.dataStart}</TableCell>
                  <TableCell className="text-gray-400">{currency.dataEnd}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-red-400"
                        onClick={() => handleDelete(currency.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

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
                disabled={currencies.length < pageSize}
                className="border-slate-600 hover:bg-slate-700"
              >
                下一页
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
