'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, CheckCircle, XCircle, Clock, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import adminFetch from '@/lib/admin-fetch';

interface BankWithdrawRequest {
  id: number;
  userId: number;
  email: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  amount: number;
  currency: string;
  fee: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  remark?: string;
  createdAt: string;
}

export default function BankWithdrawalsPage() {
  const [requests, setRequests] = useState<BankWithdrawRequest[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await adminFetch('/api/admin/withdraw-settings/bank-withdrawals');
      const data = await response.json();
      if (data.success) setRequests(data.requests || []);
    } catch (error) {
      console.error('Failed to fetch bank withdrawals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      const response = await adminFetch(`/api/admin/withdraw-settings/bank-withdrawals/${id}/approve`, { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        toast.success('银行卡提币申请已通过');
        fetchRequests();
      }
    } catch (error) {
      toast.error('操作失败');
    }
  };

  const handleReject = async (id: number) => {
    if (!confirm('确认拒绝该银行卡提币申请？')) return;
    try {
      const response = await adminFetch(`/api/admin/withdraw-settings/bank-withdrawals/${id}/reject`, { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        toast.success('银行卡提币申请已拒绝');
        fetchRequests();
      }
    } catch (error) {
      toast.error('操作失败');
    }
  };

  const getStatusBadge = (status: string) => {
    const map = {
      pending: { label: '待审核', className: 'bg-yellow-500/10 text-yellow-400', icon: Clock },
      approved: { label: '已通过', className: 'bg-green-500/10 text-green-400', icon: CheckCircle },
      rejected: { label: '已拒绝', className: 'bg-red-500/10 text-red-400', icon: XCircle },
      completed: { label: '已完成', className: 'bg-blue-500/10 text-blue-400', icon: CheckCircle },
    };
    const config = map[status as keyof typeof map];
    return (
      <Badge className={config?.className}>
        {config?.icon && <config.icon className="w-3 h-3 mr-1" />}
        {config?.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>桌面</span> / <span>提币设置</span> / <span className="text-white">银行卡提币申请</span>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-white">银行卡提币申请</h1>
        <p className="text-gray-400 mt-1">查看和处理用户的银行卡提币申请</p>
      </div>
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-white">银行卡提币申请列表</CardTitle>
            <CardDescription className="text-gray-400">共 {requests.length} 条申请</CardDescription>
          </div>
          <Button variant="outline" size="icon" onClick={fetchRequests} className="border-slate-600 hover:bg-slate-700">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent>
          {requests.map((req) => (
            <div key={req.id} className="p-4 bg-slate-700/50 rounded-lg mb-2">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-8 h-8 text-green-400" />
                  <div>
                    <div className="text-white font-medium">{req.email}</div>
                    <div className="text-gray-400 text-sm">{req.bankName} - {req.amount} {req.currency}</div>
                    <div className="text-gray-500 text-xs">持卡人: {req.accountHolder}</div>
                    <div className="text-gray-500 text-xs">卡号: ****{req.accountNumber.slice(-4)}</div>
                    <div className="text-gray-500 text-xs">手续费: {req.fee} {req.currency}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(req.status)}
                  {req.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleApprove(req.id)} className="bg-green-600 hover:bg-green-700">
                        通过
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleReject(req.id)} className="border-red-600 text-red-400 hover:bg-red-600/10">
                        拒绝
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              {req.remark && (
                <div className="mt-2 text-gray-500 text-sm">备注: {req.remark}</div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
