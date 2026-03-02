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
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ContractOrder {
  id: number;
  account: string;
  symbol: string;
  tradeType: string;
  status: string;
  originalPrice: number;
  openPrice: number;
  currentPrice: number;
  takeProfit: number;
  stopLoss: number;
  lots: number;
  leverage: number;
  initialMargin: number;
  availableMargin: number;
  fee: number;
  profit: number;
  createdAt: string;
  closedAt: string;
  completedAt: string;
}

export default function ContractOrdersPage() {
  const [orders, setOrders] = useState<ContractOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(15);
  const [totalCount, setTotalCount] = useState(0);

  // 查看详情相关状态
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewOrder, setViewOrder] = useState<ContractOrder | null>(null);

  // 编辑相关状态
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editOrder, setEditOrder] = useState<ContractOrder | null>(null);
  const [editForm, setEditForm] = useState({
    tradeType: '',
    status: '',
  });
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [currentPage, sortField, sortOrder]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/contract/orders?page=${currentPage}&limit=${pageSize}&sort=${sortField}&order=${sortOrder}&search=${searchQuery}`
      );
      const data = await response.json();
      if (data.success) {
        setOrders(data.orders || []);
        setTotalCount(data.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
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
    if (!confirm('确定要删除此订单吗？')) return;

    try {
      const response = await fetch(`/api/admin/contract/orders/${orderId}`, {
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
      console.error('Failed to delete order:', error);
      toast.error('删除失败');
    }
  };

  const handleView = (order: ContractOrder) => {
    setViewOrder(order);
    setViewDialogOpen(true);
  };

  const handleEdit = (order: ContractOrder) => {
    setEditOrder(order);
    setEditForm({
      tradeType: order.tradeType,
      status: order.status,
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editOrder) return;

    setEditLoading(true);
    try {
      const response = await fetch(`/api/admin/contract/orders/${editOrder.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });
      const data = await response.json();
      if (data.success) {
        toast.success('更新成功');
        setEditDialogOpen(false);
        fetchOrders();
      } else {
        toast.error(data.error || '更新失败');
      }
    } catch (error) {
      console.error('Failed to update order:', error);
      toast.error('更新失败');
    } finally {
      setEditLoading(false);
    }
  };

  const formatPrice = (value: number) => {
    return value.toFixed(9);
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      已平仓: { color: 'bg-gray-500/10 text-gray-400', text: '已平仓' },
      持仓中: { color: 'bg-green-500/10 text-green-400', text: '持仓中' },
      已取消: { color: 'bg-red-500/10 text-red-400', text: '已取消' },
      待成交: { color: 'bg-yellow-500/10 text-yellow-400', text: '待成交' },
    };
    const config = statusMap[status] || statusMap.已平仓;
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
        <span>资源</span> / <span className="text-white">合约订单</span>
      </div>

      {/* 页面标题和操作栏 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">合约订单</h1>
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
            创建合约订单
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
                  <TableHead className="bg-slate-800 text-gray-400 whitespace-nowrap">交易类型</TableHead>
                  <TableHead className="bg-slate-800 text-gray-400 whitespace-nowrap">状态</TableHead>
                  <TableHead className="bg-slate-800 text-gray-400 whitespace-nowrap">原始价</TableHead>
                  <TableHead className="bg-slate-800 text-gray-400 whitespace-nowrap">开仓价格</TableHead>
                  <TableHead className="bg-slate-800 text-gray-400 whitespace-nowrap">当前价格</TableHead>
                  <TableHead className="bg-slate-800 text-gray-400 whitespace-nowrap">止盈价</TableHead>
                  <TableHead className="bg-slate-800 text-gray-400 whitespace-nowrap">止损价</TableHead>
                  <TableHead className="bg-slate-800 text-gray-400 whitespace-nowrap">手数</TableHead>
                  <TableHead className="bg-slate-800 text-gray-400 whitespace-nowrap">倍数</TableHead>
                  <TableHead className="bg-slate-800 text-gray-400 whitespace-nowrap">初始保证金</TableHead>
                  <TableHead className="bg-slate-800 text-gray-400 whitespace-nowrap">可用保证金</TableHead>
                  <TableHead className="bg-slate-800 text-gray-400 whitespace-nowrap">手续费</TableHead>
                  <TableHead className="bg-slate-800 text-gray-400 whitespace-nowrap">盈亏</TableHead>
                  <TableHead className="bg-slate-800 text-gray-400 whitespace-nowrap">创建时间</TableHead>
                  <TableHead className="bg-slate-800 text-gray-400 whitespace-nowrap">平仓时间</TableHead>
                  <TableHead className="bg-slate-800 text-gray-400 whitespace-nowrap">完成时间</TableHead>
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
                    <TableCell className="text-blue-400 font-medium whitespace-nowrap">{order.symbol}</TableCell>
                    <TableCell className="text-gray-300 whitespace-nowrap">{order.tradeType}</TableCell>
                    <TableCell className="whitespace-nowrap">{getStatusBadge(order.status)}</TableCell>
                    <TableCell className="text-gray-400 whitespace-nowrap font-mono text-xs">{formatPrice(order.originalPrice)}</TableCell>
                    <TableCell className="text-gray-400 whitespace-nowrap font-mono text-xs">{formatPrice(order.openPrice)}</TableCell>
                    <TableCell className="text-gray-400 whitespace-nowrap font-mono text-xs">{formatPrice(order.currentPrice)}</TableCell>
                    <TableCell className="text-gray-400 whitespace-nowrap font-mono text-xs">{formatPrice(order.takeProfit)}</TableCell>
                    <TableCell className="text-gray-400 whitespace-nowrap font-mono text-xs">{formatPrice(order.stopLoss)}</TableCell>
                    <TableCell className="text-gray-400 whitespace-nowrap">{order.lots}</TableCell>
                    <TableCell className="text-gray-400 whitespace-nowrap">{order.leverage}</TableCell>
                    <TableCell className="text-gray-400 whitespace-nowrap font-mono text-xs">{formatPrice(order.initialMargin)}</TableCell>
                    <TableCell className="text-gray-400 whitespace-nowrap font-mono text-xs">{formatPrice(order.availableMargin)}</TableCell>
                    <TableCell className="text-gray-400 whitespace-nowrap font-mono text-xs">{formatPrice(order.fee)}</TableCell>
                    <TableCell className={`whitespace-nowrap font-mono text-xs ${getPnlColor(order.profit)}`}>{formatPrice(order.profit)}</TableCell>
                    <TableCell className="text-gray-400 whitespace-nowrap font-mono text-xs">{formatDateTime(order.createdAt)}</TableCell>
                    <TableCell className="text-gray-400 whitespace-nowrap font-mono text-xs">{formatDateTime(order.closedAt)}</TableCell>
                    <TableCell className="text-gray-400 whitespace-nowrap font-mono text-xs">{formatDateTime(order.completedAt)}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-white"
                          onClick={() => handleView(order)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-white"
                          onClick={() => handleEdit(order)}
                        >
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

      {/* 查看详情对话框 */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>订单详情</DialogTitle>
            <DialogDescription className="text-gray-400">
              查看合约订单详细信息
            </DialogDescription>
          </DialogHeader>
          {viewOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-400">ID</Label>
                  <div className="text-white mt-1">{viewOrder.id}</div>
                </div>
                <div>
                  <Label className="text-gray-400">账号</Label>
                  <div className="text-white mt-1">{viewOrder.account}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-400">品种</Label>
                  <div className="text-blue-400 mt-1">{viewOrder.symbol}</div>
                </div>
                <div>
                  <Label className="text-gray-400">交易类型</Label>
                  <div className="text-white mt-1">{viewOrder.tradeType}</div>
                </div>
              </div>
              <div>
                <Label className="text-gray-400">状态</Label>
                <div className="mt-1">{getStatusBadge(viewOrder.status)}</div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-gray-400">原始价</Label>
                  <div className="text-gray-400 mt-1 font-mono text-xs">{formatPrice(viewOrder.originalPrice)}</div>
                </div>
                <div>
                  <Label className="text-gray-400">开仓价格</Label>
                  <div className="text-gray-400 mt-1 font-mono text-xs">{formatPrice(viewOrder.openPrice)}</div>
                </div>
                <div>
                  <Label className="text-gray-400">当前价格</Label>
                  <div className="text-gray-400 mt-1 font-mono text-xs">{formatPrice(viewOrder.currentPrice)}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-400">止盈价</Label>
                  <div className="text-gray-400 mt-1 font-mono text-xs">{formatPrice(viewOrder.takeProfit)}</div>
                </div>
                <div>
                  <Label className="text-gray-400">止损价</Label>
                  <div className="text-gray-400 mt-1 font-mono text-xs">{formatPrice(viewOrder.stopLoss)}</div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label className="text-gray-400">手数</Label>
                  <div className="text-white mt-1">{viewOrder.lots}</div>
                </div>
                <div>
                  <Label className="text-gray-400">倍数</Label>
                  <div className="text-white mt-1">{viewOrder.leverage}</div>
                </div>
                <div>
                  <Label className="text-gray-400">手续费</Label>
                  <div className="text-gray-400 mt-1 font-mono text-xs">{formatPrice(viewOrder.fee)}</div>
                </div>
                <div>
                  <Label className="text-gray-400">盈亏</Label>
                  <div className={`mt-1 font-mono text-xs ${getPnlColor(viewOrder.profit)}`}>{formatPrice(viewOrder.profit)}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-400">初始保证金</Label>
                  <div className="text-gray-400 mt-1 font-mono text-xs">{formatPrice(viewOrder.initialMargin)}</div>
                </div>
                <div>
                  <Label className="text-gray-400">可用保证金</Label>
                  <div className="text-gray-400 mt-1 font-mono text-xs">{formatPrice(viewOrder.availableMargin)}</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-gray-400">创建时间</Label>
                  <div className="text-gray-400 mt-1 font-mono text-xs">{formatDateTime(viewOrder.createdAt)}</div>
                </div>
                <div>
                  <Label className="text-gray-400">平仓时间</Label>
                  <div className="text-gray-400 mt-1 font-mono text-xs">{formatDateTime(viewOrder.closedAt)}</div>
                </div>
                <div>
                  <Label className="text-gray-400">完成时间</Label>
                  <div className="text-gray-400 mt-1 font-mono text-xs">{formatDateTime(viewOrder.completedAt)}</div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setViewDialogOpen(false)}
              className="border-slate-600 hover:bg-slate-700"
            >
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑对话框 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>编辑订单</DialogTitle>
            <DialogDescription className="text-gray-400">
              修改订单交易类型和状态（其他字段为只读）
            </DialogDescription>
          </DialogHeader>
          {editOrder && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-tradeType">交易类型</Label>
                <select
                  id="edit-tradeType"
                  value={editForm.tradeType}
                  onChange={(e) => setEditForm({ ...editForm, tradeType: e.target.value })}
                  className="w-full bg-slate-700 border-slate-600 text-white rounded-md px-3 py-2 mt-1"
                >
                  <option value="买入">买入</option>
                  <option value="卖出">卖出</option>
                </select>
              </div>
              <div>
                <Label htmlFor="edit-status">状态</Label>
                <select
                  id="edit-status"
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full bg-slate-700 border-slate-600 text-white rounded-md px-3 py-2 mt-1"
                >
                  <option value="进行中">进行中</option>
                  <option value="已平仓">已平仓</option>
                  <option value="已取消">已取消</option>
                  <option value="已完成">已完成</option>
                </select>
              </div>

              {/* 只读字段 */}
              <div className="border-t border-slate-700 pt-4 mt-4">
                <div className="text-sm text-gray-500 mb-3">只读信息</div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-gray-400">账号</Label>
                    <div className="text-gray-500 mt-1">{editOrder.account}</div>
                  </div>
                  <div>
                    <Label className="text-gray-400">品种</Label>
                    <div className="text-blue-400 mt-1">{editOrder.symbol}</div>
                  </div>
                  <div>
                    <Label className="text-gray-400">开仓价格</Label>
                    <div className="text-gray-500 mt-1 font-mono text-xs">{formatPrice(editOrder.openPrice)}</div>
                  </div>
                  <div>
                    <Label className="text-gray-400">当前价格</Label>
                    <div className="text-gray-500 mt-1 font-mono text-xs">{formatPrice(editOrder.currentPrice)}</div>
                  </div>
                  <div>
                    <Label className="text-gray-400">手数</Label>
                    <div className="text-gray-500 mt-1">{editOrder.lots}</div>
                  </div>
                  <div>
                    <Label className="text-gray-400">倍数</Label>
                    <div className="text-gray-500 mt-1">{editOrder.leverage}</div>
                  </div>
                  <div>
                    <Label className="text-gray-400">初始保证金</Label>
                    <div className="text-gray-500 mt-1 font-mono text-xs">{formatPrice(editOrder.initialMargin)}</div>
                  </div>
                  <div>
                    <Label className="text-gray-400">可用保证金</Label>
                    <div className="text-gray-500 mt-1 font-mono text-xs">{formatPrice(editOrder.availableMargin)}</div>
                  </div>
                  <div>
                    <Label className="text-gray-400">手续费</Label>
                    <div className="text-gray-500 mt-1 font-mono text-xs">{formatPrice(editOrder.fee)}</div>
                  </div>
                  <div>
                    <Label className="text-gray-400">盈亏</Label>
                    <div className={`mt-1 font-mono text-xs ${getPnlColor(editOrder.profit)}`}>{formatPrice(editOrder.profit)}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              className="border-slate-600 hover:bg-slate-700"
            >
              取消
            </Button>
            <Button
              onClick={handleEditSubmit}
              disabled={editLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {editLoading ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
