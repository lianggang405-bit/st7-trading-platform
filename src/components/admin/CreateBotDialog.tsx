'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface TradingPair {
  id: number;
  symbol: string;
}

interface TradingBot {
  id?: number;
  name: string;
  pairId: number;
  floatValue: number;
}

interface CreateBotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  editBot?: TradingBot | null;
}

export default function CreateBotDialog({
  open,
  onOpenChange,
  onSuccess,
  editBot,
}: CreateBotDialogProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pairs, setPairs] = useState<TradingPair[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    pairId: '',
    floatValue: 0,
  });

  // 获取交易对列表
  useEffect(() => {
    if (open) {
      fetchTradingPairs();
      if (editBot) {
        setFormData({
          name: editBot.name,
          pairId: editBot.pairId.toString(),
          floatValue: editBot.floatValue,
        });
      } else {
        setFormData({
          name: '',
          pairId: '',
          floatValue: 0,
        });
      }
    }
  }, [open, editBot]);

  const fetchTradingPairs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/trading/pairs');
      const data = await response.json();
      if (data.success) {
        setPairs(data.pairs || []);
      }
    } catch (error) {
      console.error('Failed to fetch trading pairs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 验证
    if (!formData.name.trim()) {
      toast.error('名称不能为空');
      return;
    }

    if (!formData.pairId) {
      toast.error('请选择交易对');
      return;
    }

    if (formData.floatValue === undefined || formData.floatValue === null) {
      toast.error('浮点值不能为空');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        pairId: parseInt(formData.pairId),
        floatValue: formData.floatValue,
      };

      const url = editBot
        ? `/api/admin/trading/bots/${editBot.id}`
        : '/api/admin/trading/bots';

      const method = editBot ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(editBot ? '调控机器人更新成功' : '调控机器人创建成功');
        onSuccess?.();
        onOpenChange(false);
      } else {
        toast.error(data.error || (editBot ? '更新失败' : '创建失败'));
      }
    } catch (error) {
      console.error('Failed to save bot:', error);
      toast.error(editBot ? '更新失败' : '创建失败');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>{editBot ? '编辑调控机器人' : '创建调控机器人'}</DialogTitle>
        </DialogHeader>

        {loading && !editBot ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 名称 */}
            <div className="space-y-2">
              <Label htmlFor="name">
                名称 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="请输入机器人名称"
                required
              />
            </div>

            {/* 交易对 */}
            <div className="space-y-2">
              <Label htmlFor="pairId">
                交易对 <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.pairId}
                onValueChange={(value) => setFormData({ ...formData, pairId: value })}
                disabled={!!editBot} // 编辑时不能修改交易对
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="请选择交易对" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  {pairs.map((pair) => (
                    <SelectItem key={pair.id} value={pair.id.toString()}>
                      {pair.symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editBot && (
                <p className="text-xs text-gray-400">编辑时不能修改交易对</p>
              )}
            </div>

            {/* 浮点值 */}
            <div className="space-y-2">
              <Label htmlFor="floatValue">
                浮点值 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="floatValue"
                type="number"
                step="0.00000001"
                value={formData.floatValue}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    floatValue: parseFloat(e.target.value) || 0,
                  })
                }
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="0.00000000"
                required
              />
              <p className="text-xs text-gray-400">
                数据源真实的实时价格 + 浮点值 = 调控后的行情实时价格
              </p>
            </div>

            <DialogFooter className="gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                className="border-slate-600 hover:bg-slate-700"
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {editBot ? '更新中...' : '创建中...'}
                  </>
                ) : (
                  editBot ? '更新' : '创建'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
