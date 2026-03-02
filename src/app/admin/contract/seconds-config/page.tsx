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

interface SecondsConfig {
  id: number;
  seconds: number;
  status: string;
  profitRate: number;
  maxAmount: number;
  minAmount: number;
}

export default function SecondsConfigPage() {
  const [configs, setConfigs] = useState<SecondsConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedConfigs, setSelectedConfigs] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(15);
  const [totalCount, setTotalCount] = useState(0);

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

  const handleDelete = async (configId: number) => {
    if (!confirm('确定要删除此秒数设置吗？')) return;

    try {
      const response = await fetch(`/api/admin/contract/seconds-config/${configId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        toast.success('删除成功');
        fetchConfigs();
      } else {
        toast.error('删除失败');
      }
    } catch (error) {
      console.error('Failed to delete seconds config:', error);
      toast.error('删除失败');
    }
  };

  const formatNumber = (value: number, decimals: number = 2) => {
    return value.toFixed(decimals);
  };

  const getStatusBadge = (status: string) => {
    if (status === '正常') {
      return <Badge className="bg-green-500/10 text-green-400">正常</Badge>;
    } else if (status === '禁用') {
      return <Badge className="bg-gray-500/10 text-gray-400">禁用</Badge>;
    }
    return <Badge className="bg-gray-500/10 text-gray-400">{status}</Badge>;
  };

  const getStatusText = (status: string) => {
    return status === 'normal' ? '正常' : status === 'disabled' ? '禁用' : status;
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
          <Button className="bg-blue-600 hover:bg-blue-700">
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
                  <TableHead className="bg-slate-800 text-gray-400 whitespace-nowrap w-32">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configs.map((config) => (
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
                    <TableCell className="text-gray-300 whitespace-nowrap">{config.seconds}</TableCell>
                    <TableCell className="whitespace-nowrap">{getStatusBadge(getStatusText(config.status))}</TableCell>
                    <TableCell className="text-gray-400 whitespace-nowrap font-mono text-xs">{formatNumber(config.profitRate)}%</TableCell>
                    <TableCell className="text-gray-400 whitespace-nowrap font-mono text-xs">{formatNumber(config.maxAmount)}</TableCell>
                    <TableCell className="text-gray-400 whitespace-nowrap font-mono text-xs">{formatNumber(config.minAmount)}</TableCell>
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
                          onClick={() => handleDelete(config.id)}
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
                disabled={configs.length < pageSize}
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
