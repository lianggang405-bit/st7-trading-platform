'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Filter,
  Settings,
} from 'lucide-react';
import { toast } from 'sonner';
import { AdjustDialog } from '@/components/admin/AdjustDialog';
import { AddPairDialog } from '@/components/admin/AddPairDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface TradingPair {
  id: number;
  symbol: string;
  currencyId: number;
  isVisible: boolean;
  hasBot: boolean;
  botId: number | null;
  botName: string | null;
  floatValue: number;
  isBotActive: boolean;
  minOrderSize: number;
  maxOrderSize: number;
  contractFee: number;
  createdAt: string;
}

export default function TradingBotsPage() {
  const [pairs, setPairs] = useState<TradingPair[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(15);
  const [total, setTotal] = useState(0);
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [selectedPair, setSelectedPair] = useState<TradingPair | null>(null);
  const [togglingBot, setTogglingBot] = useState<number | null>(null);
  const [addPairDialogOpen, setAddPairDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pairToDelete, setPairToDelete] = useState<TradingPair | null>(null);
  const [deletingPair, setDeletingPair] = useState<number | null>(null);

  useEffect(() => {
    fetchPairs();
  }, [currentPage, searchQuery]);

  const fetchPairs = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/trading/adjust?page=${currentPage}&limit=${pageSize}&search=${searchQuery}`
      );

      const data = await response.json();

      if (!response.ok) {
        if (data.needsSetup) {
          // 如果需要设置数据库
          setPairs([]);
          setTotal(0);
          toast.error(data.message || '数据库表不存在，请先创建');
          return;
        }
        throw new Error(data.error || '请求失败');
      }

      if (data.success) {
        setPairs(data.pairs || []);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch trading pairs:', error);
      toast.error('获取交易对失败，请检查数据库设置');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBot = async (pairId: number, currentStatus: boolean) => {
    setTogglingBot(pairId);
    try {
      const response = await fetch('/api/admin/trading/adjust', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pairId,
          isActive: !currentStatus,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(currentStatus ? '调控已禁用' : '调控已启用');
        fetchPairs();
      } else {
        toast.error(data.error || '操作失败');
      }
    } catch (error) {
      console.error('Failed to toggle bot:', error);
      toast.error('操作失败');
    } finally {
      setTogglingBot(null);
    }
  };

  const handleOpenAdjustDialog = (pair: TradingPair) => {
    setSelectedPair(pair);
    setAdjustDialogOpen(true);
  };

  const handleAdjustSuccess = () => {
    fetchPairs();
    setSelectedPair(null);
  };

  const handleDeletePair = (pair: TradingPair) => {
    setPairToDelete(pair);
    setDeleteDialogOpen(true);
  };

  const confirmDeletePair = async () => {
    if (!pairToDelete) return;

    setDeletingPair(pairToDelete.id);
    try {
      const response = await fetch(`/api/admin/trading/pairs/${pairToDelete.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`交易对 ${pairToDelete.symbol} 已删除`);
        fetchPairs();
        setDeleteDialogOpen(false);
        setPairToDelete(null);
      } else {
        toast.error(data.error || '删除失败');
      }
    } catch (error) {
      console.error('Failed to delete pair:', error);
      toast.error('删除失败，请稍后重试');
    } finally {
      setDeletingPair(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 面包屑导航 */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>资源</span> / <span className="text-white">调控机器人</span>
      </div>

      {/* 页面标题和操作栏 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">调控机器人</h1>
        <div className="flex gap-2">
          <Button
            onClick={() => setAddPairDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            新增交易对
          </Button>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="搜索交易对"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-slate-700 border-slate-600 text-white"
            />
          </div>
          <Button variant="outline" size="icon" className="border-slate-600 hover:bg-slate-700">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 数据表格 */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700 hover:bg-slate-700/50">
                <TableHead className="bg-slate-800 text-gray-400">交易对</TableHead>
                <TableHead className="bg-slate-800 text-gray-400">调控状态</TableHead>
                <TableHead className="bg-slate-800 text-gray-400">浮点值</TableHead>
                <TableHead className="bg-slate-800 text-gray-400 w-32">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-400 py-8">
                    加载中...
                  </TableCell>
                </TableRow>
              ) : pairs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <div className="flex flex-col items-center gap-3">
                      <p className="text-gray-400">暂无交易对数据</p>
                      <Button asChild variant="outline" size="sm">
                        <a href="/admin/trading/setup">
                          设置数据库
                        </a>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                pairs.map((pair) => (
                  <TableRow key={pair.id} className="border-slate-700 hover:bg-slate-700/30">
                    <TableCell className="text-blue-400 font-medium">{pair.symbol}</TableCell>
                    <TableCell>
                      <button
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          pair.isBotActive ? 'bg-green-600' : 'bg-gray-600'
                        }`}
                        onClick={() => handleToggleBot(pair.id, pair.isBotActive)}
                        disabled={togglingBot === pair.id}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            pair.isBotActive ? 'translate-x-6' : 'translate-x-1'
                          } ${togglingBot === pair.id ? 'opacity-50' : ''}`}
                        />
                      </button>
                    </TableCell>
                    <TableCell className="text-gray-400">
                      {pair.hasBot ? pair.floatValue.toFixed(8) : '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-gray-400 hover:text-white"
                          onClick={() => handleOpenAdjustDialog(pair)}
                        >
                          <Settings className="w-4 h-4" />
                          <span className="ml-2">调控</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                          onClick={() => handleDeletePair(pair)}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* 分页 */}
          <div className="flex items-center justify-between p-4 border-t border-slate-700">
            <div className="text-sm text-gray-400">
              显示 {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, total)} 条，共 {total} 条
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
                disabled={currentPage * pageSize >= total}
                className="border-slate-600 hover:bg-slate-700"
              >
                下一页
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 调控设置对话框 */}
      <AdjustDialog
        open={adjustDialogOpen}
        onOpenChange={setAdjustDialogOpen}
        pair={selectedPair}
        onSuccess={handleAdjustSuccess}
      />

      {/* 新增交易对对话框 */}
      <AddPairDialog
        open={addPairDialogOpen}
        onOpenChange={setAddPairDialogOpen}
        onSuccess={() => {
          fetchPairs();
          toast.success('交易对列表已更新');
        }}
      />

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-slate-800 border-slate-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除交易对</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              确定要删除交易对 <span className="text-white font-medium">{pairToDelete?.symbol}</span> 吗？
              <br />
              <span className="text-red-400">此操作不可恢复，该交易对的所有数据将被删除。</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-600 hover:bg-slate-700">
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeletePair}
              disabled={deletingPair === pairToDelete?.id}
              className="bg-red-600 hover:bg-red-700"
            >
              {deletingPair === pairToDelete?.id ? '删除中...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
