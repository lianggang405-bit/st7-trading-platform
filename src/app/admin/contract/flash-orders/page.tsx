'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  Plus,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';

interface FlashOrder {
  id: number;
  account: string;
  symbol: string;
  type: string;
  status: string;
  quantity: number;
  fee: number;
  result: string;
  profit: number;
  openPrice: number;
  closePrice: number;
  createdAt: string;
}

export default function FlashOrdersPage() {
  const [orders, setOrders] = useState<FlashOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(15);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchOrders();
  }, [currentPage, sortField, sortOrder]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/contract/flash-orders?page=${currentPage}&limit=${pageSize}&sort=${sortField}&order=${sortOrder}&search=${searchQuery}`
      );
      const data = await response.json();
      if (data.success) {
        setOrders(data.orders || []);
        setTotalCount(data.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch flash orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrders(new Set(orders.map(o => o.id)));
    } else {
      setSelectedOrders(new Set());
    }
  };

  const handleSelectOrder = (orderId: number, checked: boolean) => {
    const newSelected = new Set(selectedOrders);
    if (checked) {
      newSelected.add(orderId);
    } else {
      newSelected.delete(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const handleDelete = async (orderId: number) => {
    if (!confirm('确定要删除此秒合约订单吗？')) return;

    try {
      const response = await fetch(`/api/admin/contract/flash-orders/${orderId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        toast.success('删除成功');
        fetchOrders();
      } else {
        toast.error('删除失败');
      }
    } catch (error) {
      console.error('Failed to delete flash order:', error);
      toast.error('删除失败');
    }
  };

  const formatPrice = (value: number) => {
    return value.toFixed(8);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().replace('T', ' ').substring(0, 19) + 'Z';
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      已平仓: { color: 'bg-gray-500/10 text-gray-400', text: '已平仓' },
      进行中: { color: 'bg-blue-500/10 text-blue-400', text: '进行中' },
      已取消: { color: 'bg-red-500/10 text-red-400', text: '已取消' },
    };
    const config = statusMap[status] || statusMap.已平仓;
    return <Badge className={config.color}>{config.text}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    if (type === '涨') {
      return <Badge className="bg-green-500/10 text-green-400">涨</Badge>;
    } else if (type === '跌') {
      return <Badge className="bg-red-500/10 text-red-400">跌</Badge>;
    }
    return <Badge className="bg-gray-500/10 text-gray-400">{type}</Badge>;
  };

  const getResultBadge = (result: string) => {
    const resultMap: Record<string, { color: string; text: string }> = {
      盈利: { color: 'bg-green-500/10 text-green-400', text: '盈利' },
      亏损: { color: 'bg-red-500/10 text-red-400', text: '亏损' },
      无: { color: 'bg-gray-500/10 text-gray-400', text: '无' },
    };
    const config = resultMap[result] || resultMap.无;
    return <Badge className={config.color}>{config.text}</Badge>;
  };

  const getPnlColor = (profit: number) => {
    if (profit > 0) return 'text-green-400';
    if (profit < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  return (
    <div className="space-y-6">
      {/* 面包屑导航 */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>资源</span> / <span className="text-white">秒合约交易</span>
      </div>

      {/* 页面标题和操作栏 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">秒合约交易</h1>
        <div className="flex gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="搜索"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchOrders()}
              className="pl-9 bg-slate-700 border-slate-600 text-white"
            />
          </div>
          <Button variant="outline" size="icon" className="border-slate-600 hover:bg-slate-700">
            <Filter className="w-4 h-4" />
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            创建秒合约交易
          </Button>
        </div>
      </div>

      {/* 数据表格 */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700 hover:bg-slate-700/50">
                  <TableHead className="w-12 bg-slate-800 whitespace-nowrap">
                    <input
                      type="checkbox"
                      className="rounded border-gray-500 bg-slate-700"
                      checked={selectedOrders.size === orders.length && orders.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </TableHead>
                  <TableHead className="bg-slate-800 text-gray-400 whitespace-nowrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-blue-400 hover:text-blue-300 whitespace-nowrap"
                      onClick={() => handleSort('id')}
                    >
                      ID
                      {sortField === 'id' && (
                        sortOrder === 'asc' ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="bg-slate-800 text-gray-400 whitespace-nowrap">账号</TableHead>
                  <TableHead className="bg-slate-800 text-gray-400 whitespace-nowrap">品种</TableHead>
                  <TableHead className="bg-slate-800 text-gray-400 whitespace-nowrap">类型</TableHead>
                  <TableHead className="bg-slate-800 text-gray-400 whitespace-nowrap">交易状态</TableHead>
                  <TableHead className="bg-slate-800 text-gray-400 whitespace-nowrap">数量</TableHead>
                  <TableHead className="bg-slate-800 text-gray-400 whitespace-nowrap">手续费</TableHead>
                  <TableHead className="bg-slate-800 text-gray-400 whitespace-nowrap">结果</TableHead>
                  <TableHead className="bg-slate-800 text-gray-400 whitespace-nowrap">盈利</TableHead>
                  <TableHead className="bg-slate-800 text-gray-400 whitespace-nowrap">开仓价格</TableHead>
                  <TableHead className="bg-slate-800 text-gray-400 whitespace-nowrap">平仓价格</TableHead>
                  <TableHead className="bg-slate-800 text-gray-400 whitespace-nowrap">下单时间</TableHead>
                  <TableHead className="bg-slate-800 text-gray-400 whitespace-nowrap w-32">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id} className="border-slate-700 hover:bg-slate-700/30">
                    <TableCell className="whitespace-nowrap">
                      <input
                        type="checkbox"
                        className="rounded border-gray-500 bg-slate-700"
                        checked={selectedOrders.has(order.id)}
                        onChange={(e) => handleSelectOrder(order.id, e.target.checked)}
                      />
                    </TableCell>
                    <TableCell className="text-blue-400 font-medium whitespace-nowrap">{order.id}</TableCell>
                    <TableCell className="text-gray-300 whitespace-nowrap text-sm">{order.account}</TableCell>
                    <TableCell className="text-gray-300 whitespace-nowrap">{order.symbol || '-'}</TableCell>
                    <TableCell className="whitespace-nowrap">{getTypeBadge(order.type)}</TableCell>
                    <TableCell className="whitespace-nowrap">{getStatusBadge(order.status)}</TableCell>
                    <TableCell className="text-gray-400 whitespace-nowrap font-mono text-xs">{formatPrice(order.quantity)}</TableCell>
                    <TableCell className="text-gray-400 whitespace-nowrap font-mono text-xs">{formatPrice(order.fee)}</TableCell>
                    <TableCell className="whitespace-nowrap">{getResultBadge(order.result)}</TableCell>
                    <TableCell className={`whitespace-nowrap font-mono text-xs ${getPnlColor(order.profit)}`}>{formatPrice(order.profit)}</TableCell>
                    <TableCell className="text-gray-400 whitespace-nowrap font-mono text-xs">{formatPrice(order.openPrice)}</TableCell>
                    <TableCell className="text-gray-400 whitespace-nowrap font-mono text-xs">{formatPrice(order.closePrice)}</TableCell>
                    <TableCell className="text-gray-400 whitespace-nowrap font-mono text-xs">{formatDateTime(order.createdAt)}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-red-400"
                          onClick={() => handleDelete(order.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* 分页 */}
          <div className="flex items-center justify-between p-4 border-t border-slate-700">
            <div className="text-sm text-gray-400">
              {totalCount > 0 ? `${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, totalCount)} of ${totalCount}` : '0-0 of 0'}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="border-slate-600 hover:bg-slate-700"
              >
                上一页
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={orders.length < pageSize}
                className="border-slate-600 hover:bg-slate-700"
              >
                下一页
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
