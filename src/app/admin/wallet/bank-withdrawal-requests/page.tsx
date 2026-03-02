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
  CreditCard,
} from 'lucide-react';
import { toast } from 'sonner';

interface BankWithdrawalRequest {
  id: number;
  account: string;
  bank_name: string;
  card_number: string;
  card_holder: string;
  withdrawal_amount: number;
  currency: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function BankWithdrawalRequestsPage() {
  const [requests, setRequests] = useState<BankWithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedRequests, setSelectedRequests] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(15);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchRequests();
  }, [currentPage, sortField, sortOrder]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/wallet/bank-withdrawal-requests?page=${currentPage}&pageSize=${pageSize}&sortBy=${sortField}&sortOrder=${sortOrder}&search=${searchQuery}`
      );
      const data = await response.json();
      if (response.ok) {
        setRequests(data.data || []);
        setTotalCount(data.total || 0);
      } else {
        toast.error(data.error || '获取银行卡提币申请列表失败');
      }
    } catch (error) {
      console.error('Failed to fetch bank withdrawal requests:', error);
      toast.error('获取银行卡提币申请列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchRequests();
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    fetchRequests();
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRequests(new Set(requests.map(r => r.id)));
    } else {
      setSelectedRequests(new Set());
    }
  };

  const handleSelectRequest = (requestId: number, checked: boolean) => {
    const newSelected = new Set(selectedRequests);
    if (checked) {
      newSelected.add(requestId);
    } else {
      newSelected.delete(requestId);
    }
    setSelectedRequests(newSelected);
  };

  const handleDelete = async (requestId: number) => {
    if (!confirm('确定要删除此银行卡提币申请吗？')) return;

    try {
      const response = await fetch(`/api/admin/wallet/bank-withdrawal-requests/${requestId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('删除成功');
        fetchRequests();
      } else {
        const data = await response.json();
        toast.error(data.error || '删除失败');
      }
    } catch (error) {
      console.error('Failed to delete bank withdrawal request:', error);
      toast.error('删除失败');
    }
  };

  const handleBatchDelete = async () => {
    if (selectedRequests.size === 0) {
      toast.warning('请选择要删除的记录');
      return;
    }

    if (!confirm(`确定要删除选中的 ${selectedRequests.size} 条记录吗？`)) return;

    try {
      for (const requestId of selectedRequests) {
        await fetch(`/api/admin/wallet/bank-withdrawal-requests/${requestId}`, {
          method: 'DELETE',
        });
      }

      toast.success('批量删除成功');
      setSelectedRequests(new Set());
      fetchRequests();
    } catch (error) {
      console.error('Failed to batch delete:', error);
      toast.error('批量删除失败');
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'COMPLETED') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          COMPLETED
        </span>
      );
    } else if (status === 'REJECTED') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          REJECTED
        </span>
      );
    } else if (status === 'PENDING') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          PENDING
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        {status}
      </span>
    );
  };

  const maskCardNumber = (cardNumber: string) => {
    if (!cardNumber || cardNumber.length < 4) return cardNumber;
    const lastFour = cardNumber.slice(-4);
    return `**** **** **** ${lastFour}`;
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6">
      {/* 页面标题和面包屑 */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <span>资源</span>
          <span>/</span>
          <span className="text-gray-900 font-medium">银行卡提币申请</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">银行卡提币申请</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          {/* 搜索和操作栏 */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="搜索账号、银行名称、持卡人"
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
              {selectedRequests.size > 0 && (
                <Button variant="destructive" onClick={handleBatchDelete}>
                  批量删除 ({selectedRequests.size})
                </Button>
              )}
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                创建 银行卡提币申请
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
                      checked={selectedRequests.size === requests.length && requests.length > 0}
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
                  <TableHead>账号</TableHead>
                  <TableHead>银行名称</TableHead>
                  <TableHead>卡号</TableHead>
                  <TableHead>持卡人</TableHead>
                  <TableHead className="text-right">提币金额</TableHead>
                  <TableHead>币种</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>申请时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-16">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                          <CreditCard className="h-8 w-8 text-gray-400" />
                        </div>
                        <div className="text-center">
                          <p className="text-gray-500 mb-1">银行卡提币申请不符合给定的标准。</p>
                          <Button className="mt-2">
                            <Plus className="h-4 w-4 mr-2" />
                            创建 银行卡提币申请
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  requests.map((request) => (
                    <TableRow key={request.id} className="hover:bg-gray-50">
                      <TableCell>
                        <input
                          type="checkbox"
                          className="rounded border-gray-300"
                          checked={selectedRequests.has(request.id)}
                          onChange={(e) => handleSelectRequest(request.id, e.target.checked)}
                        />
                      </TableCell>
                      <TableCell className="font-mono">{request.id}</TableCell>
                      <TableCell>{request.account}</TableCell>
                      <TableCell>{request.bank_name}</TableCell>
                      <TableCell className="font-mono">{maskCardNumber(request.card_number)}</TableCell>
                      <TableCell>{request.card_holder}</TableCell>
                      <TableCell className="text-right font-mono">{request.withdrawal_amount.toFixed(2)}</TableCell>
                      <TableCell>{request.currency}</TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>{request.created_at}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(request.id)}
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
