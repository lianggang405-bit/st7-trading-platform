'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, RefreshCw, Plus, Edit2, Trash2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import adminFetch from '@/lib/admin-fetch';

interface TradingSchedule {
  id: number;
  symbol: string;
  market: string;
  openTime: string;
  closeTime: string;
  timezone: string;
  days: string[];
  status: 'active' | 'inactive';
  createdAt: string;
}

export default function TradingSchedulePage() {
  const [schedules, setSchedules] = useState<TradingSchedule[]>([]);
  const [filteredSchedules, setFilteredSchedules] = useState<TradingSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<TradingSchedule | null>(null);
  const [formData, setFormData] = useState<{
    symbol: string;
    market: string;
    openTime: string;
    closeTime: string;
    timezone: string;
    days: string[];
    status: 'active' | 'inactive';
  }>({
    symbol: '',
    market: 'global',
    openTime: '00:00',
    closeTime: '23:59',
    timezone: 'UTC',
    days: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
    status: 'active',
  });
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    fetchSchedules();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = schedules.filter(
        (schedule) =>
          schedule.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          schedule.market.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSchedules(filtered);
    } else {
      setFilteredSchedules(schedules);
    }
  }, [searchQuery, schedules]);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const response = await adminFetch('/api/admin/trading/schedule');
      const data = await response.json();
      if (data.success) {
        setSchedules(data.schedules || []);
        setFilteredSchedules(data.schedules || []);
      }
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
      toast.error('获取开盘时间配置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.symbol || !formData.openTime || !formData.closeTime) {
      toast.error('请填写完整信息');
      return;
    }

    setSaveLoading(true);
    try {
      const url = selectedSchedule
        ? `/api/admin/trading/schedule/${selectedSchedule.id}`
        : '/api/admin/trading/schedule';
      const method = selectedSchedule ? 'PATCH' : 'POST';

      const response = await adminFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(selectedSchedule ? '配置更新成功' : '配置创建成功');
        setDialogOpen(false);
        resetFormData();
        fetchSchedules();
      } else {
        toast.error(data.error || '操作失败');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('操作失败，请稍后重试');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确认删除该开盘时间配置？')) return;

    try {
      const response = await adminFetch(`/api/admin/trading/schedule/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        toast.success('配置删除成功');
        fetchSchedules();
      } else {
        toast.error(data.error || '删除失败');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('删除失败，请稍后重试');
    }
  };

  const handleEdit = (schedule: TradingSchedule) => {
    setSelectedSchedule(schedule);
    setFormData({
      symbol: schedule.symbol,
      market: schedule.market,
      openTime: schedule.openTime,
      closeTime: schedule.closeTime,
      timezone: schedule.timezone,
      days: schedule.days,
      status: schedule.status,
    });
    setDialogOpen(true);
  };

  const resetFormData = () => {
    setSelectedSchedule(null);
    setFormData({
      symbol: '',
      market: 'global',
      openTime: '00:00',
      closeTime: '23:59',
      timezone: 'UTC',
      days: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
      status: 'active',
    });
  };

  const getStatusBadge = (status: string) => {
    return status === 'active'
      ? <Badge className="bg-green-500/10 text-green-400">启用</Badge>
      : <Badge className="bg-gray-500/10 text-gray-400">禁用</Badge>;
  };

  const dayLabels = {
    MON: '周一',
    TUE: '周二',
    WED: '周三',
    THU: '周四',
    FRI: '周五',
    SAT: '周六',
    SUN: '周日',
  };

  return (
    <div className="space-y-6">
      {/* 面包屑 */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-400">桌面</span>
        <span className="text-gray-600">/</span>
        <span className="text-gray-400">品种交易</span>
        <span className="text-gray-600">/</span>
        <span className="text-white">开盘时间</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-white">开盘时间管理</h1>
        <p className="text-gray-400 mt-1">配置交易品种的开盘时间</p>
      </div>

      {/* 操作栏 */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="搜索品种或市场..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-slate-700 border-slate-600 text-white placeholder:text-gray-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={fetchSchedules}
                variant="outline"
                size="icon"
                className="border-slate-600 hover:bg-slate-700"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Dialog open={dialogOpen} onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) resetFormData();
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-1" />
                    添加配置
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-800 border-slate-700">
                  <DialogHeader>
                    <DialogTitle className="text-white">
                      {selectedSchedule ? '编辑开盘时间配置' : '添加开盘时间配置'}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label className="text-gray-300">品种代码</Label>
                      <Input
                        value={formData.symbol}
                        onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                        placeholder="BTC/USDT 或 * 表示全部"
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-300">市场</Label>
                      <Input
                        value={formData.market}
                        onChange={(e) => setFormData({ ...formData, market: e.target.value })}
                        placeholder="global"
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-gray-300">开盘时间</Label>
                        <Input
                          type="time"
                          value={formData.openTime}
                          onChange={(e) => setFormData({ ...formData, openTime: e.target.value })}
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-300">收盘时间</Label>
                        <Input
                          type="time"
                          value={formData.closeTime}
                          onChange={(e) => setFormData({ ...formData, closeTime: e.target.value })}
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-300">时区</Label>
                      <Input
                        value={formData.timezone}
                        onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                        placeholder="UTC"
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDialogOpen(false);
                        resetFormData();
                      }}
                      className="border-slate-600 hover:bg-slate-700"
                    >
                      取消
                    </Button>
                    <Button onClick={handleSave} disabled={saveLoading}>
                      {saveLoading ? '保存中...' : '保存'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 配置列表 */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">开盘时间配置</CardTitle>
          <CardDescription className="text-gray-400">
            共 {filteredSchedules.length} 条配置
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-400">加载中...</div>
            </div>
          ) : filteredSchedules.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-400">暂无开盘时间配置</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-gray-400">品种</TableHead>
                    <TableHead className="text-gray-400">市场</TableHead>
                    <TableHead className="text-gray-400">开盘时间</TableHead>
                    <TableHead className="text-gray-400">收盘时间</TableHead>
                    <TableHead className="text-gray-400">时区</TableHead>
                    <TableHead className="text-gray-400">交易日</TableHead>
                    <TableHead className="text-gray-400">状态</TableHead>
                    <TableHead className="text-gray-400 text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSchedules.map((schedule) => (
                    <TableRow key={schedule.id} className="border-slate-700 hover:bg-slate-700/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="w-5 h-5 text-blue-400" />
                          <span className="text-gray-300 font-medium">{schedule.symbol}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-400">{schedule.market}</TableCell>
                      <TableCell className="text-gray-300">{schedule.openTime}</TableCell>
                      <TableCell className="text-gray-300">{schedule.closeTime}</TableCell>
                      <TableCell className="text-gray-400">{schedule.timezone}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {schedule.days.map((day) => (
                            <Badge key={day} variant="outline" className="text-xs">
                              {dayLabels[day as keyof typeof dayLabels] || day}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(schedule.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(schedule)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(schedule.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
