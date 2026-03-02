'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

interface UserLevel {
  id: number;
  name: string;
  level: number;
  minDeposit: number;
  maxDeposit: number;
  tradingFee: number;
  withdrawalFee: number;
  privileges: string[];
  status: string;
  createdAt: string;
}

export default function UserLevelsPage() {
  const [levels, setLevels] = useState<UserLevel[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string>('level');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchLevels();
  }, [sortField, sortOrder]);

  const fetchLevels = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/users/levels?sort=${sortField}&order=${sortOrder}&search=${searchQuery}`
      );
      const data = await response.json();
      if (data.success) {
        setLevels(data.levels || []);
      }
    } catch (error) {
      console.error('Failed to fetch user levels:', error);
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

  const handleDelete = async (levelId: number) => {
    if (!confirm('确定要删除此用户等级吗？')) return;

    try {
      const response = await fetch(`/api/admin/users/levels/${levelId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        toast.success('用户等级删除成功');
        fetchLevels();
      } else {
        toast.error('用户等级删除失败');
      }
    } catch (error) {
      console.error('Failed to delete user level:', error);
      toast.error('用户等级删除失败');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      active: { color: 'bg-green-500/10 text-green-400', text: '启用' },
      inactive: { color: 'bg-red-500/10 text-red-400', text: '禁用' },
    };
    const config = statusMap[status] || statusMap.active;
    return <Badge className={config.color}>{config.text}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* 面包屑导航 */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>资源</span> / <span className="text-white">用户等级</span>
      </div>

      {/* 页面标题和操作栏 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">用户等级</h1>
        <div className="flex gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="搜索"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchLevels()}
              className="pl-9 bg-slate-700 border-slate-600 text-white"
            />
          </div>
          <Button variant="outline" size="icon" className="border-slate-600 hover:bg-slate-700">
            <Filter className="w-4 h-4" />
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            创建用户等级
          </Button>
        </div>
      </div>

      {/* 数据表格或空状态 */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-0">
          {levels.length === 0 ? (
            // 空状态
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mb-4">
                <Table className="w-8 h-8 text-gray-500" />
              </div>
              <p className="text-gray-400 mb-4">用户等级不符合给定的标准。</p>
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(true)}
                className="border-slate-600 hover:bg-slate-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                创建用户等级
              </Button>
            </div>
          ) : (
            // 数据表格
            <>
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700 hover:bg-slate-700/50">
                    <TableHead className="bg-slate-800 text-gray-400 w-20">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 text-blue-400 hover:text-blue-300"
                        onClick={() => handleSort('level')}
                      >
                        等级
                        {sortField === 'level' && (
                          sortOrder === 'asc' ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead className="bg-slate-800 text-gray-400">等级名称</TableHead>
                    <TableHead className="bg-slate-800 text-gray-400">最低存款</TableHead>
                    <TableHead className="bg-slate-800 text-gray-400">最高存款</TableHead>
                    <TableHead className="bg-slate-800 text-gray-400">交易手续费</TableHead>
                    <TableHead className="bg-slate-800 text-gray-400">提现手续费</TableHead>
                    <TableHead className="bg-slate-800 text-gray-400">特权</TableHead>
                    <TableHead className="bg-slate-800 text-gray-400">状态</TableHead>
                    <TableHead className="bg-slate-800 text-gray-400 w-24">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {levels.map((level) => (
                    <TableRow key={level.id} className="border-slate-700 hover:bg-slate-700/30">
                      <TableCell className="text-blue-400 font-medium">{level.level}</TableCell>
                      <TableCell className="text-gray-300">{level.name}</TableCell>
                      <TableCell className="text-gray-400">{level.minDeposit.toLocaleString()}</TableCell>
                      <TableCell className="text-gray-400">{level.maxDeposit.toLocaleString()}</TableCell>
                      <TableCell className="text-gray-400">{(level.tradingFee * 100).toFixed(2)}%</TableCell>
                      <TableCell className="text-gray-400">{level.withdrawalFee}%</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {level.privileges.map((priv, idx) => (
                            <span key={idx} className="px-2 py-1 bg-slate-700 rounded text-xs text-gray-300">
                              {priv}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(level.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
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
                            onClick={() => handleDelete(level.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>

      {/* 创建/编辑用户等级对话框（预留） */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="bg-slate-800 border-slate-700 w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="text-white">创建用户等级</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 mb-4">创建用户等级功能开发中...</p>
              <Button onClick={() => setShowCreateModal(false)}>关闭</Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
