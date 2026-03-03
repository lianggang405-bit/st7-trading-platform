'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Activity, RefreshCw, AlertCircle, CheckCircle2, Clock, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface OrderMonitorStatus {
  status: string;
  interval: number;
  lastCheck: string;
}

interface OrderMonitorData {
  trigger: {
    success: boolean;
    triggered: number;
    failed: number;
    errors: string[];
  };
  cancelled: number;
}

export default function OrderMonitorPage() {
  const [loading, setLoading] = useState(false);
  const [monitorData, setMonitorData] = useState<OrderMonitorData | null>(null);
  const [status, setStatus] = useState<OrderMonitorStatus | null>(null);

  useEffect(() => {
    fetchStatus();
    fetchMonitorData();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/trading/monitor-orders');
      const data = await response.json();
      if (data.success) {
        setStatus(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch monitor status:', error);
    }
  };

  const fetchMonitorData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/trading/monitor-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'both' }),
      });
      const data = await response.json();
      if (data.success) {
        setMonitorData(data.data);
        toast.success('订单监控完成');
      }
    } catch (error) {
      console.error('Failed to trigger monitor:', error);
      toast.error('监控失败');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerOrders = async () => {
    await fetchMonitorData();
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN');
  };

  const formatInterval = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold">订单监控</h1>
        <p className="text-muted-foreground mt-2">
          监控并自动触发挂单（限价单）成交
        </p>
      </div>

      {/* 监控状态 */}
      {status && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              监控状态
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">运行状态</p>
                <p className="text-2xl font-bold flex items-center gap-2">
                  {status.status === 'active' && (
                    <>
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                      <span>运行中</span>
                    </>
                  )}
                  {status.status !== 'active' && (
                    <>
                      <AlertCircle className="h-6 w-6 text-red-500" />
                      <span>未运行</span>
                    </>
                  )}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">监控间隔</p>
                <p className="text-2xl font-bold flex items-center gap-2">
                  <Clock className="h-6 w-6 text-blue-500" />
                  {formatInterval(status.interval)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">最后检查</p>
                <p className="text-lg font-medium">
                  {formatTime(status.lastCheck)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 监控结果 */}
      {monitorData && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                订单触发
              </CardTitle>
              <CardDescription>价格达到触发条件并自动成交的订单</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">成功触发</span>
                  <Badge variant="default" className="text-lg px-4">
                    {monitorData.trigger.triggered}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">触发失败</span>
                  <Badge variant={monitorData.trigger.failed > 0 ? 'destructive' : 'secondary'}>
                    {monitorData.trigger.failed}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                过期取消
              </CardTitle>
              <CardDescription>超过24小时未触发而自动取消的订单</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">已取消订单</span>
                  <Badge variant={monitorData.cancelled > 0 ? 'destructive' : 'secondary'} className="text-lg px-4">
                    {monitorData.cancelled}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 错误信息 */}
      {monitorData && monitorData.trigger.errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>触发错误</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside mt-2 space-y-1">
              {monitorData.trigger.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* 操作按钮 */}
      <div className="flex gap-4">
        <Button onClick={handleTriggerOrders} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? '监控中...' : '立即监控'}
        </Button>
        <Button variant="outline" onClick={fetchStatus}>
          刷新状态
        </Button>
      </div>

      {/* 工作原理说明 */}
      <Card>
        <CardHeader>
          <CardTitle>工作原理</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div className="space-y-2">
            <p className="font-medium">1. 用户下限价单</p>
            <p className="pl-4">用户指定交易对、方向、价格和数量，订单状态设为 pending</p>
          </div>
          <div className="space-y-2">
            <p className="font-medium">2. 价格监控</p>
            <p className="pl-4">
              系统在每次市场数据更新时检查所有 pending 订单：
              <br />• 买单：当前价格 ≤ 订单价格时触发
              <br />• 卖单：当前价格 ≥ 订单价格时触发
            </p>
          </div>
          <div className="space-y-2">
            <p className="font-medium">3. 自动成交</p>
            <p className="pl-4">
              满足触发条件时，订单状态改为 open，系统创建持仓记录，使用实际成交价格
            </p>
          </div>
          <div className="space-y-2">
            <p className="font-medium">4. 过期取消</p>
            <p className="pl-4">超过24小时未触发的订单会自动取消</p>
          </div>
        </CardContent>
      </Card>

      {/* 注意事项 */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>注意事项</AlertTitle>
        <AlertDescription>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>订单监控在市场数据更新时自动执行，无需手动操作</li>
            <li>触发逻辑基于实时价格，可能会有少量延迟</li>
            <li>建议定期查看此页面，确认系统正常运行</li>
            <li>订单触发后，用户可以在持仓页面查看持仓详情</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}
