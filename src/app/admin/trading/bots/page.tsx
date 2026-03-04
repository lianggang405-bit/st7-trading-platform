'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Plus,
  Eye,
  Edit,
  Trash2,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
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

interface TradingBot {
  id: number;
  name: string;
  pairId: number;
  pairSymbol?: string;
  floatValue: number;
  createdAt: string;
  updatedAt: string;
}

export default function BotsListPage() {
  const router = useRouter();
  const [bots, setBots] = useState<TradingBot[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(15);
  const [total, setTotal] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [botToDelete, setBotToDelete] = useState<TradingBot | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchBots();
  }, [currentPage, searchQuery]);

  const fetchBots = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/trading/bots?page=${currentPage}&limit=${pageSize}&search=${searchQuery}`
      );
      const data = await response.json();

      if (data.success) {
        const botsWithSymbols = await Promise.all(
          (data.bots || []).map(async (bot: TradingBot) => {
            if (bot.pairId) {
              try {
                const pairResponse = await fetch(`/api/admin/trading/pairs/${bot.pairId}`);
                const pairData = await pairResponse.json();
                if (pairData.success) {
                  return { ...bot, pairSymbol: pairData.pair?.symbol };
                }
              } catch (err) {
                console.error('Failed to fetch pair info:', err);
              }
            }
            return bot;
          })
        );
        setBots(botsWithSymbols);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch bots:', error);
      toast.error('获取机器人列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBot = (bot: TradingBot) => {
    setBotToDelete(bot);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteBot = async () => {
    if (!botToDelete) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/trading/bots/${botToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        toast.success(`机器人 ${botToDelete.name} 已删除`);
        fetchBots();
        setDeleteDialogOpen(false);
        setBotToDelete(null);
      } else {
        toast.error(data.error || '删除失败');
      }
    } catch (error) {
      console.error('Failed to delete bot:', error);
      toast.error('删除失败，请稍后重试');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('zh-CN');
    } catch {
      return dateString;
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
            onClick={() => router.push('/admin/trading/bots/new')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            新建机器人
          </Button>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="搜索机器人"
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
                <TableHead className="bg-slate-800 text-gray-400">ID</TableHead>
                <TableHead className="bg-slate-800 text-gray-400">名称</TableHead>
                <TableHead className="bg-slate-800 text-gray-400">交易对</TableHead>
                <TableHead className="bg-slate-800 text-gray-400">浮点值</TableHead>
                <TableHead className="bg-slate-800 text-gray-400">更新时间</TableHead>
                <TableHead className="bg-slate-800 text-gray-400 w-48">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    加载中...
                  </TableCell>
                </TableRow>
              ) : bots.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex flex-col items-center gap-3">
                      <p className="text-gray-400">暂无调控机器人</p>
                      <Button
                        onClick={() => router.push('/admin/trading/bots/new')}
                        variant="outline"
                        size="sm"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        创建第一个机器人
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                bots.map((bot) => (
                  <TableRow key={bot.id} className="border-slate-700 hover:bg-slate-700/30">
                    <TableCell className="text-gray-400">{bot.id}</TableCell>
                    <TableCell className="text-white font-medium">{bot.name}</TableCell>
                    <TableCell className="text-blue-400">
                      {bot.pairSymbol || `ID: ${bot.pairId}`}
                    </TableCell>
                    <TableCell className="text-gray-400 font-mono">
                      {bot.floatValue.toFixed(8)}
                    </TableCell>
                    <TableCell className="text-gray-400">
                      {formatDate(bot.updatedAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-gray-400 hover:text-white"
                          onClick={() => router.push(`/admin/trading/bots/view/${bot.id}`)}
                        >
                          <Eye className="w-4 h-4" />
                          <span className="ml-1">查看</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-gray-400 hover:text-white"
                          onClick={() => router.push(`/admin/trading/bots/edit/${bot.id}`)}
                        >
                          <Edit className="w-4 h-4" />
                          <span className="ml-1">编辑</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                          onClick={() => handleDeleteBot(bot)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* 分页 */}
          {bots.length > 0 && (
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
          )}
        </CardContent>
      </Card>

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-slate-800 border-slate-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除调控机器人</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              确定要删除机器人 <span className="text-white font-medium">{botToDelete?.name}</span> 吗？
              <br />
              <span className="text-red-400">此操作不可恢复，该机器人的所有数据将被删除。</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-600 hover:bg-slate-700">
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteBot}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? '删除中...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
