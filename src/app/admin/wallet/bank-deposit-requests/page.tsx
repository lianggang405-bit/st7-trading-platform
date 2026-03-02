'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

interface BankDepositRequest {
  id: number;
  account: string;
  bankName: string;
  cardNumber: string;
  cardHolder: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
}

export default function BankDepositRequestsPage() {
  const [requests, setRequests] = useState<BankDepositRequest[]>([]);
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
        `/api/admin/wallet/bank-deposit-requests?page=${currentPage}&limit=${pageSize}&sort=${sortField}&order=${sortOrder}&search=${searchQuery}`
      );
      const data = await response.json();
      if (data.success) {
        setRequests(data.requests || []);
        setTotalCount(data.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch bank deposit requests:', error);
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
    if (!confirm('确定要删除此银行卡充币申请吗？')) return;

    try {
      const response = await fetch(`/api/admin/wallet/bank-deposit-requests/${requestId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        toast.success('删除成功');
        fetchRequests();
      } else {
        toast.error('删除失败');
      }
    } catch (error) {
      console.error('Failed to delete bank deposit request:', error);
      toast.error('删除失败');
    }
  };

  const formatPrice = (value: number) => {
    return value.toFixed(2);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    return `${year}/${month}/${day} GMT ${hours}:${minutes}`;
  };

  const getStatusBadge = (status: string) => {
    if (status === 'COMPLETED') {
      return <Badge className="bg-green-500/10 text-green-400">COMPLETED</Badge>;
    } else if (status === 'PENDING') {
      return <Badge className="bg-blue-500/10 text-blue-400">PENDING</Badge>;
    } else if (status === 'REJECTED') {
      return <Badge className="bg-red-500/10 text-red-400">REJECTED</Badge>;
    }
    return <Badge className="bg-gray-500/10 text-gray-400">{status}</Badge>;
  };

  const maskCardNumber = (cardNumber: string) => {
    if (!cardNumber || cardNumber.length < 4) return cardNumber;
    return '**** **** **** ' + cardNumber.slice(-4);
  };

  return (
    <div className="space-y-6">
      {/* 面包屑导航 */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>资源</span> / <span className="text-white">银行卡充币申请</span>
      </div>

      {/* 页面标题和操作栏 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">银行卡充币申请</h1>
        <div className="flex gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="搜索"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchRequests()}
              className="pl-9 bg-slate-700 border-slate-600 text-white"
            />
          </div>
          <Button variant="outline" size="icon" className="border-slate-600 hover:bg-slate-700">
            <Filter className="w-4 h-4" />
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            创建 银行卡充币申请
          </Button>
        </div>
      </div>

      {/* 数据表格 */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-0">
          {requests.length === 0 ? (
            // 空状态
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center mb-4">
                <CreditCard className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-400 text-lg mb-2">银行卡充币申请不符合给定的标准。</p>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => fetchRequests()}>
                <Plus className="w-4 h-4 mr-2" />
                创建 银行卡充币申请
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700 hover:bg-slate-700/50">
                      <TableHead className="w-12 bg-slate-800 whitespace-nowrap">
                        <input
                          type="checkbox"
                          className="rounded border-gray-500 bg-slate-700"
                          checked={selectedRequests.size === requests.length && requests.length > 0}
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
                      <TableHead className="bg-slate-800 text-gray-400 whitespace-nowrap">银行名称</TableHead>
                      <TableHead className="bg-slate-800 text-gray-400 whitespace-nowrap">卡号</TableHead>
                      <TableHead className="bg-slate-800 text-gray-400 whitespace-nowrap">持卡人</TableHead>
                      <TableHead className="bg-slate-800 text-gray-400 whitespace-nowrap">金额</TableHead>
                      <TableHead className="bg-slate-800 text-gray-400 whitespace-nowrap">币种</TableHead>
                      <TableHead className="bg-slate-800 text-gray-400 whitespace-nowrap">状态</TableHead>
                      <TableHead className="bg-slate-800 text-gray-400 whitespace-nowrap">申请时间</TableHead>
                      <TableHead className="bg-slate-800 text-gray-400 whitespace-nowrap w-32">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((request) => (
                      <TableRow key={request.id} className="border-slate-700 hover:bg-slate-700/30">
                        <TableCell className="whitespace-nowrap">
                          <input
                            type="checkbox"
                            className="rounded border-gray-500 bg-slate-700"
                            checked={selectedRequests.has(request.id)}
                            onChange={(e) => handleSelectRequest(request.id, e.target.checked)}
                          />
                        </TableCell>
                        <TableCell className="text-blue-400 font-medium whitespace-nowrap">{request.id}</TableCell>
                        <TableCell className="text-gray-300 whitespace-nowrap text-sm">{request.account}</TableCell>
                        <TableCell className="text-gray-300 whitespace-nowrap">{request.bankName}</TableCell>
                        <TableCell className="text-gray-400 whitespace-nowrap font-mono text-xs">{maskCardNumber(request.cardNumber)}</TableCell>
                        <TableCell className="text-gray-300 whitespace-nowrap">{request.cardHolder}</TableCell>
                        <TableCell className="text-gray-400 whitespace-nowrap font-mono text-xs">{formatPrice(request.amount)}</TableCell>
                        <TableCell className="text-gray-300 whitespace-nowrap">{request.currency}</TableCell>
                        <TableCell className="whitespace-nowrap">{getStatusBadge(request.status)}</TableCell>
                        <TableCell className="text-gray-400 whitespace-nowrap font-mono text-xs">{formatDateTime(request.createdAt)}</TableCell>
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
                              onClick={() => handleDelete(request.id)}
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
                    disabled={requests.length < pageSize}
                    className="border-slate-600 hover:bg-slate-700"
                  >
                    下一页
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
