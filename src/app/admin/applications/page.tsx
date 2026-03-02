'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  RefreshCw,
  Check,
  X,
  Download,
  Upload,
  UserCheck,
} from 'lucide-react';
import { toast } from 'sonner';

interface Application {
  id: number;
  userId: number;
  type: 'deposit' | 'withdraw' | 'verification';
  status: 'pending' | 'approved' | 'rejected';
  amount?: string;
  bankName?: string;
  bankAccount?: string;
  realName?: string;
  idCard?: string;
  rejectReason?: string;
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  user?: {
    id: number;
    email: string;
    username: string;
    accountType: 'demo' | 'real';
  };
}

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // 审批对话框
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'rejected'>('approved');
  const [rejectReason, setRejectReason] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, [statusFilter, typeFilter]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);

      const response = await fetch(`/api/admin/applications?${params.toString()}`);
      const data = await response.json();
      if (data.success) {
        // API 直接返回 application 数组，不需要再解包
        setApplications(data.applications);
        setFilteredApplications(data.applications);
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error);
      toast.error('获取申请列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async () => {
    if (!selectedApplication) return;

    if (reviewStatus === 'rejected' && !rejectReason.trim()) {
      toast.error('拒绝时必须填写拒绝理由');
      return;
    }

    setReviewLoading(true);
    try {
      const response = await fetch(`/api/admin/applications/${selectedApplication.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: reviewStatus,
          rejectReason: reviewStatus === 'rejected' ? rejectReason : undefined,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(reviewStatus === 'approved' ? '已批准' : '已拒绝');
        setReviewDialogOpen(false);
        setRejectReason('');
        setSelectedApplication(null);
        fetchApplications();
      } else {
        toast.error(data.error || '操作失败');
      }
    } catch (error) {
      console.error('Review error:', error);
      toast.error('操作失败，请稍后重试');
    } finally {
      setReviewLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <Download className="w-4 h-4" />;
      case 'withdraw':
        return <Upload className="w-4 h-4" />;
      case 'verification':
        return <UserCheck className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'deposit':
        return '入金申请';
      case 'withdraw':
        return '提现申请';
      case 'verification':
        return '实名认证';
      default:
        return type;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            待审批
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            已批准
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            已拒绝
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">申请审批</h1>
        <p className="text-gray-600 mt-1">处理用户的入金、提现和实名认证申请</p>
      </div>

      {/* 筛选 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="pending">待审批</SelectItem>
                <SelectItem value="approved">已批准</SelectItem>
                <SelectItem value="rejected">已拒绝</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="deposit">入金申请</SelectItem>
                <SelectItem value="withdraw">提现申请</SelectItem>
                <SelectItem value="verification">实名认证</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchApplications} variant="outline" size="icon">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 申请列表 */}
      <Card>
        <CardHeader>
          <CardTitle>申请列表</CardTitle>
          <CardDescription>
            共 {filteredApplications.length} 个申请
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8 text-gray-500">加载中...</div>
            ) : filteredApplications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">暂无申请数据</div>
            ) : (
              filteredApplications.map((app) => (
                <div
                  key={app.id}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* 基本信息 */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-2 font-medium text-gray-900">
                          {getTypeIcon(app.type)}
                          {getTypeName(app.type)}
                        </span>
                        {getStatusBadge(app.status)}
                        <span className="text-sm text-gray-500">
                          #{app.id}
                        </span>
                      </div>

                      <div className="text-sm text-gray-600">
                        <div>申请人: {app.user?.email} ({app.user?.username})</div>
                        <div className="mt-1">
                          {app.type === 'deposit' && (
                            <>
                              <span>金额: ${parseFloat(app.amount || '0').toLocaleString()}</span>
                              {app.bankName && <span> | 银行: {app.bankName}</span>}
                            </>
                          )}
                          {app.type === 'withdraw' && (
                            <>
                              <span>金额: ${parseFloat(app.amount || '0').toLocaleString()}</span>
                              {app.bankName && <span> | 银行: {app.bankName}</span>}
                            </>
                          )}
                          {app.type === 'verification' && (
                            <>
                              <span>真实姓名: {app.realName}</span>
                              {app.idCard && <span> | 身份证: {app.idCard}</span>}
                            </>
                          )}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          提交时间: {new Date(app.createdAt).toLocaleString('zh-CN')}
                        </div>
                        {app.rejectReason && (
                          <div className="mt-1 text-sm text-red-600">
                            拒绝理由: {app.rejectReason}
                          </div>
                        )}
                        {app.reviewedBy && (
                          <div className="mt-1 text-xs text-gray-500">
                            审批人: {app.reviewedBy} | 审批时间:{' '}
                            {app.reviewedAt ? new Date(app.reviewedAt).toLocaleString('zh-CN') : '-'}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    {app.status === 'pending' && (
                      <div className="flex gap-2">
                        <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => setSelectedApplication(app)}
                            >
                              <Check className="w-4 h-4 mr-1" />
                              批准
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>审批申请</DialogTitle>
                              <DialogDescription>
                                {getTypeName(app.type)} #{app.id}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label>审批结果</Label>
                                <Select
                                  value={reviewStatus}
                                  onValueChange={(value: any) => setReviewStatus(value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="approved">批准</SelectItem>
                                    <SelectItem value="rejected">拒绝</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              {reviewStatus === 'rejected' && (
                                <div className="space-y-2">
                                  <Label htmlFor="rejectReason">拒绝理由 *</Label>
                                  <Textarea
                                    id="rejectReason"
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="请输入拒绝理由"
                                    rows={3}
                                  />
                                </div>
                              )}
                            </div>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => setReviewDialogOpen(false)}
                              >
                                取消
                              </Button>
                              <Button
                                onClick={handleReview}
                                disabled={reviewLoading}
                                variant={reviewStatus === 'approved' ? 'default' : 'destructive'}
                              >
                                {reviewLoading
                                  ? '处理中...'
                                  : reviewStatus === 'approved'
                                  ? '批准'
                                  : '拒绝'}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
