'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface TradingPairDetail {
  id: number;
  currencyId: number;
  symbol: string;
  isVisible: boolean;
  minOrderSize: number;
  maxOrderSize: number;
  contractFee: number;
  createdAt?: string;
}

// 交易对图标组件
function TradingPairIcon({ symbol }: { symbol: string }) {
  return (
    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
      <span className="text-white font-bold text-sm">{symbol.substring(0, 3)}</span>
    </div>
  );
}

export default function TradingPairViewPage() {
  const router = useRouter();
  const params = useParams();
  const pairId = params.id as string;

  const [pair, setPair] = useState<TradingPairDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPairDetail();
  }, [pairId]);

  const fetchPairDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/trading/pairs/${pairId}`);
      const data = await response.json();

      if (data.success) {
        setPair(data.pair);
      } else {
        toast.error('获取交易对详情失败');
        router.back();
      }
    } catch (error) {
      console.error('Failed to fetch trading pair detail:', error);
      toast.error('获取交易对详情失败');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('确定要删除此交易对吗？此操作不可恢复！')) return;

    try {
      const response = await fetch(`/api/admin/trading/pairs/${pairId}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        toast.success('交易对删除成功');
        router.push('/admin/trading/pairs');
      } else {
        toast.error('交易对删除失败');
      }
    } catch (error) {
      console.error('Failed to delete trading pair:', error);
      toast.error('交易对删除失败');
    }
  };

  const getVisibilityBadge = (isVisible: boolean) => {
    return isVisible ? (
      <Badge className="bg-green-500/10 text-green-400">展示内容</Badge>
    ) : (
      <Badge className="bg-gray-500/10 text-gray-400">隐藏内容</Badge>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('zh-CN');
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!pair) {
    return (
      <div className="flex items-center justify-center h-screen text-white">
        <div>交易对不存在</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-2 sm:px-0">
      {/* 面包屑导航 - 手机端隐藏 */}
      <div className="hidden sm:flex items-center gap-2 text-sm text-gray-400">
        <span>资源</span>
        <span>/</span>
        <span>交易对</span>
        <span>/</span>
        <span className="text-white">查看交易对</span>
      </div>

      {/* 页面标题和操作栏 */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold text-white truncate">查看交易对</h1>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button
            variant="outline"
            className="border-slate-600 hover:bg-slate-700 text-white"
            onClick={() => router.push(`/admin/trading/pairs/${pairId}/edit`)}
          >
            <Edit className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">编辑</span>
          </Button>
          <Button
            variant="outline"
            className="border-red-600 hover:bg-red-600/10 text-red-400"
            onClick={handleDelete}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">删除</span>
          </Button>
        </div>
      </div>

      {/* 交易对信息卡片 */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <div className="flex items-center gap-4">
            <TradingPairIcon symbol={pair.symbol} />
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl sm:text-2xl text-white truncate">{pair.symbol}</CardTitle>
              <p className="text-sm text-gray-400 mt-1">ID: {pair.id}</p>
            </div>
            {getVisibilityBadge(pair.isVisible)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">交易对ID</label>
                <p className="text-base sm:text-lg text-white mt-1">{pair.id}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">法币ID</label>
                <p className="text-base sm:text-lg text-white mt-1">{pair.currencyId}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">交易对名称</label>
                <p className="text-base sm:text-lg text-white mt-1">{pair.symbol}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">是否展示</label>
                <p className="mt-1">{getVisibilityBadge(pair.isVisible)}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">合约最小下单数量</label>
                <p className="text-base sm:text-lg text-white mt-1">{pair.minOrderSize}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">合约最大下单数量</label>
                <p className="text-base sm:text-lg text-white mt-1">{pair.maxOrderSize.toLocaleString()}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">合约手续费%</label>
                <p className="text-base sm:text-lg text-white mt-1">{pair.contractFee.toFixed(4)}%</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">创建时间</label>
                <p className="text-base sm:text-lg text-white mt-1">{formatDate(pair.createdAt)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
