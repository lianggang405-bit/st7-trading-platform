'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  RefreshCw,
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Copy,
  Filter,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import adminFetch from '@/lib/admin-fetch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface WithdrawalRequest {
  id: number;
  account: string;
  currency: string;
  withdrawal_address: string;
  withdrawal_amount: number;
  fee: number;
  actual_amount: number;
  status: 'PENDING' | 'SUCCESS' | 'FAIL';
  reject_reason?: string;
  created_at: string;
  updated_at: string;
}

export default function WithdrawRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [sortField, setSortField] = useState('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchRequests();
  }, [currentPage, sortField, sortOrder]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await adminFetch(
        `/api/admin/wallet/withdrawal-requests?page=${currentPage}&pageSize=${pageSize}&sortBy=${sortField}&sortOrder=${sortOrder}`
      );
      const data = await response.json();
      if (response.ok) {
        setRequests(data.data || []);
        setTotalCount(data.total || 0);
      } else {
        toast.error(data.error || '获取提币申请失败');
      }
    } catch (error) {
      console.error('Failed to fetch withdrawal requests:', error);
      toast.error('获取提币申请失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(requests.map(r => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('已复制到剪贴板');
    } catch (error) {
      toast.error('复制失败');
    }
  };

  const handleApprove = async (id: number) => {
    try {
      const response = await adminFetch(`/api/admin/wallet/withdrawal-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'SUCCESS' }),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success('提币申请已通过');
        fetchRequests();
      } else {
        toast.error(data.error || '操作失败');
      }
    } catch (error) {
      toast.error('操作失败');
    }
  };

  const handleReject = async (id: number) => {
    const reason = prompt('请输入拒绝原因：');
    if (reason === null) return;

    try {
      const response = await adminFetch(`/api/admin/wallet/withdrawal-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'FAIL', reject_reason: reason }),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success('提币申请已拒绝');
        fetchRequests();
      } else {
        toast.error(data.error || '操作失败');
      }
    } catch (error) {
      toast.error('操作失败');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确认删除该申请？')) return;
    try {
      const response = await adminFetch(`/api/admin/wallet/withdrawal-requests/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (response.ok) {
        toast.success('申请已删除');
        fetchRequests();
      } else {
        toast.error(data.error || '删除失败');
      }
    } catch (error) {
      toast.error('删除失败');
    }
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

  const getStatusBadge = (status: string) => {
    const map = {
      PENDING: { label: '申请中', className: 'bg-blue-600' },
      SUCCESS: { label: '成功', className: 'bg-green-600' },
      FAIL: { label: '失败', className: 'bg-red-600' },
    };
    const config = map[status as keyof typeof map];
    return config ? (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    ) : null;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).replace(/\//g, '/');
  };

  const filteredRequests = requests.filter(req => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      req.account.toLowerCase().includes(searchLower) ||
      req.currency.toLowerCase().includes(searchLower) ||
      req.withdrawal_address.toLowerCase().includes(searchLower) ||
      req.id.toString().includes(searchLower)
    );
  });

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-4">
      {/* 面包屑导航 */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>资源</span> / <span>提币申请</span>
      </div>

      {/* 页面标题和操作栏 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">提币申请</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="搜索"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white pl-10 w-64"
            />
          </div>
          <Button variant="outline" size="icon" className="border-slate-600 hover:bg-slate-700">
            <Filter className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => router.push('/admin/withdraw-settings/withdraw-requests/create')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            创建提币申请
          </Button>
        </div>
      </div>

      {/* 表格 */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left p-4 text-gray-400 font-medium w-12">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === requests.length && requests.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-700"
                    />
                  </th>
                  <th
                    className="text-left p-4 text-gray-400 font-medium cursor-pointer hover:text-white"
                    onClick={() => handleSort('id')}
                  >
                    <div className="flex items-center gap-1">
                      ID
                      {sortField === 'id' && (
                        sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th className="text-left p-4 text-gray-400 font-medium">账号</th>
                  <th className="text-left p-4 text-gray-400 font-medium">品种</th>
                  <th className="text-left p-4 text-gray-400 font-medium">提币地址</th>
                  <th className="text-left p-4 text-gray-400 font-medium">提币数量</th>
                  <th className="text-left p-4 text-gray-400 font-medium">手续费</th>
                  <th className="text-left p-4 text-gray-400 font-medium">到账数量</th>
                  <th className="text-left p-4 text-gray-400 font-medium">状态</th>
                  <th
                    className="text-left p-4 text-gray-400 font-medium cursor-pointer hover:text-white"
                    onClick={() => handleSort('created_at')}
                  >
                    <div className="flex items-center gap-1">
                      申请时间
                      {sortField === 'created_at' && (
                        sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th className="text-left p-4 text-gray-400 font-medium w-20"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={11} className="text-center p-8 text-gray-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                      加载中...
                    </td>
                  </tr>
                ) : filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center p-8 text-gray-400">
                      暂无提币申请
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((req) => (
                    <tr key={req.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(req.id)}
                          onChange={(e) => handleSelectRow(req.id, e.target.checked)}
                          className="w-4 h-4 rounded border-slate-600 bg-slate-700"
                        />
                      </td>
                      <td className="p-4 text-white font-mono">{req.id}</td>
                      <td className="p-4 text-white">{req.account}</td>
                      <td className="p-4 text-white font-medium">{req.currency}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="text-white text-sm font-mono truncate max-w-[150px]">
                            {req.withdrawal_address}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-5 w-5 text-gray-400 hover:text-white"
                            onClick={() => handleCopy(req.withdrawal_address)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                      <td className="p-4 text-white font-mono">
                        {req.withdrawal_amount.toFixed(8)}
                      </td>
                      <td className="p-4 text-white font-mono">
                        {req.fee.toFixed(8)}
                      </td>
                      <td className="p-4 text-white font-mono">
                        {req.actual_amount.toFixed(8)}
                      </td>
                      <td className="p-4">
                        {getStatusBadge(req.status)}
                      </td>
                      <td className="p-4 text-gray-300 text-sm">
                        {formatDate(req.created_at)} GMT
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-white">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                              <DropdownMenuItem
                                onClick={() => handleCopy(req.id.toString())}
                                className="text-gray-300 hover:bg-slate-700 hover:text-white cursor-pointer"
                              >
                                <Copy className="w-4 h-4 mr-2" />
                                复制
                              </DropdownMenuItem>
                              {req.status === 'PENDING' && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => handleApprove(req.id)}
                                    className="text-green-400 hover:bg-slate-700 hover:text-green-300 cursor-pointer"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    通过
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleReject(req.id)}
                                    className="text-red-400 hover:bg-slate-700 hover:text-red-300 cursor-pointer"
                                  >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    拒绝
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-gray-400 hover:text-white"
                            onClick={() => router.push(`/admin/withdraw-settings/withdraw-requests/${req.id}/view`)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-gray-400 hover:text-white"
                            onClick={() => router.push(`/admin/withdraw-settings/withdraw-requests/${req.id}`)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-gray-400 hover:text-red-400"
                            onClick={() => handleDelete(req.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 分页控制 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="text-sm text-gray-400">
            {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalCount)} of {totalCount}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="border-slate-600 hover:bg-slate-700"
            >
              上一页
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="border-slate-600 hover:bg-slate-700"
            >
              下一页
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
