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
  Coins,
} from 'lucide-react';

interface InvestmentProject {
  id: number;
  name: string;
  icon: string;
  rate: number;
  quantity: number;
  minStaking: number;
  maxStaking: number;
  defaultStaking: number;
  lockDays: number;
}

/**
 * 理财项目页面 - 纯展示页面
 *
 * 注意：此页面仅用于展示，所有功能已被禁用
 * 该功能暂时未启用，避免误操作引起错误
 */

export default function InvestmentProjectsPage() {
  // 静态展示数据
  const staticData: InvestmentProject[] = [
    {
      id: 1,
      name: 'ETH 质押 30天',
      icon: 'ETH',
      rate: 5.5,
      quantity: 100,
      minStaking: 100,
      maxStaking: 100000,
      defaultStaking: 1000,
      lockDays: 30,
    },
    {
      id: 2,
      name: 'BTC 定存 90天',
      icon: 'BTC',
      rate: 6.8,
      quantity: 50,
      minStaking: 500,
      maxStaking: 500000,
      defaultStaking: 5000,
      lockDays: 90,
    },
    {
      id: 3,
      name: 'USDT 灵活收益',
      icon: 'USDT',
      rate: 3.2,
      quantity: 1000,
      minStaking: 100,
      maxStaking: 1000000,
      defaultStaking: 10000,
      lockDays: 7,
    },
  ];

  const [projects, setProjects] = useState<InvestmentProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedProjects, setSelectedProjects] = useState<Set<number>>(new Set());
  const [showNotice, setShowNotice] = useState(false);

  useEffect(() => {
    setProjects(staticData);
    // 显示功能提示
    setShowNotice(true);
    // 5秒后自动隐藏提示
    const timer = setTimeout(() => setShowNotice(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  // 客户端搜索和排序
  useEffect(() => {
    let filtered = [...staticData];

    // 搜索
    if (searchQuery) {
      filtered = filtered.filter(
        (project) =>
          project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.icon.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.id.toString().includes(searchQuery)
      );
    }

    // 排序
    filtered.sort((a, b) => {
      const aVal = (a as any)[sortField];
      const bVal = (b as any)[sortField];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortOrder === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });

    setProjects(filtered);
  }, [searchQuery, sortField, sortOrder]);

  // 禁用的操作函数
  const handleDisabledAction = () => {
    return;
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
      setSelectedProjects(new Set(projects.map(p => p.id)));
    } else {
      setSelectedProjects(new Set());
    }
  };

  const handleSelectProject = (projectId: number, checked: boolean) => {
    const newSelected = new Set(selectedProjects);
    if (checked) {
      newSelected.add(projectId);
    } else {
      newSelected.delete(projectId);
    }
    setSelectedProjects(newSelected);
  };

  return (
    <div className="space-y-6">
      {/* 面包屑导航 */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>资源</span> / <span className="text-white">理财项目</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-white">理财项目</h1>
        <p className="text-gray-400 mt-1">理财产品列表（仅展示）</p>
      </div>

      {/* 功能未启用提示 */}
      {showNotice && (
        <Card className="bg-yellow-900/20 border-yellow-900">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-yellow-400 font-medium mb-1">功能未启用</p>
                <p className="text-yellow-300/80 text-sm">
                  此功能暂时未启用，页面仅用于展示。所有操作按钮已被禁用，无法添加、编辑或删除数据。
                </p>
              </div>
              <button
                onClick={() => setShowNotice(false)}
                className="ml-auto flex-shrink-0 text-yellow-400 hover:text-yellow-300"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 操作栏 - 所有按钮禁用 */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="搜索"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-slate-700 border-slate-600 text-white placeholder:text-gray-500"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            disabled
            className="border-slate-600 bg-slate-700 text-gray-500 cursor-not-allowed"
            title="功能已禁用"
          >
            <Filter className="w-4 h-4" />
          </Button>
          <Button
            disabled
            className="bg-slate-700 text-gray-500 cursor-not-allowed"
            title="功能已禁用"
          >
            <Plus className="w-4 h-4 mr-2" />
            创建Project（已禁用）
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
                    disabled
                    className="w-4 h-4 rounded border-gray-500 bg-slate-700 opacity-50 cursor-not-allowed"
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
                <TableHead className="bg-slate-800 text-gray-400">名称</TableHead>
                <TableHead className="bg-slate-800 text-gray-400">图标</TableHead>
                <TableHead className="bg-slate-800 text-gray-400">息率</TableHead>
                <TableHead className="bg-slate-800 text-gray-400">数量</TableHead>
                <TableHead className="bg-slate-800 text-gray-400">最小质押</TableHead>
                <TableHead className="bg-slate-800 text-gray-400">最大质押</TableHead>
                <TableHead className="bg-slate-800 text-gray-400">默认质押</TableHead>
                <TableHead className="bg-slate-800 text-gray-400">锁仓天数</TableHead>
                <TableHead className="bg-slate-800 text-gray-400 w-32">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id} className="border-slate-700 hover:bg-slate-700/30">
                  <TableCell>
                    <input
                      type="checkbox"
                      disabled
                      className="w-4 h-4 rounded border-gray-500 bg-slate-700 opacity-50 cursor-not-allowed"
                    />
                  </TableCell>
                  <TableCell className="text-blue-400 font-medium">{project.id}</TableCell>
                  <TableCell className="text-gray-300 font-medium">{project.name}</TableCell>
                  <TableCell>
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                      <Coins className="w-4 h-4 text-yellow-400" />
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-400">{project.rate.toFixed(2)}%</TableCell>
                  <TableCell className="text-gray-400">{project.quantity}</TableCell>
                  <TableCell className="text-gray-400">{project.minStaking.toLocaleString()}</TableCell>
                  <TableCell className="text-gray-400">{project.maxStaking.toLocaleString()}</TableCell>
                  <TableCell className="text-gray-400">{project.defaultStaking.toLocaleString()}</TableCell>
                  <TableCell className="text-gray-400">{project.lockDays} 天</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled
                        className="h-8 w-8 text-gray-500 cursor-not-allowed"
                        title="功能已禁用"
                        onClick={handleDisabledAction}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled
                        className="h-8 w-8 text-gray-500 cursor-not-allowed"
                        title="功能已禁用"
                        onClick={handleDisabledAction}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled
                        className="h-8 w-8 text-gray-500 cursor-not-allowed"
                        title="功能已禁用"
                        onClick={handleDisabledAction}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled
                        className="h-8 w-8 text-gray-500 cursor-not-allowed"
                        title="功能已禁用"
                        onClick={handleDisabledAction}
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
              {projects.length > 0 ? `1-${projects.length} of ${projects.length}` : '0-0 of 0'}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled
                className="border-slate-600 bg-slate-700 text-gray-500 cursor-not-allowed"
              >
                上一页
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled
                className="border-slate-600 bg-slate-700 text-gray-500 cursor-not-allowed"
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
