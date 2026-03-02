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

interface FinancialRecord {
  id: number;
  account: string;
  beforeBalance: number;
  amount: number;
  afterBalance: number;
  source: string;
  remark: string;
  createdAt: string;
}

export default function FinancialRecordsPage() {
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedRecords, setSelectedRecords] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(15);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchRecords();
  }, [currentPage, sortField, sortOrder]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/wallet/financial-records?page=${currentPage}&limit=${pageSize}&sort=${sortField}&order=${sortOrder}&search=${searchQuery}`
      );
      const data = await response.json();
      if (data.success) {
        setRecords(data.records || []);
        setTotalCount(data.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch financial records:', error);
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
      setSelectedRecords(new Set(records.map(r => r.id)));
    } else {
      setSelectedRecords(new Set());
    }
  };

  const handleSelectRecord = (recordId: number, checked: boolean) => {
    const newSelected = new Set(selectedRecords);
    if (checked) {
      newSelected.add(recordId);
    } else {
      newSelected.delete(recordId);
    }
    setSelectedRecords(newSelected);
  };

  const handleDelete = async (recordId: number) => {
    if (!confirm('确定要删除此财务记录吗？')) return;

    try {
      const response = await fetch(`/api/admin/wallet/financial-records/${recordId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        toast.success('删除成功');
        fetchRecords();
      } else {
        toast.error('删除失败');
      }
    } catch (error) {
      console.error('Failed to delete financial record:', error);
      toast.error('删除失败');
    }
  };

  const formatPrice = (value: number) => {
    return value.toFixed(8);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().replace('T', ' ').substring(0, 19) + 'Z';
  };

  const getAmountColor = (amount: number) => {
    if (amount > 0) return 'text-green-400';
    if (amount < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  const formatAmountWithSign = (amount: number) => {
    if (amount > 0) return `+${formatPrice(amount)}`;
    return formatPrice(amount);
  };

  return (
    <div className="space-y-6">
      {/* 面包屑导航 */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>资源</span> / <span className="text-white">财务记录</span>
      </div>

      {/* 页面标题和操作栏 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">财务记录</h1>
        <div className="flex gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="搜索"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchRecords()}
              className="pl-9 bg-slate-700 border-slate-600 text-white"
            />
          </div>
          <Button variant="outline" size="icon" className="border-slate-600 hover:bg-slate-700">
            <Filter className="w-4 h-4" />
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            创建财务记录
          </Button>
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
                      checked={selectedRecords.size === records.length && records.length > 0}
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
                  <TableHead className="bg-slate-800 text-gray-400 whitespace-nowrap">账号</TableHead>
                  <TableHead className="bg-slate-800 text-gray-400 whitespace-nowrap">交易前</TableHead>
                  <TableHead className="bg-slate-800 text-gray-400 whitespace-nowrap">增减</TableHead>
                  <TableHead className="bg-slate-800 text-gray-400 whitespace-nowrap">交易后</TableHead>
                  <TableHead className="bg-slate-800 text-gray-400 whitespace-nowrap">来源</TableHead>
                  <TableHead className="bg-slate-800 text-gray-400 whitespace-nowrap">备注</TableHead>
                  <TableHead className="bg-slate-800 text-gray-400 whitespace-nowrap">创建时间</TableHead>
                  <TableHead className="bg-slate-800 text-gray-400 whitespace-nowrap w-32">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id} className="border-slate-700 hover:bg-slate-700/30">
                    <TableCell className="whitespace-nowrap">
                      <input
                        type="checkbox"
                        className="rounded border-gray-500 bg-slate-700"
                        checked={selectedRecords.has(record.id)}
                        onChange={(e) => handleSelectRecord(record.id, e.target.checked)}
                      />
                    </TableCell>
                    <TableCell className="text-blue-400 font-medium whitespace-nowrap">{record.id}</TableCell>
                    <TableCell className="text-gray-300 whitespace-nowrap text-sm">{record.account}</TableCell>
                    <TableCell className="text-gray-400 whitespace-nowrap font-mono text-xs">{formatPrice(record.beforeBalance)}</TableCell>
                    <TableCell className={`whitespace-nowrap font-mono text-xs ${getAmountColor(record.amount)}`}>{formatAmountWithSign(record.amount)}</TableCell>
                    <TableCell className="text-gray-400 whitespace-nowrap font-mono text-xs">{formatPrice(record.afterBalance)}</TableCell>
                    <TableCell className="text-gray-300 whitespace-nowrap">{record.source}</TableCell>
                    <TableCell className="text-gray-400 whitespace-nowrap text-sm max-w-xs truncate" title={record.remark}>{record.remark}</TableCell>
                    <TableCell className="text-gray-400 whitespace-nowrap font-mono text-xs">{formatDateTime(record.createdAt)}</TableCell>
                    <TableCell className="whitespace-nowrap">
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
                          onClick={() => handleDelete(record.id)}
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
                disabled={records.length < pageSize}
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
