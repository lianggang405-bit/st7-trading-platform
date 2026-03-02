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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

interface MarketAdjustment {
  id: number;
  action: 'rise' | 'fall' | 'flat';
  symbol: string;
  beforePrice: string;
  afterPrice: string;
  changePercent: string;
  createdBy: string;
  createdAt: string;
}

interface TradingPair {
  id: number;
  symbol: string;
  is_visible: boolean;
}

export default function AdminMarketPage() {
  const [adjustments, setAdjustments] = useState<MarketAdjustment[]>([]);
  const [tradingPairs, setTradingPairs] = useState<TradingPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [adjusting, setAdjusting] = useState(false);

  // 调控表单
  const [action, setAction] = useState<'rise' | 'fall' | 'flat'>('rise');
  const [symbol, setSymbol] = useState('BTC/USDT');
  const [changePercent, setChangePercent] = useState('5');

  useEffect(() => {
    fetchAdjustments();
    fetchTradingPairs();
  }, []);

  const fetchAdjustments = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/market/adjustments?limit=20');
      const data = await response.json();
      if (data.success) {
        setAdjustments(data.adjustments);
      }
    } catch (error) {
      console.error('Failed to fetch adjustments:', error);
      toast.error('获取调控记录失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchTradingPairs = async () => {
    try {
      const response = await fetch('/api/admin/trading/pairs?limit=100');
      const data = await response.json();
      if (data.success) {
        const visiblePairs = data.pairs.filter((p: TradingPair) => p.is_visible);
        setTradingPairs(visiblePairs);
        // 如果当前选中的交易对不在列表中，选择第一个
        if (visiblePairs.length > 0 && !visiblePairs.find((p: TradingPair) => p.symbol === symbol)) {
          setSymbol(visiblePairs[0].symbol);
        }
      }
    } catch (error) {
      console.error('Failed to fetch trading pairs:', error);
    }
  };

  const handleAdjust = async () => {
    if (action === 'flat') {
      // 横盘不需要输入百分比
      await performAdjustment();
    } else {
      const percent = parseFloat(changePercent);
      if (isNaN(percent) || percent <= 0 || percent > 50) {
        toast.error('请输入有效的百分比 (0-50)');
        return;
      }
      await performAdjustment(percent);
    }
  };

  const performAdjustment = async (percent?: number) => {
    setAdjusting(true);
    try {
      const response = await fetch('/api/admin/market/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          symbol,
          changePercent: percent,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('市场调控成功');
        fetchAdjustments();
      } else {
        toast.error(data.error || '调控失败');
      }
    } catch (error) {
      console.error('Market adjust error:', error);
      toast.error('调控失败，请稍后重试');
    } finally {
      setAdjusting(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'rise':
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'fall':
        return <TrendingDown className="w-5 h-5 text-red-600" />;
      case 'flat':
        return <Minus className="w-5 h-5 text-gray-600" />;
      default:
        return null;
    }
  };

  const getActionName = (action: string) => {
    switch (action) {
      case 'rise':
        return '拉升';
      case 'fall':
        return '下降';
      case 'flat':
        return '横盘';
      default:
        return action;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'rise':
        return 'text-green-600';
      case 'fall':
        return 'text-red-600';
      case 'flat':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">市场调控</h1>
        <p className="text-gray-600 mt-1">对大盘走势进行拉升、下降或横盘调控</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 调控表单 */}
        <Card>
          <CardHeader>
            <CardTitle>执行调控</CardTitle>
            <CardDescription>选择调控类型和参数</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="action">调控类型</Label>
              <Select value={action} onValueChange={(value: any) => setAction(value)}>
                <SelectTrigger id="action">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rise">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      拉升
                    </div>
                  </SelectItem>
                  <SelectItem value="fall">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-red-600" />
                      下降
                    </div>
                  </SelectItem>
                  <SelectItem value="flat">
                    <div className="flex items-center gap-2">
                      <Minus className="w-4 h-4 text-gray-600" />
                      横盘
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="symbol">交易对</Label>
              <Select value={symbol} onValueChange={setSymbol}>
                <SelectTrigger id="symbol">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tradingPairs.map((pair) => (
                    <SelectItem key={pair.id} value={pair.symbol}>
                      {pair.symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {action !== 'flat' && (
              <div className="space-y-2">
                <Label htmlFor="changePercent">
                  变化百分比 ({action === 'rise' ? '+' : '-'}%)
                </Label>
                <Input
                  id="changePercent"
                  type="number"
                  min="0"
                  max="50"
                  step="0.1"
                  value={changePercent}
                  onChange={(e) => setChangePercent(e.target.value)}
                  placeholder="5"
                />
                <p className="text-xs text-gray-500">
                  请输入 0-50 之间的数值
                </p>
              </div>
            )}

            <Button
              onClick={handleAdjust}
              disabled={adjusting}
              className="w-full"
              variant={action === 'rise' ? 'default' : action === 'fall' ? 'destructive' : 'outline'}
            >
              {adjusting ? '执行中...' : `执行${getActionName(action)}`}
            </Button>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>注意：</strong>市场调控将直接影响所有用户的持仓盈亏，请谨慎操作。
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 调控历史 */}
        <Card>
          <CardHeader>
            <CardTitle>调控历史</CardTitle>
            <CardDescription>
              最近的调控记录
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-gray-600">共 {adjustments.length} 条记录</span>
              <Button
                onClick={fetchAdjustments}
                variant="ghost"
                size="icon"
                className="h-6 w-6"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {loading ? (
                <div className="text-center py-8 text-gray-500">加载中...</div>
              ) : adjustments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">暂无调控记录</div>
              ) : (
                adjustments.map((adj) => (
                  <div
                    key={adj.id}
                    className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getActionIcon(adj.action)}
                        <span className="font-medium">{getActionName(adj.action)}</span>
                      </div>
                      <span className={`text-sm font-medium ${getActionColor(adj.action)}`}>
                        {adj.changePercent && parseFloat(adj.changePercent) > 0
                          ? `${adj.action === 'rise' ? '+' : ''}${parseFloat(adj.changePercent).toFixed(2)}%`
                          : '0%'}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>交易对:</span>
                        <span className="font-medium">{adj.symbol}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>调整前:</span>
                        <span>${parseFloat(adj.beforePrice).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>调整后:</span>
                        <span className="font-medium">${parseFloat(adj.afterPrice).toLocaleString()}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        操作人: {adj.createdBy} | {new Date(adj.createdAt).toLocaleString('zh-CN')}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
