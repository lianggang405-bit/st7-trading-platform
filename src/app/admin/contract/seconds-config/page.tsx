'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Eye,
  Edit,
  Trash2,
  ChevronUp,
  ChevronDown,
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

interface SecondsConfig {
  id: number;
  seconds: number;
  status: string;
  profitRate: number;
  maxAmount: number;
  minAmount: number;
}

export default function SecondsConfigPage() {
  const router = useRouter();
  const [configs, setConfigs] = useState<SecondsConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedConfigs, setSelectedConfigs] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(15);
  const [totalCount, setTotalCount] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [configToDelete, setConfigToDelete] = useState<SecondsConfig | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchConfigs();
  }, [currentPage, sortField, sortOrder]);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/contract/seconds-config?page=${currentPage}&limit=${pageSize}&sort=${sortField}&order=${sortOrder}&search=${searchQuery}`
      );
      const data = await response.json();
      if (data.success) {
        setConfigs(data.configs || []);
        setTotalCount(data.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch seconds config:', error);
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
      setSelectedConfigs(new Set(configs.map(c => c.id)));
    } else {
      setSelectedConfigs(new Set());
    }
  };

  const handleSelectConfig = (configId: number, checked: boolean) => {
    const newSelected = new Set(selectedConfigs);
    if (checked) {
      newSelected.add(configId);
    } else {
      newSelected.delete(configId);
    }
    setSelectedConfigs(newSelected);
  };

  const handleDelete = (config: SecondsConfig) => {
    setConfigToDelete(config);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!configToDelete) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/contract/seconds-config/${configToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        toast.success(`秒数设置 ${configToDelete.seconds}秒 已删除`);
        fetchConfigs();
        setDeleteDialogOpen(false);
        setConfigToDelete(null);
      } else {
        toast.error(data.error || '删除失败');
      }
    } catch (error) {
      console.error('Failed to delete seconds config:', error);
      toast.error('删除失败，请稍后重试');
    } finally {
      setDeleting(false);
    }
  };

  const formatNumber = (value: number, decimals: number = 2) => {
    return value.toFixed(decimals);
  };

  const getStatusBadge = (status: string) => {
    if (status === 'normal' || status === '正常') {
      return <Badge className="bg-green-500/10 text-green-400">正常</Badge>;
    } else if (status === 'disabled' || status === '禁用') {
      return <Badge className="bg-gray-500/10 text-gray-400">禁用</Badge>;
    }
    return <Badge className="bg-gray-500/10 text-gray-400">{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* 面包屑导航 */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>资源</span> / <span className="text-white">秒数设置</span>
      </div>

      {/* 页面标题和操作栏 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">秒数设置</h1>
        <div className="flex gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="搜索"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchConfigs()}
              className="pl-9 bg-slate-700 border-slate-600 text-white"
            />
          </div>
          <Button variant="outline" size="icon" className="border-slate-600 hover:bg-slate-700">
            <Filter className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => router.push('/admin/contract/seconds-config/new')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            创建秒数设置
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
                      checked={selectedConfigs.size === configs.length && configs.length > 0}
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
                  <TableHead className="bg-slate-800 text-gray-400 whitespace-nowrap">秒数</TableHead>
                  <TableHead className="bg-slate-800 text-gray-400 whitespace-nowrap">状态</TableHead>
                  <TableHead className="bg-slate-800 text-gray-400 whitespace-nowrap">收益率</TableHead>
                  <TableHead className="bg-slate-800 text-gray-400 whitespace-nowrap">最高金额</TableHead>
                  <TableHead className="bg-slate-800 text-gray-400 whitespace-nowrap">最低金额</TableHead>
                  <TableHead className="bg-slate-800 text-gray-400 whitespace-nowrap w-48">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-gray-400 py-8">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : configs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex flex-col items-center gap-3">
                        <p className="text-gray-400">暂无秒数设置数据</p>
                        <Button
                          onClick={() => router.push('/admin/contract/seconds-config/new')}
                          variant="outline"
                          size="sm"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          创建第一个秒数设置
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  configs.map((config) => (
                    <TableRow key={config.id} className="border-slate-700 hover:bg-slate-700/30">
                      <TableCell className="whitespace-nowrap">
                        <input
                          type="checkbox"
                          className="rounded border-gray-500 bg-slate-700"
                          checked={selectedConfigs.has(config.id)}
                          onChange={(e) => handleSelectConfig(config.id, e.target.checked)}
                        />
                      </TableCell>
                      <TableCell className="text-blue-400 font-medium whitespace-nowrap">{config.id}</TableCell>
                      <TableCell className="text-gray-300 whitespace-nowrap">{config.seconds} 秒</TableCell>
                      <TableCell className="whitespace-nowrap">{getStatusBadge(config.status)}</TableCell>
                      <TableCell className="text-gray-400 whitespace-nowrap font-mono text-xs">{(config.profitRate * 100).toFixed(2)}%</TableCell>
                      <TableCell className="text-gray-400 whitespace-nowrap font-mono text-xs">{config.maxAmount.toLocaleString()}</TableCell>
                      <TableCell className="text-gray-400 whitespace-nowrap font-mono text-xs">{config.minAmount.toLocaleString()}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-gray-400 hover:text-white"
                            onClick={() => router.push(`/admin/contract/seconds-config/view/${config.id}`)}
                          >
                            <Eye className="w-4 h-4" />
                            <span className="ml-1">查看</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-gray-400 hover:text-white"
                            onClick={() => router.push(`/admin/contract/seconds-config/edit/${config.id}`)}
                          >
                            <Edit className="w-4 h-4" />
                            <span className="ml-1">编辑</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                            onClick={() => handleDelete(config)}
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
          </div>

          {/* 分页 */}
          {configs.length > 0 && (
            <div className="flex items-center justify-between p-4 border-t border-slate-700">
              <div className="text-sm text-gray-400">
                显示 {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalCount)} 条，共 {totalCount} 条
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
                  disabled={currentPage * pageSize >= totalCount}
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
            <AlertDialogTitle>确认删除秒数设置</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              确定要删除秒数设置 <span className="text-white font-medium">{configToDelete?.seconds}秒</span> 吗？
              <br />
              <span className="text-red-400">此操作不可恢复，该秒数设置将被永久删除。</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-600 hover:bg-slate-700">
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
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
