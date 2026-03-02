'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MoreVertical, Copy } from 'lucide-react';
import { toast } from 'sonner';
import adminFetch from '@/lib/admin-fetch';

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
  updatedAt: string;
  type?: string;
  txHash?: string;
}

export default function DepositRequestViewPage() {
  const router = useRouter();
  const [request, setRequest] = useState<DepositRequest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequest();
  }, []);

  const fetchRequest = async () => {
    setLoading(true);
    try {
      const pathParts = window.location.pathname.split('/');
      const id = pathParts[pathParts.length - 2];
      
      const response = await adminFetch(`/api/admin/wallet/deposit-requests/${id}`);
      const data = await response.json();
      
      if (data.success && data.request) {
        setRequest(data.request);
      }
    } catch (error) {
      console.error('Failed to fetch deposit request:', error);
      toast.error('获取充币申请失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('已复制到剪贴板');
  };

  const getStatusBadge = (status: string) => {
    const map = {
      pending: { label: '申请中', className: 'bg-blue-500/10 text-blue-400' },
      approved: { label: '已充值', className: 'bg-green-500/10 text-green-400' },
      rejected: { label: '已拒绝', className: 'bg-red-500/10 text-red-400' },
    };
    const config = map[status as keyof typeof map];
    return config ? (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    ) : null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">加载中...</div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">未找到充币申请</div>
      </div>
    );
  }

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

  return (
    <div className="space-y-6">
      {/* 面包屑导航 */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>资源</span> / <span>充币申请</span> / <span className="text-white">充币申请 详情: {request.id}</span>
      </div>

      {/* 主内容区 */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="pt-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-xl font-semibold text-white">充币申请详情</h2>
            <div className="flex gap-2">
              <Button size="icon" variant="ghost" className="text-gray-400 hover:text-white hover:bg-slate-700">
                <MoreVertical className="w-5 h-5" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => handleCopy(window.location.href)} className="text-gray-400 hover:text-white hover:bg-slate-700">
                <Copy className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {/* ID */}
            <div className="flex justify-between items-start py-3 border-b border-slate-700">
              <Label className="text-gray-400 text-sm min-w-[120px]">ID</Label>
              <div className="flex-1 text-white">{request.id}</div>
            </div>

            {/* 账号 */}
            <div className="flex justify-between items-start py-3 border-b border-slate-700">
              <Label className="text-gray-400 text-sm min-w-[120px]">账号</Label>
              <div className="flex-1 text-white">{request.account}</div>
            </div>

            {/* 品种 */}
            <div className="flex justify-between items-start py-3 border-b border-slate-700">
              <Label className="text-gray-400 text-sm min-w-[120px]">品种</Label>
              <div className="flex-1 text-white">{request.currency}</div>
            </div>

            {/* 付款地址 */}
            <div className="flex justify-between items-start py-3 border-b border-slate-700">
              <Label className="text-gray-400 text-sm min-w-[120px]">付款地址</Label>
              <div className="flex-1 flex items-center gap-2">
                <span className="text-white font-mono text-sm">{request.paymentAddress}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-gray-400 hover:text-white"
                  onClick={() => handleCopy(request.paymentAddress)}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* 付款数量 */}
            <div className="flex justify-between items-start py-3 border-b border-slate-700">
              <Label className="text-gray-400 text-sm min-w-[120px]">付款数量</Label>
              <div className="flex-1 text-white font-mono">
                {typeof request.amount === 'number' 
                  ? request.amount.toFixed(8) 
                  : request.amount}
              </div>
            </div>

            {/* USD数量 */}
            <div className="flex justify-between items-start py-3 border-b border-slate-700">
              <Label className="text-gray-400 text-sm min-w-[120px]">USD数量</Label>
              <div className="flex-1 text-white font-mono">
                {typeof request.usdAmount === 'number' 
                  ? request.usdAmount.toFixed(8) 
                  : request.usdAmount}
              </div>
            </div>

            {/* 付款凭证 */}
            <div className="py-3 border-b border-slate-700">
              <Label className="text-gray-400 text-sm min-w-[120px] block mb-3">付款凭证</Label>
              <div className="space-y-3">
                {request.proofImage ? (
                  <div className="rounded-lg overflow-hidden border border-slate-700 bg-slate-900/50 p-4">
                    <img
                      src={request.proofImage}
                      alt="付款凭证"
                      className="w-full max-w-md mx-auto"
                    />
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm">暂无付款凭证</div>
                )}
              </div>
            </div>

            {/* 状态 */}
            <div className="flex justify-between items-start py-3 border-b border-slate-700">
              <Label className="text-gray-400 text-sm min-w-[120px]">状态</Label>
              <div className="flex-1">
                {getStatusBadge(request.status)}
              </div>
            </div>

            {/* 申请时间 */}
            <div className="flex justify-between items-start py-3">
              <Label className="text-gray-400 text-sm min-w-[120px]">申请时间</Label>
              <div className="flex-1 text-white text-sm">
                {formatDate(request.createdAt)}
                <span className="ml-2 text-gray-500">GMT</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 返回按钮 */}
      <div className="flex justify-start">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="border-slate-600 text-slate-300 hover:bg-slate-700"
        >
          返回
        </Button>
      </div>
    </div>
  );
}
