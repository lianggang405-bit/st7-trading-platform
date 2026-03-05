'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface FlashOrder {
  id: number;
  account: string;
  symbol: string;
  type: string;
  status: string;
  quantity: number;
  fee: number;
  result: string;
  profit: number;
  openPrice: number;
  closePrice: number;
  createdAt: string;
}

interface FlashOrderEditDialogProps {
  open: boolean;
  onClose: () => void;
  order: FlashOrder | null;
  onSave: () => void;
}

export function FlashOrderEditDialog({ open, onClose, order, onSave }: FlashOrderEditDialogProps) {
  const [formData, setFormData] = useState<Partial<FlashOrder>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (order) {
      setFormData(order);
    }
  }, [order]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/contract/flash-orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('更新成功');
        onClose();
        onSave();
      } else {
        toast.error(data.error || '更新失败');
      }
    } catch (error) {
      console.error('Failed to update flash order:', error);
      toast.error('更新失败');
    } finally {
      setLoading(false);
    }
  };

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">编辑秒合约订单</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="account">账户</Label>
              <Input
                id="account"
                value={formData.account || ''}
                onChange={(e) => setFormData({ ...formData, account: e.target.value })}
                className="bg-slate-700 border-slate-600"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="symbol">交易品种</Label>
              <Input
                id="symbol"
                value={formData.symbol || ''}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                className="bg-slate-700 border-slate-600"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">方向</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="涨">涨</SelectItem>
                  <SelectItem value="跌">跌</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">状态</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="已平仓">已平仓</SelectItem>
                  <SelectItem value="进行中">进行中</SelectItem>
                  <SelectItem value="已取消">已取消</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">数量</Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                value={formData.quantity || 0}
                onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
                className="bg-slate-700 border-slate-600"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="openPrice">开仓价格</Label>
              <Input
                id="openPrice"
                type="number"
                step="0.00000001"
                value={formData.openPrice || 0}
                onChange={(e) => setFormData({ ...formData, openPrice: parseFloat(e.target.value) })}
                className="bg-slate-700 border-slate-600"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="closePrice">平仓价格</Label>
              <Input
                id="closePrice"
                type="number"
                step="0.00000001"
                value={formData.closePrice || 0}
                onChange={(e) => setFormData({ ...formData, closePrice: parseFloat(e.target.value) })}
                className="bg-slate-700 border-slate-600"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fee">手续费</Label>
              <Input
                id="fee"
                type="number"
                step="0.00000001"
                value={formData.fee || 0}
                onChange={(e) => setFormData({ ...formData, fee: parseFloat(e.target.value) })}
                className="bg-slate-700 border-slate-600"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="result">结果</Label>
              <Select
                value={formData.result}
                onValueChange={(value) => setFormData({ ...formData, result: value })}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="盈利">盈利</SelectItem>
                  <SelectItem value="亏损">亏损</SelectItem>
                  <SelectItem value="无">无</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profit">盈亏</Label>
              <Input
                id="profit"
                type="number"
                step="0.00000001"
                value={formData.profit || 0}
                onChange={(e) => setFormData({ ...formData, profit: parseFloat(e.target.value) })}
                className="bg-slate-700 border-slate-600"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
