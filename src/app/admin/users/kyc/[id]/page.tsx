'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

interface KYCRequest {
  id: number;
  userId: number;
  email: string;
  realName: string;
  idNumber: string;
  idCardFront?: string;
  idCardBack?: string;
  applyTime: string;
  reviewTime?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectReason?: string;
}

export default function KYCDetailPage() {
  const params = useParams();
  const router = useRouter();
  const kycId = params.id as string;

  const [kycRequest, setKYCRequest] = useState<KYCRequest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKYCDetail();
  }, [kycId]);

  const fetchKYCDetail = async () => {
    setLoading(true);
    try {
      // 从列表页面获取详细数据，这里简化处理
      const response = await fetch(`/api/admin/users/kyc`);
      const data = await response.json();
      if (data.success) {
        const request = data.requests.find((r: KYCRequest) => r.id === parseInt(kycId));
        if (request) {
          setKYCRequest(request);
        } else {
          toast.error('实名认证记录不存在');
          router.push('/admin/users/kyc');
        }
      } else {
        toast.error('获取实名认证详情失败');
      }
    } catch (error) {
      console.error('Failed to fetch KYC detail:', error);
      toast.error('获取实名认证详情失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string; icon: React.ReactNode; text: string }> = {
      pending: {
        color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
        icon: <Clock className="w-4 h-4" />,
        text: '待审核',
      },
      approved: {
        color: 'bg-green-500/10 text-green-400 border-green-500/20',
        icon: <CheckCircle className="w-4 h-4" />,
        text: '通过审核',
      },
      rejected: {
        color: 'bg-red-500/10 text-red-400 border-red-500/20',
        icon: <XCircle className="w-4 h-4" />,
        text: '拒绝审核',
      },
    };
    const config = statusMap[status] || statusMap.pending;
    return (
      <Badge className={`${config.color} border`}>
        {config.icon}
        <span className="ml-1">{config.text}</span>
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-white">
        加载中...
      </div>
    );
  }

  if (!kycRequest) {
    return (
      <div className="flex items-center justify-center h-screen text-white">
        实名认证记录不存在
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 面包屑导航 */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white"
          onClick={() => router.push('/admin/users/kyc')}
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          返回
        </Button>
        <span>/</span>
        <span>实名管理</span>
        <span>/</span>
        <span className="text-white">实名认证详情</span>
      </div>

      {/* 基本信息 */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">基本信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400">申请ID</label>
              <p className="text-white mt-1">{kycRequest.id}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">用户邮箱</label>
              <p className="text-white mt-1">{kycRequest.email || '—'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">真实姓名</label>
              <p className="text-white mt-1">{kycRequest.realName}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">证件号码</label>
              <p className="text-white mt-1">{kycRequest.idNumber}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">申请时间</label>
              <p className="text-white mt-1">{kycRequest.applyTime}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">审核时间</label>
              <p className="text-white mt-1">{kycRequest.reviewTime || '—'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">状态</label>
              <div className="mt-1">{getStatusBadge(kycRequest.status)}</div>
            </div>
            {kycRequest.status === 'rejected' && (
              <div className="col-span-2">
                <label className="text-sm text-gray-400">拒绝原因</label>
                <p className="text-red-400 mt-1">{kycRequest.rejectReason || '—'}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 证件照片 */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">证件照片</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="text-sm text-gray-400 block mb-2">身份证正面</label>
            {kycRequest.idCardFront ? (
              <div className="relative w-full max-w-lg h-64 bg-slate-900 rounded-lg overflow-hidden">
                <Image
                  src={kycRequest.idCardFront}
                  alt="身份证正面"
                  fill
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="w-full max-w-lg h-64 bg-slate-900 rounded-lg flex items-center justify-center text-gray-500">
                未上传身份证正面
              </div>
            )}
          </div>

          <div>
            <label className="text-sm text-gray-400 block mb-2">身份证反面</label>
            {kycRequest.idCardBack ? (
              <div className="relative w-full max-w-lg h-64 bg-slate-900 rounded-lg overflow-hidden">
                <Image
                  src={kycRequest.idCardBack}
                  alt="身份证反面"
                  fill
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="w-full max-w-lg h-64 bg-slate-900 rounded-lg flex items-center justify-center text-gray-500">
                未上传身份证反面
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
