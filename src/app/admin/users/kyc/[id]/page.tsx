'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, Heart } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

interface KYCDetail {
  id: number;
  userId: number;
  email: string;
  realName: string;
  idNumber: string;
  idCardFront: string;
  idCardBack: string;
  applyTime: string;
  reviewTime: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectReason: string;
}

export default function KYCDetailPage() {
  const params = useParams();
  const router = useRouter();
  const kycId = params.id as string;

  const [kyc, setKyc] = useState<KYCDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKYCDetail();
  }, [kycId]);

  const fetchKYCDetail = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users/kyc/${kycId}`);
      const data = await response.json();
      if (data.success) {
        setKyc(data.kyc);
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

  const handleDownload = (url: string, filename: string) => {
    if (!url) {
      toast.error('图片不存在');
      return;
    }

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-white">
        加载中...
      </div>
    );
  }

  if (!kyc) {
    return (
      <div className="flex items-center justify-center h-screen text-white">
        实名认证详情不存在
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 面包屑导航 */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>资源</span>
        <span>/</span>
        <span>实名管理</span>
        <span>/</span>
        <span className="text-white">实名认证详情</span>
      </div>

      {/* 返回按钮 */}
      <Button
        variant="ghost"
        onClick={() => router.push('/admin/users/kyc')}
        className="text-gray-400 hover:text-white mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        返回列表
      </Button>

      {/* 用户信息卡片 */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold text-white mb-6">用户信息</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-gray-400 text-sm mb-1">用户ID</div>
              <div className="text-gray-200">{kyc.userId}</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-1">邮箱</div>
              <div className="text-gray-200">{kyc.email}</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-1">真实姓名</div>
              <div className="text-gray-200">{kyc.realName}</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-1">身份证号</div>
              <div className="text-gray-200">{maskIdNumber(kyc.idNumber)}</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-1">申请时间</div>
              <div className="text-gray-200">{kyc.applyTime}</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-1">审核时间</div>
              <div className="text-gray-200">{kyc.reviewTime}</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-1">审核状态</div>
              <div className="text-gray-200">{getStatusBadge(kyc.status)}</div>
            </div>
            {kyc.status === 'rejected' && (
              <div>
                <div className="text-gray-400 text-sm mb-1">拒绝原因</div>
                <div className="text-red-400">{kyc.rejectReason}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 证件照片展示 */}
      <div className="grid grid-cols-1 gap-6">
        {/* 证件正面 */}
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white mb-2">证件照正面</h3>
              <div className="bg-slate-900 rounded-lg overflow-hidden min-h-[400px] flex items-center justify-center">
                {kyc.idCardFront ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={kyc.idCardFront}
                      alt="证件照正面"
                      fill
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div className="text-gray-500">暂无图片</div>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => handleDownload(kyc.idCardFront, '证件照正面.jpg')}
              disabled={!kyc.idCardFront}
              className="border-slate-600 text-gray-400 hover:text-white hover:bg-slate-700"
            >
              <Download className="w-4 h-4 mr-2" />
              下载
            </Button>
          </CardContent>
        </Card>

        {/* 证件反面 */}
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white mb-2">证件照反面</h3>
              <div className="bg-slate-900 rounded-lg overflow-hidden min-h-[400px] flex items-center justify-center">
                {kyc.idCardBack ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={kyc.idCardBack}
                      alt="证件照反面"
                      fill
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div className="text-gray-500">暂无图片</div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => handleDownload(kyc.idCardBack, '证件照反面.jpg')}
                disabled={!kyc.idCardBack}
                className="border-slate-600 text-gray-400 hover:text-white hover:bg-slate-700"
              >
                <Download className="w-4 h-4 mr-2" />
                下载
              </Button>
              <Heart className="w-6 h-6 text-gray-500 hover:text-red-500 cursor-pointer transition-colors" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
