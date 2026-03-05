'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ImagePreview } from '@/components/image-preview';
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
  Copy
} from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DepositRequest {
  id: number;
  userId: number;
  email: string;
  type: 'crypto' | 'wire' | 'bank';
  currency: string;
  paymentAddress: string;
  amount: number;
  usdAmount: number;
  proofImage: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  account?: string;
  txHash?: string;
}

export default function DepositRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<DepositRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    console.log('[DepositRequestsPage] Component mounted, fetching requests...');
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    console.log('[DepositRequestsPage] fetchRequests called');
    setLoading(true);
    try {
      console.log('[DepositRequestsPage] Fetching from /api/admin/wallet/deposit-requests');
      const response = await fetch('/api/admin/wallet/deposit-requests');
      console.log('[DepositRequestsPage] Response status:', response.status);
      
      const data = await response.json();
      console.log('[DepositRequestsPage] Response data:', data);
      
      if (data.success) {
        // 后端 API 已经返回了格式化的 camelCase 数据，直接使用
        setRequests(data.requests || []);
      } else {
        console.error('[DepositRequestsPage] API returned success=false');
      }
    } catch (error) {
      console.error('[DepositRequestsPage] Failed to fetch deposit requests:', error);
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

  const handlePreviewImage = (imageSrc: string) => {
    setPreviewImage(imageSrc);
  };

  const handleClosePreview = () => {
    setPreviewImage(null);
  };

  const handleApprove = async (id: number) => {
    if (!confirm('确认通过该申请？')) return;
    try {
      const response = await fetch(`/api/admin/wallet/deposit-requests/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ processedBy: 1 }), // 使用管理员 user_id = 1
      });
      const data = await response.json();
      if (data.success) {
        toast.success('申请已通过');
        fetchRequests();
      } else {
        toast.error(data.error || '操作失败');
      }
    } catch (error) {
      toast.error('操作失败');
    }
  };

  const handleReject = async (id: number) => {
    if (!confirm('确认拒绝该申请？')) return;
    try {
      const response = await fetch(`/api/admin/wallet/deposit-requests/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ processedBy: 1 }), // 使用管理员 user_id = 1
      });
      const data = await response.json();
      if (data.success) {
        toast.success('申请已拒绝');
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
      const response = await fetch(`/api/admin/wallet/deposit-requests/${id}`, { 
        method: 'DELETE' 
      });
      const data = await response.json();
      if (data.success) {
        toast.success('申请已删除');
        fetchRequests();
      } else {
        toast.error(data.error || '删除失败');
      }
    } catch (error) {
      toast.error('删除失败');
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      pending: { label: '申请中', className: 'bg-yellow-500/10 text-yellow-400' },
      approved: { label: '已充值', className: 'bg-green-500/10 text-green-400' },
      rejected: { label: '已拒绝', className: 'bg-red-500/10 text-red-400' },
    };
    const config = map[status];
    return config ? (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    ) : (
      <Badge className="bg-gray-500/10 text-gray-400">{status}</Badge>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).replace(/\//g, '/') + ' (GMT+8)';
  };

  const filteredRequests = requests.filter(req => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      (req.email && req.email.toLowerCase().includes(searchLower)) ||
      (req.account && req.account.toLowerCase().includes(searchLower)) ||
      (req.currency && req.currency.toLowerCase().includes(searchLower)) ||
      (req.paymentAddress && req.paymentAddress.toLowerCase().includes(searchLower)) ||
      req.id.toString().includes(searchLower)
    );
  });

  return (
    <div className="space-y-4">
      {/* 面包屑导航 */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>资源</span> / <span>充币申请</span>
      </div>

      {/* 页面标题和操作栏 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">充币申请</h1>
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
          <Button 
            onClick={fetchRequests}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新
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
                      checked={selectedIds.length === filteredRequests.length && filteredRequests.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-700"
                    />
                  </th>
                  <th className="text-left p-4 text-gray-400 font-medium">ID</th>
                  <th className="text-left p-4 text-gray-400 font-medium">账号</th>
                  <th className="text-left p-4 text-gray-400 font-medium">品种</th>
                  <th className="text-left p-4 text-gray-400 font-medium">付款地址</th>
                  <th className="text-left p-4 text-gray-400 font-medium">付款数量</th>
                  <th className="text-left p-4 text-gray-400 font-medium">USD数量</th>
                  <th className="text-left p-4 text-gray-400 font-medium">付款凭证</th>
                  <th className="text-left p-4 text-gray-400 font-medium">状态</th>
                  <th className="text-left p-4 text-gray-400 font-medium">申请时间</th>
                  <th className="text-left p-4 text-gray-400 font-medium w-20"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-gray-400">
                      加载中...
                    </td>
                  </tr>
                ) : filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-gray-400">
                      未找到充币申请
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
                      <td className="p-4 text-white">{req.id}</td>
                      <td className="p-4 text-white">{req.email || req.account || '-'}</td>
                      <td className="p-4 text-white">{req.currency}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="text-white text-sm font-mono truncate max-w-[150px]">
                            {req.paymentAddress || '—'}
                          </span>
                          {req.paymentAddress && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-5 w-5 text-gray-400 hover:text-white"
                              onClick={() => handleCopy(req.paymentAddress)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-white font-mono">
                        {typeof req.amount === 'number' ? req.amount.toFixed(8) : req.amount}
                      </td>
                      <td className="p-4 text-white font-mono">
                        {typeof req.usdAmount === 'number' ? req.usdAmount.toFixed(8) : req.usdAmount}
                      </td>
                      <td className="p-4">
                        {req.proofImage && req.proofImage.startsWith('http') ? (
                          <div className="relative group">
                            <div
                              className="w-12 h-12 rounded overflow-hidden bg-slate-700 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                              onClick={() => handlePreviewImage(req.proofImage)}
                              title="点击查看大图"
                            >
                              <img
                                src={req.proofImage}
                                alt="付款凭证"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  console.error('[DepositRequests] Image load error:', req.proofImage);
                                }}
                              />
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                              <Eye className="w-4 h-4 text-white bg-black/50 rounded-full p-0.5" />
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm">无凭证</span>
                        )}
                      </td>
                      <td className="p-4">
                        {getStatusBadge(req.status)}
                      </td>
                      <td className="p-4 text-gray-300 text-sm">
                        {formatDate(req.createdAt)} GMT
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
                                复制ID
                              </DropdownMenuItem>
                              {req.status === 'pending' && (
                                <>
                                  <DropdownMenuItem 
                                    onClick={() => handleApprove(req.id)}
                                    className="text-green-400 hover:bg-slate-700 hover:text-green-300 cursor-pointer"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    同意
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
                            onClick={() => router.push(`/admin/deposit-settings/deposit-requests/${req.id}/view`)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-gray-400 hover:text-white"
                            onClick={() => router.push(`/admin/deposit-settings/deposit-requests/${req.id}`)}
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

      {/* 图片预览弹窗 */}
      <ImagePreview
        open={!!previewImage}
        onOpenChange={(open) => !open && handleClosePreview()}
        src={previewImage || ''}
        title="付款凭证预览"
      />
    </div>
  );
}