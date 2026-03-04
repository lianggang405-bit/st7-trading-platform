'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Edit,
  Loader2,
  Calendar,
  Hash,
  DollarSign,
  Activity,
} from 'lucide-react';
import { toast } from 'sonner';

interface TradingBot {
  id: number;
  name: string;
  pairId: number;
  pairSymbol?: string;
  floatValue: number;
  createdAt: string;
  updatedAt: string;
}

export default function ViewBotPage() {
  const params = useParams();
  const router = useRouter();
  const botId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [bot, setBot] = useState<TradingBot | null>(null);

  useEffect(() => {
    if (botId) {
      fetchBot();
    }
  }, [botId]);

  const fetchBot = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/trading/bots/${botId}`);
      const data = await response.json();
      
      if (data.success) {
        // 获取交易对信息
        const botData = data.bot;
        if (botData.pairId) {
          try {
            const pairResponse = await fetch(`/api/admin/trading/pairs/${botData.pairId}`);
            const pairData = await pairResponse.json();
            if (pairData.success) {
              botData.pairSymbol = pairData.pair?.symbol;
            }
          } catch (err) {
            console.error('Failed to fetch pair info:', err);
          }
        }
        setBot(botData);
      } else {
        toast.error(data.error || '获取机器人信息失败');
        router.push('/admin/trading/bots');
      }
    } catch (error) {
      console.error('Failed to fetch bot:', error);
      toast.error('获取机器人信息失败');
      router.push('/admin/trading/bots');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('zh-CN');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      {/* 面包屑导航 */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>资源</span> / <span>调控机器人</span> / <span className="text-white">查看</span>
      </div>

      {/* 页面标题和操作栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin/trading/bots')}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Button>
          <h1 className="text-2xl font-bold text-white">调控机器人详情</h1>
        </div>
        <Button
          onClick={() => router.push(`/admin/trading/bots/edit/${botId}`)}
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
      ) : bot ? (
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
                  <div className="text-white font-medium">{bot.id}</div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Activity className="w-4 h-4" />
                    <span>名称</span>
                  </div>
                  <div className="text-white font-medium">{bot.name}</div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <DollarSign className="w-4 h-4" />
                    <span>交易对</span>
                  </div>
                  <div className="text-blue-400 font-medium">
                    {bot.pairSymbol || `ID: ${bot.pairId}`}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Activity className="w-4 h-4" />
                    <span>浮点值</span>
                  </div>
                  <div className="text-white font-medium font-mono">
                    {bot.floatValue.toFixed(8)}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-700">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <Calendar className="w-4 h-4" />
                      <span>创建时间</span>
                    </div>
                    <div className="text-white">{formatDate(bot.createdAt)}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <Calendar className="w-4 h-4" />
                      <span>更新时间</span>
                    </div>
                    <div className="text-white">{formatDate(bot.updatedAt)}</div>
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
                  <span className="text-blue-400 font-medium">数据源真实价格</span> +{' '}
                  <span className="text-yellow-400 font-medium">浮点值</span> ={' '}
                  <span className="text-green-400 font-medium">调控后的行情实时价格</span>
                </p>
                <p className="text-sm">
                  调控机器人用于调整特定交易对的行情价格，通过设置浮点值来控制价格浮动。
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-gray-400">未找到机器人信息</p>
        </div>
      )}
    </div>
  );
}
