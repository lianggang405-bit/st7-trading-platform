'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Edit,
  Loader2,
  Clock,
  CheckCircle2,
  Percent,
  DollarSign,
  MinCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface SecondsConfig {
  id: number;
  seconds: number;
  status: string;
  profitRate: number;
  maxAmount: number;
  minAmount: number;
}

export default function ViewSecondsConfigPage() {
  const params = useParams();
  const router = useRouter();
  const configId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<SecondsConfig | null>(null);

  useEffect(() => {
    if (configId) {
      fetchConfig();
    }
  }, [configId]);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/contract/seconds-config/${configId}`);
      const data = await response.json();
      
      if (data.success) {
        setConfig(data.config);
      } else {
        toast.error(data.error || '获取秒数设置失败');
        router.push('/admin/contract/seconds-config');
      }
    } catch (error) {
      console.error('Failed to fetch config:', error);
      toast.error('获取秒数设置失败');
      router.push('/admin/contract/seconds-config');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'normal' || status === '正常') {
      return <Badge className="bg-green-500/10 text-green-400">正常</Badge>;
    } else if (status === 'disabled' || status === '禁用') {
      return <Badge className="bg-gray-500/10 text-gray-400">禁用</Badge>;
    }
    return <Badge className="bg-gray-500/10 text-gray-400">{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* 面包屑导航 */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>资源</span> / <span>秒数设置</span> / <span className="text-white">查看</span>
      </div>

      {/* 页面标题和操作栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin/contract/seconds-config')}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Button>
          <h1 className="text-2xl font-bold text-white">秒数设置详情</h1>
        </div>
        <Button
          onClick={() => router.push(`/admin/contract/seconds-config/edit/${configId}`)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Edit className="w-4 h-4 mr-2" />
          编辑
        </Button>
      </div>

      {/* 内容区域 */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="ml-3 text-gray-400">加载中...</span>
        </div>
      ) : config ? (
        <div className="grid gap-6">
          {/* 基本信息 */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">基本信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>秒数</span>
                  </div>
                  <div className="text-white font-medium text-xl">{config.seconds} 秒</div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>状态</span>
                  </div>
                  <div>{getStatusBadge(config.status)}</div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3 pt-4 border-t border-slate-700">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Percent className="w-4 h-4" />
                    <span>收益率</span>
                  </div>
                  <div className="text-blue-400 font-medium text-xl">
                    {(config.profitRate * 100).toFixed(2)}%
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <DollarSign className="w-4 h-4" />
                    <span>最高金额</span>
                  </div>
                  <div className="text-gray-300 font-medium">
                    {config.maxAmount.toLocaleString()}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <MinCircle className="w-4 h-4" />
                    <span>最低金额</span>
                  </div>
                  <div className="text-gray-300 font-medium">
                    {config.minAmount.toLocaleString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 说明信息 */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">说明</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-gray-400">
                <p>
                  此设置定义了 <span className="text-blue-400 font-medium">{config.seconds} 秒</span> 合约的交易参数。
                </p>
                <p>
                  收益率：<span className="text-blue-400 font-medium">{(config.profitRate * 100).toFixed(2)}%</span> - 用户盈利时获得的收益率
                </p>
                <p>
                  金额范围：<span className="text-blue-400 font-medium">{config.minAmount.toLocaleString()}</span> 至 <span className="text-blue-400 font-medium">{config.maxAmount.toLocaleString()}</span>
                </p>
                <p className="text-sm pt-2">
                  用户在选择 {config.seconds} 秒合约进行交易时，将使用此配置的参数。
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-gray-400">未找到秒数设置信息</p>
        </div>
      )}
    </div>
  );
}
