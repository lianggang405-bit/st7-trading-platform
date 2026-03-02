'use client';

import { useEffect, useState } from 'react';
import { AuthGuard } from '../../../components/auth-guard';
import { PageShell } from '../../../components/layout/page-shell';
import { useAuthStore } from '../../../stores/authStore';
import { Card } from '@/components/ui/card';
import { Download, Upload, UserCheck, Clock, CheckCircle, XCircle } from 'lucide-react';

interface Application {
  id: number;
  type: 'deposit' | 'withdraw' | 'verification';
  status: 'pending' | 'approved' | 'rejected';
  amount?: string;
  bankName?: string;
  bankAccount?: string;
  realName?: string;
  idCard?: string;
  rejectReason?: string;
  createdAt: string;
  reviewedAt?: string;
}

export default function ApplicationsPage() {
  const { isHydrated } = useAuthStore();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/applications');
      const data = await response.json();
      if (data.success) {
        setApplications(data.applications);
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <Download className="w-5 h-5 text-blue-600" />;
      case 'withdraw':
        return <Upload className="w-5 h-5 text-red-600" />;
      case 'verification':
        return <UserCheck className="w-5 h-5 text-purple-600" />;
      default:
        return null;
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'deposit':
        return '入金申請';
      case 'withdraw':
        return '提現申請';
      case 'verification':
        return '實名認證';
      default:
        return type;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusName = (status: string) => {
    switch (status) {
      case 'pending':
        return '待審核';
      case 'approved':
        return '已通過';
      case 'rejected':
        return '已拒絕';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'approved':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'rejected':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <PageShell loading={!isHydrated}>
      <AuthGuard>
        <div className="min-h-screen bg-gray-50 pb-20">
          {/* 顶部导航 */}
          <div className="bg-white shadow-sm">
            <div className="px-4 py-4">
              <h1 className="text-lg font-semibold">申請記錄</h1>
            </div>
          </div>

          {/* 主要内容 */}
          <div className="px-4 py-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-500">加載中...</div>
              </div>
            ) : applications.length === 0 ? (
              <Card className="p-8">
                <div className="text-center text-gray-500">
                  <p className="text-lg mb-2">暫無申請記錄</p>
                  <p className="text-sm">您可以提交入金、提現或實名認證申請</p>
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => (
                  <Card key={app.id} className="p-4">
                    <div className="flex items-start gap-4">
                      {/* 类型图标 */}
                      <div className="flex-shrink-0 p-2 bg-gray-100 rounded-lg">
                        {getTypeIcon(app.type)}
                      </div>

                      {/* 主要内容 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {getTypeName(app.type)}
                          </h3>
                          <div
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                              app.status
                            )}`}
                          >
                            {getStatusIcon(app.status)}
                            {getStatusName(app.status)}
                          </div>
                        </div>

                        {/* 申请详情 */}
                        <div className="space-y-1 text-sm text-gray-600">
                          {app.type === 'deposit' && (
                            <>
                              <div className="flex justify-between">
                                <span>金額:</span>
                                <span className="font-medium text-gray-900">
                                  ${parseFloat(app.amount || '0').toLocaleString()}
                                </span>
                              </div>
                              {app.bankName && (
                                <div className="flex justify-between">
                                  <span>銀行:</span>
                                  <span className="font-medium text-gray-900">{app.bankName}</span>
                                </div>
                              )}
                              {app.bankAccount && (
                                <div className="flex justify-between">
                                  <span>賬號:</span>
                                  <span className="font-mono text-gray-900">
                                    {app.bankAccount.slice(0, 4)}****{app.bankAccount.slice(-4)}
                                  </span>
                                </div>
                              )}
                            </>
                          )}

                          {app.type === 'withdraw' && (
                            <>
                              <div className="flex justify-between">
                                <span>金額:</span>
                                <span className="font-medium text-gray-900">
                                  ${parseFloat(app.amount || '0').toLocaleString()}
                                </span>
                              </div>
                              {app.bankName && (
                                <div className="flex justify-between">
                                  <span>銀行:</span>
                                  <span className="font-medium text-gray-900">{app.bankName}</span>
                                </div>
                              )}
                              {app.bankAccount && (
                                <div className="flex justify-between">
                                  <span>賬號:</span>
                                  <span className="font-mono text-gray-900">
                                    {app.bankAccount.slice(0, 4)}****{app.bankAccount.slice(-4)}
                                  </span>
                                </div>
                              )}
                            </>
                          )}

                          {app.type === 'verification' && (
                            <>
                              <div className="flex justify-between">
                                <span>真實姓名:</span>
                                <span className="font-medium text-gray-900">{app.realName}</span>
                              </div>
                              {app.idCard && (
                                <div className="flex justify-between">
                                  <span>身份證號:</span>
                                  <span className="font-mono text-gray-900">
                                    {app.idCard.slice(0, 3)}***********{app.idCard.slice(-4)}
                                  </span>
                                </div>
                              )}
                            </>
                          )}

                          <div className="flex justify-between text-xs text-gray-500">
                            <span>申請時間:</span>
                            <span>{new Date(app.createdAt).toLocaleString('zh-CN')}</span>
                          </div>

                          {app.reviewedAt && (
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>審批時間:</span>
                              <span>{new Date(app.reviewedAt).toLocaleString('zh-CN')}</span>
                            </div>
                          )}
                        </div>

                        {/* 拒绝理由 */}
                        {app.rejectReason && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-800">
                              <span className="font-medium">拒絕理由：</span>
                              {app.rejectReason}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </AuthGuard>
    </PageShell>
  );
}
