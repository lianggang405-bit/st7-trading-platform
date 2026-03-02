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

interface LeverageSetting {
  id: number;
  type: string;
  value: number;
  symbol: string;
}

export default function LeverageSettingsPage() {
  const [settings, setSettings] = useState<LeverageSetting[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedSettings, setSelectedSettings] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(15);
  const [totalCount, setTotalCount] = useState(0);

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

  const handleDelete = async (settingId: number) => {
    if (!confirm('确定要删除此倍数设置吗？')) return;

    try {
      const response = await fetch(`/api/admin/contract/leverage/${settingId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        toast.success('删除成功');
        fetchSettings();
      } else {
        toast.error('删除失败');
      }
    } catch (error) {
      console.error('Failed to delete setting:', error);
      toast.error('删除失败');
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
          <Button className="bg-blue-600 hover:bg-blue-700">
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
                    className="rounded border-gray-500 bg-slate-700"
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
                <TableHead className="bg-slate-800 text-gray-400 w-32">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {settings.map((setting) => (
                <TableRow key={setting.id} className="border-slate-700 hover:bg-slate-700/30">
                  <TableCell>
                    <input
                      type="checkbox"
                      className="rounded border-gray-500 bg-slate-700"
                      checked={selectedSettings.has(setting.id)}
                      onChange={(e) => handleSelectSetting(setting.id, e.target.checked)}
                    />
                  </TableCell>
                  <TableCell className="text-blue-400 font-medium">{setting.id}</TableCell>
                  <TableCell className="text-gray-300">{setting.type}</TableCell>
                  <TableCell className="text-gray-400">{setting.value}</TableCell>
                  <TableCell className="text-blue-400 font-medium">{setting.symbol}</TableCell>
                  <TableCell>
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
                        onClick={() => handleDelete(setting.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

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
                disabled={settings.length < pageSize}
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
