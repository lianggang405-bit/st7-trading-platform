'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  Image as ImageIcon,
  Check,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

interface DepositRequest {
  id: number;
  account: string;
  email: string;
  currency: string;
  paymentAddress: string;
  amount: number;
  usdAmount: number;
  proofImage: string;
  status: string;
  createdAt: string;
  type: string;
  txHash: string;
}

export default function DepositRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<DepositRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedRequests, setSelectedRequests] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(15);
  const [totalCount, setTotalCount] = useState(0);

  // Dialog states
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<DepositRequest | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [reviewRemark, setReviewRemark] = useState('');
  const [editForm, setEditForm] = useState<Partial<DepositRequest>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [currentPage, sortField, sortOrder]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/wallet/deposit-requests?page=${currentPage}&limit=${pageSize}&sort=${sortField}&order=${sortOrder}&search=${searchQuery}`
      );
      const data = await response.json();
      if (data.success) {
        setRequests(data.requests || []);
        setTotalCount(data.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch deposit requests:', error);
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
    if (!confirm('确定要删除此充值申请吗？')) return;

    try {
      const response = await fetch(`/api/admin/wallet/deposit-requests/${requestId}`, {
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
      console.error('Failed to delete deposit request:', error);
      toast.error('删除失败');
    }
  };

  const handleApprove = async (requestId: number) => {
    if (!confirm('确定要通过此充值申请吗？')) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/wallet/deposit-requests/${requestId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          processedBy: 'admin',
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('审核通过成功');
        fetchRequests();
      } else {
        toast.error('审核失败');
      }
    } catch (error) {
      console.error('Failed to approve deposit request:', error);
      toast.error('审核失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async (requestId: number, remark: string = '') => {
    if (!confirm('确定要拒绝此充值申请吗？')) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/wallet/deposit-requests/${requestId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          processedBy: 'admin',
          remark: remark || reviewRemark,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('已拒绝申请');
        fetchRequests();
        setIsReviewDialogOpen(false);
      } else {
        toast.error('操作失败');
      }
    } catch (error) {
      console.error('Failed to reject deposit request:', error);
      toast.error('操作失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openViewDialog = (request: DepositRequest) => {
    setSelectedRequest(request);
    setIsViewDialogOpen(true);
  };

  const openImageDialog = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setIsImageDialogOpen(true);
  };

  const openReviewDialog = (request: DepositRequest) => {
    setSelectedRequest(request);
    setReviewRemark('');
    setIsReviewDialogOpen(true);
  };

  const openEditDialog = (request: DepositRequest) => {
    setSelectedRequest(request);
    setEditForm({
      amount: request.amount,
      status: request.status,
      currency: request.currency,
      paymentAddress: request.paymentAddress,
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    if (!selectedRequest) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/wallet/deposit-requests/${selectedRequest.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: editForm.status,
          remark: `编辑: 更新了金额/状态等信息`,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('更新成功');
        fetchRequests();
        setIsEditDialogOpen(false);
      } else {
        toast.error('更新失败');
      }
    } catch (error) {
      console.error('Failed to update deposit request:', error);
      toast.error('更新失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (value: number) => {
    return value.toFixed(8);
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
    if (status === 'approved' || status === 'DEPOSIT') {
      return <Badge className="bg-green-500/10 text-green-400">已通过</Badge>;
    } else if (status === 'pending' || status === 'APPLY FOR RECHARGE') {
      return <Badge className="bg-yellow-500/10 text-yellow-400">待审核</Badge>;
    } else if (status === 'rejected') {
      return <Badge className="bg-red-500/10 text-red-400">已拒绝</Badge>;
    } else if (status === 'cancelled') {
      return <Badge className="bg-gray-500/10 text-gray-400">已取消</Badge>;
    }
    return <Badge className="bg-gray-500/10 text-gray-400">{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* 面包屑导航 */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>资源</span> / <span className="text-white">充值申请</span>
      </div>

      {/* 页面标题和操作栏 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">充值申请</h1>
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
            创建 充值申请
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
                  <TableHead className="bg-slate-800 text-gray-400 whitespace-nowrap">品种</TableHead>
                  <TableHead className="bg-slate-800 text-gray-400 whitespace-nowrap">付款地址</TableHead>
                  <TableHead className="bg-slate-800 text-gray-400 whitespace-nowrap">付款数量</TableHead>
                  <TableHead className="bg-slate-800 text-gray-400 whitespace-nowrap">USD数量</TableHead>
                  <TableHead className="bg-slate-800 text-gray-400 whitespace-nowrap">付款凭证</TableHead>
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
                    <TableCell className="text-gray-300 whitespace-nowrap">{request.currency}</TableCell>
                    <TableCell className="text-gray-400 whitespace-nowrap font-mono text-xs max-w-md truncate" title={request.paymentAddress}>
                      {request.paymentAddress || '-'}
                    </TableCell>
                    <TableCell className="text-gray-400 whitespace-nowrap font-mono text-xs">{formatPrice(request.amount)}</TableCell>
                    <TableCell className="text-gray-400 whitespace-nowrap font-mono text-xs">{formatPrice(request.usdAmount)}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {request.proofImage ? (
                        <div 
                          className="relative w-12 h-12 rounded overflow-hidden bg-slate-700 cursor-pointer hover:opacity-80 border-2 border-transparent hover:border-blue-500 transition-all"
                          onClick={() => openImageDialog(request.proofImage)}
                        >
                          <img 
                            src={request.proofImage} 
                            alt="付款凭证" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{getStatusBadge(request.status)}</TableCell>
                    <TableCell className="text-gray-400 whitespace-nowrap font-mono text-xs">{formatDateTime(request.createdAt)}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-white"
                          onClick={() => openViewDialog(request)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Link href={`/admin/wallet/deposit-requests/${request.id}`} passHref>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-blue-400"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        {request.status === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:text-green-400"
                              onClick={() => handleApprove(request.id)}
                              disabled={isSubmitting}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:text-red-400"
                              onClick={() => handleReject(request.id)}
                              disabled={isSubmitting}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        )}
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
        </CardContent>
      </Card>

      {/* 查看详情对话框 */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>充值申请详情</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-gray-400">ID</Label>
                <div className="col-span-3 text-white font-mono">{selectedRequest.id}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-gray-400">账号</Label>
                <div className="col-span-3 text-blue-400 font-medium">{selectedRequest.account}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-gray-400">品种</Label>
                <div className="col-span-3 text-white">{selectedRequest.currency}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-gray-400">付款地址</Label>
                <div className="col-span-3 text-white font-mono text-xs break-all bg-slate-700 p-2 rounded">
                  {selectedRequest.paymentAddress}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-gray-400">付款数量</Label>
                <div className="col-span-3 text-white font-mono">{formatPrice(selectedRequest.amount)}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-gray-400">USD数量</Label>
                <div className="col-span-3 text-white font-mono">{formatPrice(selectedRequest.usdAmount)}</div>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right text-gray-400">付款凭证</Label>
                <div className="col-span-3">
                  {selectedRequest.proofImage ? (
                    <div 
                      className="relative w-full max-w-xs rounded overflow-hidden bg-slate-700 cursor-pointer hover:opacity-90"
                      onClick={() => openImageDialog(selectedRequest.proofImage)}
                    >
                      <img src={selectedRequest.proofImage} alt="付款凭证" className="w-full h-auto" />
                      <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-all flex items-center justify-center">
                        <div className="opacity-0 hover:opacity-100 transition-all bg-black/50 px-3 py-1 rounded text-white text-sm">
                          点击查看原图
                        </div>
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-500">暂无凭证</span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-gray-400">状态</Label>
                <div className="col-span-3">{getStatusBadge(selectedRequest.status)}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-gray-400">申请时间</Label>
                <div className="col-span-3 text-gray-400 font-mono text-xs">{formatDateTime(selectedRequest.createdAt)}</div>
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

      {/* 查看原图对话框 */}
      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-4xl max-h-[90vh] overflow-hidden p-0">
          <DialogHeader className="p-4 border-b border-slate-700">
            <DialogTitle>付款凭证</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-4 overflow-auto max-h-[70vh]">
            {selectedImage && (
              <img 
                src={selectedImage} 
                alt="付款凭证原图" 
                className="max-w-full max-h-full object-contain"
              />
            )}
          </div>
          <DialogFooter className="p-4 border-t border-slate-700">
            <Button onClick={() => setIsImageDialogOpen(false)} className="bg-blue-600 hover:bg-blue-700">
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>编辑充值申请</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-gray-400">状态</Label>
                <select
                  value={editForm.status || ''}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full bg-slate-700 border-slate-600 text-white rounded-md p-2"
                >
                  <option value="pending">待审核</option>
                  <option value="approved">已通过</option>
                  <option value="rejected">已拒绝</option>
                  <option value="cancelled">已取消</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-400">金额</Label>
                <Input
                  type="number"
                  value={editForm.amount || ''}
                  onChange={(e) => setEditForm({ ...editForm, amount: parseFloat(e.target.value) || 0 })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button 
              onClick={() => setIsEditDialogOpen(false)} 
              variant="outline"
              className="border-slate-600 hover:bg-slate-700"
            >
              取消
            </Button>
            <Button 
              onClick={handleEditSave} 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isSubmitting}
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
