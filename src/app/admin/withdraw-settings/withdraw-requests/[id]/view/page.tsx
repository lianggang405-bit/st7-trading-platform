'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Copy,
  RefreshCw,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  MapPin,
  User,
  Hash,
} from 'lucide-react';
import { toast } from 'sonner';
import adminFetch from '@/lib/admin-fetch';

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

export default function WithdrawRequestViewPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [request, setRequest] = useState<WithdrawalRequest | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRequest();
  }, [id]);

  const fetchRequest = async () => {
    setLoading(true);
    try {
      const response = await adminFetch(`/api/admin/wallet/withdrawal-requests/${id}`);
      const data = await response.json();
      if (response.ok) {
        setRequest(data.data);
      } else {
        toast.error(data.error || '获取提币申请失败');
      }
    } catch (error) {
      console.error('Failed to fetch withdrawal request:', error);
      toast.error('获取提币申请失败');
    } finally {
      setLoading(false);
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

  const handleApprove = async () => {
    if (!confirm('确认通过该提币申请？')) return;

    try {
      const response = await adminFetch(`/api/admin/wallet/withdrawal-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'SUCCESS' }),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success('提币申请已通过');
        fetchRequest();
      } else {
        toast.error(data.error || '操作失败');
      }
    } catch (error) {
      toast.error('操作失败');
    }
  };

  const handleReject = async () => {
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
        fetchRequest();
      } else {
        toast.error(data.error || '操作失败');
      }
    } catch (error) {
      toast.error('操作失败');
    }
  };

  const handleDelete = async () => {
    if (!confirm('确认删除该申请？')) return;
    try {
      const response = await adminFetch(`/api/admin/wallet/withdrawal-requests/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (response.ok) {
        toast.success('申请已删除');
        router.push('/admin/withdraw-settings/withdraw-requests');
      } else {
        toast.error(data.error || '删除失败');
      }
    } catch (error) {
      toast.error('删除失败');
    }
  };

  const getStatusBadge = (status: string) => {
    const map = {
      PENDING: { label: '申请中', className: 'bg-blue-600', icon: Clock },
      SUCCESS: { label: '成功', className: 'bg-green-600', icon: CheckCircle },
      FAIL: { label: '失败', className: 'bg-red-600', icon: XCircle },
    };
    const config = map[status as keyof typeof map];
    if (!config) return null;
    const Icon = config.icon;
    return (
      <Badge className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
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
    }).replace(/\//g, '/');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center text-gray-400 p-8">
        未找到提币申请记录
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 面包屑导航 */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>资源</span> / <span>提币申请</span> / <span>查看详情</span>
      </div>

      {/* 顶部操作栏 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">提币申请详情</h1>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/withdraw-settings/withdraw-requests')}
            className="border-slate-600 hover:bg-slate-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回列表
          </Button>
          {request.status === 'PENDING' && (
            <>
              <Button
                onClick={handleApprove}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                通过
              </Button>
              <Button
                onClick={handleReject}
                className="bg-red-600 hover:bg-red-700"
              >
                <XCircle className="w-4 h-4 mr-2" />
                拒绝
              </Button>
            </>
          )}
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/withdraw-settings/withdraw-requests/${id}`)}
            className="border-slate-600 hover:bg-slate-700"
          >
            <Edit className="w-4 h-4 mr-2" />
            编辑
          </Button>
          <Button
            variant="outline"
            onClick={handleDelete}
            className="border-red-600 text-red-400 hover:bg-red-600/20"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            删除
          </Button>
        </div>
      </div>

      {/* 详情卡片 */}
      <div className="grid gap-4">
        {/* 基本信息 */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Hash className="w-5 h-5" />
              基本信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-sm text-gray-400">申请ID</div>
                <div className="text-white font-mono text-lg">{request.id}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-gray-400">状态</div>
                <div>{getStatusBadge(request.status)}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-gray-400 flex items-center gap-1">
                  <User className="w-4 h-4" />
                  账号
                </div>
                <div className="text-white font-mono">{request.account}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-gray-400 flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  品种
                </div>
                <div className="text-white font-medium text-lg">{request.currency}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 提币信息 */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              提币信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <div className="text-sm text-gray-400">提币地址</div>
              <div className="flex items-center gap-2 bg-slate-900 p-3 rounded-lg">
                <span className="text-white font-mono text-sm flex-1 break-all">
                  {request.withdrawal_address}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-gray-400 hover:text-white shrink-0"
                  onClick={() => handleCopy(request.withdrawal_address)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <div className="text-sm text-gray-400">提币数量</div>
                <div className="text-white font-mono text-lg">
                  {request.withdrawal_amount.toFixed(8)}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-gray-400">手续费</div>
                <div className="text-white font-mono text-lg">
                  {request.fee.toFixed(8)}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-gray-400">到账数量</div>
                <div className="text-white font-mono text-lg">
                  {request.actual_amount.toFixed(8)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 拒绝原因 */}
        {request.reject_reason && (
          <Card className="bg-slate-800 border-slate-700 border-red-600/50">
            <CardHeader>
              <CardTitle className="text-red-400 flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                拒绝原因
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-white bg-red-600/10 p-4 rounded-lg">
                {request.reject_reason}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 时间信息 */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="w-5 h-5" />
              时间信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-400 w-24">申请时间</div>
              <div className="text-white">{formatDate(request.created_at)} GMT</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-400 w-24">更新时间</div>
              <div className="text-white">{formatDate(request.updated_at)} GMT</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
