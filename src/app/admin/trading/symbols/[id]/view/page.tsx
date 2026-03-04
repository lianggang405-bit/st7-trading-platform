'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

// 图标组件
function SymbolIcon({ symbol }: { symbol: string }) {
  return (
    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
      <span className="text-white font-bold text-lg">{symbol.substring(0, 2)}</span>
    </div>
  );
}

interface SymbolDetail {
  id: number;
  name: string;
  alias: string;
  type: string;
  sort: number;
  isVisible: boolean;
  flashContractFee: number;
  contractSize: number;
  min_order_size: number;
  max_order_size: number;
}

export default function SymbolViewPage() {
  const router = useRouter();
  const params = useParams();
  const symbolId = params.id as string;

  const [symbol, setSymbol] = useState<SymbolDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSymbolDetail();
  }, [symbolId]);

  const fetchSymbolDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/trading/symbols/${symbolId}`);
      const data = await response.json();

      if (data.success) {
        setSymbol(data.symbol);
      } else {
        toast.error('获取品种详情失败');
        router.back();
      }
    } catch (error) {
      console.error('Failed to fetch symbol detail:', error);
      toast.error('获取品种详情失败');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('确定要删除此品种吗？此操作不可恢复！')) return;

    try {
      const response = await fetch(`/api/admin/trading/symbols/${symbolId}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        toast.success('品种删除成功');
        router.back();
      } else {
        toast.error('品种删除失败');
      }
    } catch (error) {
      console.error('Failed to delete symbol:', error);
      toast.error('品种删除失败');
    }
  };

  const getTypeBadge = (type: string) => {
    const typeColors: Record<string, string> = {
      crypto: 'bg-orange-500/10 text-orange-400',
      metal: 'bg-yellow-500/10 text-yellow-400',
      forex: 'bg-blue-500/10 text-blue-400',
      energy: 'bg-red-500/10 text-red-400',
      indices: 'bg-purple-500/10 text-purple-400',
    };
    const typeNames: Record<string, string> = {
      crypto: '加密货币',
      metal: '贵金属',
      forex: '外汇',
      energy: '能源',
      indices: '指数',
    };
    return (
      <Badge className={typeColors[type] || 'bg-gray-500/10 text-gray-400'}>
        {typeNames[type] || type}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!symbol) {
    return (
      <div className="flex items-center justify-center h-screen text-white">
        <div>品种不存在</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 面包屑导航 */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>资源</span>
        <span>/</span>
        <span>品种管理</span>
        <span>/</span>
        <span className="text-white">查看品种</span>
      </div>

      {/* 页面标题和操作栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-white">查看品种</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-slate-600 hover:bg-slate-700 text-white"
            onClick={() => router.push(`/admin/trading/symbols/${symbolId}/edit`)}
          >
            <Edit className="w-4 h-4 mr-2" />
            编辑
          </Button>
          <Button
            variant="outline"
            className="border-red-600 hover:bg-red-600/10 text-red-400"
            onClick={handleDelete}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            删除
          </Button>
        </div>
      </div>

      {/* 品种信息卡片 */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <div className="flex items-center gap-4">
            <SymbolIcon symbol={symbol.name} />
            <div className="flex-1">
              <CardTitle className="text-2xl text-white">{symbol.name}</CardTitle>
              <p className="text-sm text-gray-400 mt-1">{symbol.alias}</p>
            </div>
            {getTypeBadge(symbol.type)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">品种ID</label>
                <p className="text-lg text-white mt-1">{symbol.id}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">品种名称</label>
                <p className="text-lg text-white mt-1">{symbol.name}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">品种别名</label>
                <p className="text-lg text-white mt-1">{symbol.alias}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">品种类型</label>
                <p className="mt-1">{getTypeBadge(symbol.type)}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">排序</label>
                <p className="text-lg text-white mt-1">{symbol.sort}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">是否展示</label>
                <p className="mt-1">
                  {symbol.isVisible ? (
                    <Badge className="bg-green-500/10 text-green-400">展示内容</Badge>
                  ) : (
                    <Badge className="bg-gray-500/10 text-gray-400">隐藏内容</Badge>
                  )}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-400">秒合约手续费</label>
                <p className="text-lg text-white mt-1">{symbol.flashContractFee.toFixed(2)}%</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">每张</label>
                <p className="text-lg text-white mt-1">{symbol.contractSize}</p>
              </div>
            </div>
          </div>

          {/* 订单设置 */}
          <div className="mt-6 pt-6 border-t border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">订单设置</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-sm text-gray-400">最小订单量</label>
                <p className="text-lg text-white mt-1">{symbol.min_order_size}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">最大订单量</label>
                <p className="text-lg text-white mt-1">{symbol.max_order_size}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
