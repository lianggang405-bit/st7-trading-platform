'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Filter,
  Eye,
  Edit,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import EditKYCDialog from '@/components/admin/EditKYCDialog';

interface KYCRequest {
  id: number;
  userId: number;
  email: string;
  realName: string;
  idNumber: string;
  idCardFront?: string;
  idCardBack?: string;
  applyTime: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectReason?: string;
  reviewTime?: string;
}

export default function KYCManagementPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<KYCRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<string>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(15);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedKYC, setSelectedKYC] = useState<KYCRequest | null>(null);

  useEffect(() => {
    fetchRequests();
  }, [currentPage, sortField, sortOrder, statusFilter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/users/kyc?page=${currentPage}&limit=${pageSize}&sort=${sortField}&order=${sortOrder}&search=${searchQuery}&status=${statusFilter}`
      );
      const data = await response.json();
      if (data.success) {
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Failed to fetch KYC requests:', error);
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

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      pending: { color: 'bg-gray-500/10 text-gray-400', text: '未审核' },
      approved: { color: 'bg-green-500/10 text-green-400', text: '通过审核' },
      rejected: { color: 'bg-red-500/10 text-red-400', text: '拒绝审核' },
    };
    const config = statusMap[status] || statusMap.pending;
    return <Badge className={config.color}>{config.text}</Badge>;
  };

  const maskIdNumber = (idNumber: string) => {
    if (!idNumber || idNumber === '—') return '—';
    if (idNumber.length <= 4) return idNumber;
    return idNumber.substring(0, 2) + '****' + idNumber.substring(idNumber.length - 2);
  };

  const handleApprove = async (requestId: number) => {
    if (!confirm('确定要通过此实名认证吗？')) return;

    try {
      const response = await fetch(`/api/admin/users/kyc/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'approved' }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success('审核通过');
        fetchRequests();
      } else {
        toast.error('审核失败');
      }
    } catch (error) {
      console.error('Failed to approve KYC:', error);
      toast.error('审核失败');
    }
  };

  const handleReject = async (requestId: number, reason?: string) => {
    const rejectReason = reason || prompt('请输入拒绝原因：');
    if (!rejectReason) return;

    try {
      const response = await fetch(`/api/admin/users/kyc/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'rejected', rejectReason }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success('已拒绝认证');
        fetchRequests();
      } else {
        toast.error('操作失败');
      }
    } catch (error) {
      console.error('Failed to reject KYC:', error);
      toast.error('操作失败');
    }
  };

  return (
    <div className="space-y-6">
      {/* 面包屑导航 */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>资源</span> / <span className="text-white">实名管理</span>
      </div>

      {/* 页面标题和操作栏 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">实名管理</h1>
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
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32 bg-slate-700 border-slate-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-700 border-slate-600">
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="pending">未审核</SelectItem>
              <SelectItem value="approved">通过审核</SelectItem>
              <SelectItem value="rejected">拒绝审核</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 数据表格 */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700 hover:bg-slate-700/50">
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
                <TableHead className="bg-slate-800 text-gray-400">邮箱</TableHead>
                <TableHead className="bg-slate-800 text-gray-400">真实姓名</TableHead>
                <TableHead className="bg-slate-800 text-gray-400">证件号码</TableHead>
                <TableHead className="bg-slate-800 text-gray-400">申请时间</TableHead>
                <TableHead className="bg-slate-800 text-gray-400">状态</TableHead>
                <TableHead className="bg-slate-800 text-gray-400">拒绝备注</TableHead>
                <TableHead className="bg-slate-800 text-gray-400">证件照正面</TableHead>
                <TableHead className="bg-slate-800 text-gray-400">证件照反面</TableHead>
                <TableHead className="bg-slate-800 text-gray-400 w-24">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id} className="border-slate-700 hover:bg-slate-700/30">
                  <TableCell className="text-blue-400 font-medium">{request.id}</TableCell>
                  <TableCell className="text-gray-300">{request.email || '—'}</TableCell>
                  <TableCell className="text-gray-300">{request.realName}</TableCell>
                  <TableCell className="text-gray-400">{maskIdNumber(request.idNumber)}</TableCell>
                  <TableCell className="text-gray-400">{request.applyTime}</TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell className="text-gray-400">{request.rejectReason || '—'}</TableCell>
                  <TableCell>
                    {request.idCardFront ? (
                      <div className="relative w-12 h-8 bg-slate-700 rounded overflow-hidden cursor-pointer hover:opacity-80">
                        <Image
                          src={request.idCardFront}
                          alt="证件正面"
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {request.idCardBack ? (
                      <div className="relative w-12 h-8 bg-slate-700 rounded overflow-hidden cursor-pointer hover:opacity-80">
                        <Image
                          src={request.idCardBack}
                          alt="证件反面"
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-white"
                        onClick={() => router.push(`/admin/users/kyc/${request.id}`)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-white"
                        onClick={() => {
                          setSelectedKYC(request);
                          setEditDialogOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
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
              显示 {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, requests.length)} 条，共 {requests.length} 条
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
              <Select
                value={currentPage.toString()}
                onValueChange={(value) => setCurrentPage(parseInt(value))}
              >
                <SelectTrigger className="w-20 bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  {[1, 2, 3, 4, 5].map((page) => (
                    <SelectItem key={page} value={page.toString()}>{page}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
        </CardContent>
      </Card>

      {/* 编辑实名认证弹窗 */}
      <EditKYCDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        kyc={selectedKYC}
        onSuccess={fetchRequests}
      />
    </div>
  );
}
