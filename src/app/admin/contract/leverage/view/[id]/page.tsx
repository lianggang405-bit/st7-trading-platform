'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Edit,
  Loader2,
  Hash,
  Type,
  Calculator,
  Tag,
} from 'lucide-react';
import { toast } from 'sonner';

interface LeverageSetting {
  id: number;
  type: string;
  value: number;
  symbol: string;
}

export default function ViewLeveragePage() {
  const params = useParams();
  const router = useRouter();
  const settingId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [setting, setSetting] = useState<LeverageSetting | null>(null);

  useEffect(() => {
    if (settingId) {
      fetchSetting();
    }
  }, [settingId]);

  const fetchSetting = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/contract/leverage/${settingId}`);
      const data = await response.json();
      
      if (data.success) {
        setSetting(data.setting);
      } else {
        toast.error(data.error || '获取倍数设置失败');
        router.push('/admin/contract/leverage');
      }
    } catch (error) {
      console.error('Failed to fetch setting:', error);
      toast.error('获取倍数设置失败');
      router.push('/admin/contract/leverage');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 面包屑导航 */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>资源</span> / <span>倍数设置</span> / <span className="text-white">查看</span>
      </div>

      {/* 页面标题和操作栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin/contract/leverage')}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Button>
          <h1 className="text-2xl font-bold text-white">倍数设置详情</h1>
        </div>
        <Button
          onClick={() => router.push(`/admin/contract/leverage/edit/${settingId}`)}
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
      ) : setting ? (
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
                    <Hash className="w-4 h-4" />
                    <span>ID</span>
                  </div>
                  <div className="text-white font-medium">{setting.id}</div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Type className="w-4 h-4" />
                    <span>类型</span>
                  </div>
                  <div className="text-white font-medium">{setting.type}</div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Calculator className="w-4 h-4" />
                    <span>值</span>
                  </div>
                  <div className="text-blue-400 font-medium text-xl">
                    {setting.value}x
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Tag className="w-4 h-4" />
                    <span>品种</span>
                  </div>
                  <div className="text-blue-400 font-medium">{setting.symbol}</div>
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
                  此设置定义了 <span className="text-blue-400 font-medium">{setting.symbol}</span> 品种的交易倍数。
                </p>
                <p>
                  当前设置：<span className="text-blue-400 font-medium">{setting.value}x</span> 倍杠杆
                </p>
                <p className="text-sm pt-2">
                  用户在交易该品种时，可以选择使用此倍数进行交易。
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-gray-400">未找到倍数设置信息</p>
        </div>
      )}
    </div>
  );
}
