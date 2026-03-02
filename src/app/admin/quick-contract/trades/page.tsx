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
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, RefreshCw, ArrowUp, ArrowDown, TrendingUp, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import adminFetch from '@/lib/admin-fetch';

interface QuickContractTrade {
  id: number;
  userId: number;
  email: string;
  symbol: string;
  direction: 'up' | 'down';
  duration: number;
  amount: number;
  payoutRate: number;
  startPrice: number;
  endPrice: number;
  profit?: number;
  result?: 'win' | 'loss' | 'draw';
  status: 'pending' | 'settled';
  createdAt: string;
  settledAt?: string;
}

export default function QuickContractTradesPage() {
  const [trades, setTrades] = useState<QuickContractTrade[]>([]);
  const [filteredTrades, setFilteredTrades] = useState<QuickContractTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [resultFilter, setResultFilter] = useState<string>('all');
  const [symbolFilter, setSymbolFilter] = useState<string>('all');

  useEffect(() => {
    fetchTrades();
  }, [statusFilter, resultFilter, symbolFilter]);

  useEffect(() => {
    let filtered = trades;

    if (searchQuery) {
      filtered = filtered.filter(
        (trade) =>
          trade.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          trade.symbol.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((trade) => trade.status === statusFilter);
    }

    if (resultFilter !== 'all') {
      filtered = filtered.filter((trade) => trade.result === resultFilter);
    }

    if (symbolFilter !== 'all') {
      filtered = filtered.filter((trade) => trade.symbol === symbolFilter);
    }

    setFilteredTrades(filtered);
  }, [searchQuery, trades, statusFilter, resultFilter, symbolFilter]);

  const fetchTrades = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (resultFilter !== 'all') params.append('result', resultFilter);
      if (symbolFilter !== 'all') params.append('symbol', symbolFilter);

      const response = await adminFetch(`/api/admin/quick-contract/trades?${params}`);
      const data = await response.json();
      if (data.success) {
        setTrades(data.trades || []);
        setFilteredTrades(data.trades || []);
      }
    } catch (error) {
      console.error('Failed to fetch trades:', error);
      toast.error('获取秒合约交易失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string; icon: any }> = {
      pending: { label: '进行中', className: 'bg-yellow-500/10 text-yellow-400', icon: Clock },
      settled: { label: '已结算', className: 'bg-gray-500/10 text-gray-400', icon: CheckCircle },
    };
    const config = statusMap[status] || { label: status, className: 'bg-gray-500/10 text-gray-400', icon: null };
    return (
      <Badge className={config.className}>
        {config.icon && <config.icon className="w-3 h-3 mr-1" />}
        {config.label}
      </Badge>
    );
  };

  const getResultBadge = (result: string | undefined) => {
    if (!result) return <span className="text-gray-400">-</span>;
    const resultMap: Record<string, { label: string; className: string; icon: any }> = {
      win: { label: '盈利', className: 'bg-green-500/10 text-green-400', icon: CheckCircle },
      loss: { label: '亏损', className: 'bg-red-500/10 text-red-400', icon: XCircle },
      draw: { label: '平局', className: 'bg-gray-500/10 text-gray-400', icon: null },
    };
    const config = resultMap[result];
    return config ? (
      <Badge className={config.className}>
        {config.icon && <config.icon className="w-3 h-3 mr-1" />}
        {config.label}
      </Badge>
    ) : <span className="text-gray-400">-</span>;
  };

  const getDirectionBadge = (direction: string) => {
    return direction === 'up'
      ? <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
          <ArrowUp className="w-3 h-3 mr-1" />涨
        </Badge>
      : <Badge className="bg-red-500/10 text-red-400 border-red-500/20">
          <ArrowDown className="w-3 h-3 mr-1" />跌
        </Badge>;
  };

  const getProfitColor = (profit: number | undefined) => {
    if (!profit) return 'text-gray-400';
    if (profit > 0) return 'text-green-400';
    if (profit < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  const uniqueSymbols = Array.from(new Set(trades.map((t) => t.symbol)));

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  return (
    <div className="space-y-6">
      {/* 面包屑 */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-400">桌面</span>
        <span className="text-gray-600">/</span>
        <span className="text-gray-400">秒合约设置</span>
        <span className="text-gray-600">/</span>
        <span className="text-white">秒合约交易</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-white">秒合约交易管理</h1>
        <p className="text-gray-400 mt-1">查看和管理正式账户的秒合约交易记录</p>
      </div>

      {/* 操作栏 */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="搜索邮箱或品种..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-slate-700 border-slate-600 text-white placeholder:text-gray-500"
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[120px] bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="状态" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="all" className="text-white">全部状态</SelectItem>
                  <SelectItem value="pending" className="text-white">进行中</SelectItem>
                  <SelectItem value="settled" className="text-white">已结算</SelectItem>
                </SelectContent>
              </Select>
              <Select value={resultFilter} onValueChange={setResultFilter}>
                <SelectTrigger className="w-[120px] bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="结果" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="all" className="text-white">全部结果</SelectItem>
                  <SelectItem value="win" className="text-white">盈利</SelectItem>
                  <SelectItem value="loss" className="text-white">亏损</SelectItem>
                  <SelectItem value="draw" className="text-white">平局</SelectItem>
                </SelectContent>
              </Select>
              <Select value={symbolFilter} onValueChange={setSymbolFilter}>
                <SelectTrigger className="w-[140px] bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="品种" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="all" className="text-white">全部品种</SelectItem>
                  {uniqueSymbols.map((symbol) => (
                    <SelectItem key={symbol} value={symbol} className="text-white">{symbol}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={fetchTrades}
                variant="outline"
                size="icon"
                className="border-slate-600 hover:bg-slate-700"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 统计卡片 */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-400/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <div className="text-3xl font-bold text-white">{trades.length}</div>
                <div className="text-sm text-gray-400">总交易数</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-400/10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <div className="text-3xl font-bold text-white">
                  {trades.filter(t => t.result === 'win').length}
                </div>
                <div className="text-sm text-gray-400">盈利次数</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-400/10 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <div className="text-3xl font-bold text-white">
                  {trades.filter(t => t.result === 'loss').length}
                </div>
                <div className="text-sm text-gray-400">亏损次数</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-400/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <div className="text-3xl font-bold text-white">
                  {trades
                    .filter(t => t.profit)
                    .reduce((sum, t) => sum + (t.profit || 0), 0)
                    .toFixed(2)} USDT
                </div>
                <div className="text-sm text-gray-400">总盈亏</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 交易列表 */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">秒合约交易记录</CardTitle>
          <CardDescription className="text-gray-400">
            共 {filteredTrades.length} 条记录
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-400">加载中...</div>
            </div>
          ) : filteredTrades.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-400">暂无秒合约交易记录</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-gray-400">用户</TableHead>
                    <TableHead className="text-gray-400">品种</TableHead>
                    <TableHead className="text-gray-400">方向</TableHead>
                    <TableHead className="text-gray-400">秒数</TableHead>
                    <TableHead className="text-gray-400">金额</TableHead>
                    <TableHead className="text-gray-400">赔付</TableHead>
                    <TableHead className="text-gray-400">起始价</TableHead>
                    <TableHead className="text-gray-400">结束价</TableHead>
                    <TableHead className="text-gray-400">盈亏</TableHead>
                    <TableHead className="text-gray-400">结果</TableHead>
                    <TableHead className="text-gray-400">状态</TableHead>
                    <TableHead className="text-gray-400">交易时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTrades.map((trade) => (
                    <TableRow key={trade.id} className="border-slate-700 hover:bg-slate-700/50">
                      <TableCell>
                        <div className="text-gray-300">{trade.email}</div>
                        <div className="text-xs text-gray-500">ID: {trade.userId}</div>
                      </TableCell>
                      <TableCell className="text-gray-300 font-medium">{trade.symbol}</TableCell>
                      <TableCell>{getDirectionBadge(trade.direction)}</TableCell>
                      <TableCell className="text-gray-300">{trade.duration}秒</TableCell>
                      <TableCell className="text-gray-300">{trade.amount} USDT</TableCell>
                      <TableCell className="text-gray-300">{trade.payoutRate.toFixed(2)}x</TableCell>
                      <TableCell className="text-gray-300">${trade.startPrice}</TableCell>
                      <TableCell className="text-gray-300">
                        {trade.endPrice ? `$${trade.endPrice}` : '-'}
                      </TableCell>
                      <TableCell className={getProfitColor(trade.profit)}>
                        {trade.profit ? `${trade.profit > 0 ? '+' : ''}${trade.profit.toFixed(2)} USDT` : '-'}
                      </TableCell>
                      <TableCell>{getResultBadge(trade.result)}</TableCell>
                      <TableCell>{getStatusBadge(trade.status)}</TableCell>
                      <TableCell className="text-gray-400 text-sm">
                        {formatDate(trade.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
