'use client';

import React, { useState, useEffect } from 'react';
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

interface TradingHour {
  id: number;
  symbol: string;
  mondayOpen: string;
  mondayClose: string;
  tuesdayOpen: string;
  tuesdayClose: string;
  wednesdayOpen: string;
  wednesdayClose: string;
  thursdayOpen: string;
  thursdayClose: string;
  fridayOpen: string;
  fridayClose: string;
  saturdayOpen: string;
  saturdayClose: string;
  sundayOpen: string;
  sundayClose: string;
}

export default function TradingHoursPage() {
  const [hours, setHours] = useState<TradingHour[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedHours, setSelectedHours] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  useEffect(() => {
    fetchHours();
  }, [currentPage, sortField, sortOrder]);

  const fetchHours = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/trading/hours?page=${currentPage}&limit=${pageSize}&sort=${sortField}&order=${sortOrder}&search=${searchQuery}`
      );
      const data = await response.json();
      if (data.success) {
        setHours(data.hours || []);
      }
    } catch (error) {
      console.error('Failed to fetch trading hours:', error);
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
      setSelectedHours(new Set(hours.map(h => h.id)));
    } else {
      setSelectedHours(new Set());
    }
  };

  const handleSelectHour = (hourId: number, checked: boolean) => {
    const newSelected = new Set(selectedHours);
    if (checked) {
      newSelected.add(hourId);
    } else {
      newSelected.delete(hourId);
    }
    setSelectedHours(newSelected);
  };

  const handleDelete = async (hourId: number) => {
    if (!confirm('确定要删除此开盘时间配置吗？')) return;

    try {
      const response = await fetch(`/api/admin/trading/hours/${hourId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        toast.success('开盘时间配置删除成功');
        fetchHours();
      } else {
        toast.error('开盘时间配置删除失败');
      }
    } catch (error) {
      console.error('Failed to delete trading hour:', error);
      toast.error('开盘时间配置删除失败');
    }
  };

  const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

  return (
    <div className="space-y-6">
      {/* 面包屑导航 */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>资源</span> / <span className="text-white">开盘时间</span>
      </div>

      {/* 页面标题和操作栏 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">开盘时间</h1>
        <div className="flex gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="搜索"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchHours()}
              className="pl-9 bg-slate-700 border-slate-600 text-white"
            />
          </div>
          <Button variant="outline" size="icon" className="border-slate-600 hover:bg-slate-700">
            <Filter className="w-4 h-4" />
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            创建开盘时间
          </Button>
        </div>
      </div>

      {/* 数据表格 */}
      <Card className="bg-slate-800 border-slate-700 overflow-x-auto">
        <CardContent className="p-0">
          <div className="min-w-[2000px]">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700 hover:bg-slate-700/50">
                  <TableHead className="bg-slate-800 text-gray-400 sticky left-0 w-12">
                    <input
                      type="checkbox"
                      className="rounded border-gray-500 bg-slate-700"
                      checked={selectedHours.size === hours.length && hours.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </TableHead>
                  <TableHead className="bg-slate-800 text-gray-400 sticky left-12 w-20">
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
                  <TableHead className="bg-slate-800 text-gray-400 sticky left-32">品种</TableHead>
                  {days.map((day) => (
                    <React.Fragment key={day}>
                      <TableHead className="bg-slate-800 text-gray-400 text-center whitespace-nowrap">
                        {day}（开）
                      </TableHead>
                      <TableHead className="bg-slate-800 text-gray-400 text-center whitespace-nowrap">
                        {day}（休）
                      </TableHead>
                    </React.Fragment>
                  ))}
                  <TableHead className="bg-slate-800 text-gray-400 w-24 sticky right-0">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hours.map((hour) => (
                  <TableRow key={hour.id} className="border-slate-700 hover:bg-slate-700/30">
                    <TableCell className="sticky left-0 bg-slate-800/50">
                      <input
                        type="checkbox"
                        className="rounded border-gray-500 bg-slate-700"
                        checked={selectedHours.has(hour.id)}
                        onChange={(e) => handleSelectHour(hour.id, e.target.checked)}
                      />
                    </TableCell>
                    <TableCell className="text-blue-400 font-medium sticky left-12 bg-slate-800/50">{hour.id}</TableCell>
                    <TableCell className="text-gray-300 font-medium sticky left-32 bg-slate-800/50">{hour.symbol}</TableCell>
                    <TableCell className="text-gray-400 text-center">{hour.mondayOpen}</TableCell>
                    <TableCell className="text-gray-400 text-center">{hour.mondayClose}</TableCell>
                    <TableCell className="text-gray-400 text-center">{hour.tuesdayOpen}</TableCell>
                    <TableCell className="text-gray-400 text-center">{hour.tuesdayClose}</TableCell>
                    <TableCell className="text-gray-400 text-center">{hour.wednesdayOpen}</TableCell>
                    <TableCell className="text-gray-400 text-center">{hour.wednesdayClose}</TableCell>
                    <TableCell className="text-gray-400 text-center">{hour.thursdayOpen}</TableCell>
                    <TableCell className="text-gray-400 text-center">{hour.thursdayClose}</TableCell>
                    <TableCell className="text-gray-400 text-center">{hour.fridayOpen}</TableCell>
                    <TableCell className="text-gray-400 text-center">{hour.fridayClose}</TableCell>
                    <TableCell className="text-gray-400 text-center">{hour.saturdayOpen}</TableCell>
                    <TableCell className="text-gray-400 text-center">{hour.saturdayClose}</TableCell>
                    <TableCell className="text-gray-400 text-center">{hour.sundayOpen}</TableCell>
                    <TableCell className="text-gray-400 text-center">{hour.sundayClose}</TableCell>
                    <TableCell className="sticky right-0 bg-slate-800/50">
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
                          onClick={() => handleDelete(hour.id)}
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
              显示 {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, hours.length)} 条，共 {hours.length} 条
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
                disabled={hours.length < pageSize}
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
