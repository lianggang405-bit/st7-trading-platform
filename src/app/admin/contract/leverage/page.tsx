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

interface LeverageSetting {
  id: number;
  type: string;
  value: number;
  symbol: string;
}

export default function LeverageSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<LeverageSetting[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedSettings, setSelectedSettings] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(15);
  const [totalCount, setTotalCount] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [settingToDelete, setSettingToDelete] = useState<LeverageSetting | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [currentPage, sortField, sortOrder]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/contract/leverage?page=${currentPage}&limit=${pageSize}&sort=${sortField}&order=${sortOrder}&search=${searchQuery}`
      );
      const data = await response.json();
      if (data.success) {
        setSettings(data.settings || []);
        setTotalCount(data.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
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
      setSelectedSettings(new Set(settings.map(s => s.id)));
    } else {
      setSelectedSettings(new Set());
    }
  };

  const handleSelectSetting = (settingId: number, checked: boolean) => {
    const newSelected = new Set(selectedSettings);
    if (checked) {
      newSelected.add(settingId);
    } else {
      newSelected.delete(settingId);
    }
    setSelectedSettings(newSelected);
  };

  const handleDelete = (setting: LeverageSetting) => {
    setSettingToDelete(setting);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!settingToDelete) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/contract/leverage/${settingToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        toast.success(`倍数设置 ${settingToDelete.symbol} ${settingToDelete.value}x 已删除`);
        fetchSettings();
        setDeleteDialogOpen(false);
        setSettingToDelete(null);
      } else {
        toast.error(data.error || '删除失败');
      }
    } catch (error) {
      console.error('Failed to delete setting:', error);
      toast.error('删除失败，请稍后重试');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 面包屑导航 */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>资源</span> / <span className="text-white">倍数设置</span>
      </div>

      {/* 页面标题和操作栏 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">倍数设置</h1>
        <div className="flex gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="搜索"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchSettings()}
              className="pl-9 bg-slate-700 border-slate-600 text-white"
            />
          </div>
          <Button variant="outline" size="icon" className="border-slate-600 hover:bg-slate-700">
            <Filter className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => router.push('/admin/contract/leverage/new')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            创建 倍数设置
          </Button>
        </div>
      </div>

      {/* 数据表格 */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700 hover:bg-slate-700/50">
                <TableHead className="w-12 bg-slate-800">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-500 bg-slate-700"
                    checked={selectedSettings.size === settings.length && settings.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </TableHead>
                <TableHead className="bg-slate-800 text-gray-400">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-blue-400 hover:text-blue-300"
                    onClick={() => handleSort('id')}
                  >
                    ID
                    {sortField === 'id' && (
                      sortOrder === 'asc' ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />
                    )}
                  </Button>
                </TableHead>
                <TableHead className="bg-slate-800 text-gray-400">类型</TableHead>
                <TableHead className="bg-slate-800 text-gray-400">值</TableHead>
                <TableHead className="bg-slate-800 text-gray-400">品种</TableHead>
                <TableHead className="bg-slate-800 text-gray-400 w-48">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                    加载中...
                  </TableCell>
                </TableRow>
              ) : settings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex flex-col items-center gap-3">
                      <p className="text-gray-400">暂无倍数设置数据</p>
                      <Button
                        onClick={() => router.push('/admin/contract/leverage/new')}
                        variant="outline"
                        size="sm"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        创建第一个倍数设置
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                settings.map((setting) => (
                  <TableRow key={setting.id} className="border-slate-700 hover:bg-slate-700/30">
                    <TableCell>
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-gray-500 bg-slate-700"
                        checked={selectedSettings.has(setting.id)}
                        onChange={(e) => handleSelectSetting(setting.id, e.target.checked)}
                      />
                    </TableCell>
                    <TableCell className="text-blue-400 font-medium">{setting.id}</TableCell>
                    <TableCell className="text-gray-300">{setting.type}</TableCell>
                    <TableCell className="text-blue-400 font-medium">{setting.value}x</TableCell>
                    <TableCell className="text-blue-400 font-medium">{setting.symbol}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-gray-400 hover:text-white"
                          onClick={() => router.push(`/admin/contract/leverage/view/${setting.id}`)}
                        >
                          <Eye className="w-4 h-4" />
                          <span className="ml-1">查看</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-gray-400 hover:text-white"
                          onClick={() => router.push(`/admin/contract/leverage/edit/${setting.id}`)}
                        >
                          <Edit className="w-4 h-4" />
                          <span className="ml-1">编辑</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                          onClick={() => handleDelete(setting)}
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
          {settings.length > 0 && (
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
            <AlertDialogTitle>确认删除倍数设置</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              确定要删除倍数设置 <span className="text-white font-medium">{settingToDelete?.symbol} {settingToDelete?.value}x</span> 吗？
              <br />
              <span className="text-red-400">此操作不可恢复，该倍数设置将被永久删除。</span>
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
