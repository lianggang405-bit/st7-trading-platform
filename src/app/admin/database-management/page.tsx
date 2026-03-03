'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BarChart3, Database, RefreshCw, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface MockUsageStat {
  endpoint: string;
  count: number;
  lastUsed: string;
}

interface MockUsageResponse {
  success: boolean;
  stats: MockUsageStat[];
  total: number;
  summary: {
    totalEndpoints: number;
    totalRequests: number;
    topEndpoint: string | null;
    topCount: number;
  };
}

export default function DatabaseManagementPage() {
  const [usageData, setUsageData] = useState<MockUsageResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);

  useEffect(() => {
    fetchMockUsage();
  }, []);

  const fetchMockUsage = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/mock-usage');
      const data = await response.json();
      if (data.success) {
        setUsageData(data);
      }
    } catch (error) {
      console.error('Failed to fetch mock usage:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetStats = async () => {
    if (!confirm('确定要重置所有统计数据吗？')) return;

    try {
      const response = await fetch('/api/admin/mock-usage', {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        toast.success('统计数据已重置');
        fetchMockUsage();
      } else {
        toast.error('重置失败');
      }
    } catch (error) {
      console.error('Failed to reset stats:', error);
      toast.error('重置失败');
    }
  };

  const handleInitializeAll = async () => {
    if (!confirm('确定要初始化所有缺失的数据库表吗？这将创建表并插入初始数据。')) return;

    setInitializing(true);
    try {
      const response = await fetch('/api/admin/database/initialize-missing-tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (data.success) {
        toast.success('数据库初始化完成');
        fetchMockUsage();
      } else {
        toast.error('初始化失败：' + data.error);
      }
    } catch (error) {
      console.error('Failed to initialize database:', error);
      toast.error('初始化失败');
    } finally {
      setInitializing(false);
    }
  };

  const formatLastUsed = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins} 分钟前`;
    if (diffHours < 24) return `${diffHours} 小时前`;
    return `${diffDays} 天前`;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold">数据库管理</h1>
        <p className="text-muted-foreground mt-2">
          监控 mock 数据使用情况并初始化缺失的数据库表
        </p>
      </div>

      {/* 统计概览 */}
      {usageData && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mock 数据总数</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usageData.total}</div>
              <p className="text-xs text-muted-foreground">总计请求次数</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">使用 Mock 的接口</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usageData.summary.totalEndpoints}</div>
              <p className="text-xs text-muted-foreground">需要创建表</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">最频繁接口</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold truncate" title={usageData.summary.topEndpoint || '无'}>
                {usageData.summary.topEndpoint?.split('/').pop() || '无'}
              </div>
              <p className="text-xs text-muted-foreground">{usageData.summary.topCount} 次请求</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">数据库状态</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {usageData.summary.totalEndpoints === 0 ? '正常' : '需优化'}
              </div>
              <p className="text-xs text-muted-foreground">
                {usageData.summary.totalEndpoints === 0
                  ? '所有表都存在'
                  : `${usageData.summary.totalEndpoints} 个表缺失`}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 警告信息 */}
      {usageData && usageData.summary.totalEndpoints > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>发现使用 Mock 数据</AlertTitle>
          <AlertDescription>
            系统检测到 {usageData.summary.totalEndpoints} 个 API 接口正在使用 mock 数据，
            这意味着相关的数据库表不存在。建议初始化数据库表以提高数据一致性。
          </AlertDescription>
        </Alert>
      )}

      {usageData && usageData.summary.totalEndpoints === 0 && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>数据库状态良好</AlertTitle>
          <AlertDescription>
            所有 API 接口都在使用真实数据库数据，没有发现使用 mock 数据的情况。
          </AlertDescription>
        </Alert>
      )}

      {/* 操作按钮 */}
      <div className="flex gap-4">
        <Button onClick={handleInitializeAll} disabled={initializing}>
          <Database className="mr-2 h-4 w-4" />
          {initializing ? '初始化中...' : '初始化缺失的数据库表'}
        </Button>
        <Button variant="outline" onClick={fetchMockUsage} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          刷新统计
        </Button>
        <Button variant="ghost" onClick={handleResetStats}>
          重置统计数据
        </Button>
      </div>

      {/* Mock 使用统计表 */}
      <Card>
        <CardHeader>
          <CardTitle>Mock 数据使用统计</CardTitle>
          <CardDescription>
            记录哪些 API 接口频繁使用 mock 数据（按使用次数排序）
          </CardDescription>
        </CardHeader>
        <CardContent>
          {usageData && usageData.stats.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>接口路径</TableHead>
                  <TableHead>使用次数</TableHead>
                  <TableHead>最后使用</TableHead>
                  <TableHead>状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usageData.stats.map((stat) => (
                  <TableRow key={stat.endpoint}>
                    <TableCell className="font-mono text-sm">{stat.endpoint}</TableCell>
                    <TableCell>
                      <Badge variant={stat.count > 10 ? 'destructive' : stat.count > 5 ? 'default' : 'secondary'}>
                        {stat.count} 次
                      </Badge>
                    </TableCell>
                    <TableCell>{formatLastUsed(stat.lastUsed)}</TableCell>
                    <TableCell>
                      {stat.count > 10 && <Badge variant="destructive">高频率</Badge>}
                      {stat.count > 5 && stat.count <= 10 && <Badge variant="default">中频率</Badge>}
                      {stat.count <= 5 && <Badge variant="secondary">低频率</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              暂无 mock 数据使用记录
            </div>
          )}
        </CardContent>
      </Card>

      {/* 初始化说明 */}
      <Card>
        <CardHeader>
          <CardTitle>初始化说明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• 点击"初始化缺失的数据库表"按钮会自动创建所有缺失的表</p>
          <p>• 每个表会插入预设的初始数据，确保系统正常运行</p>
          <p>• 如果表已存在，则跳过该表，不会覆盖现有数据</p>
          <p>• 初始化后，API 接口将自动切换到使用真实数据库数据</p>
          <p>• 建议定期查看 mock 使用统计，及时创建缺失的表</p>
        </CardContent>
      </Card>
    </div>
  );
}
