'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { useState } from 'react';
import { toast } from 'sonner';

interface RechargeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: number;
  userName?: string;
  onSuccess?: () => void;
}

export default function RechargeDialog({
  open,
  onOpenChange,
  userId,
  userName,
  onSuccess,
}: RechargeDialogProps) {
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!amount || !type) {
      toast.error('请填写完整信息');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('请输入有效的充值数量');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/users/recharge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          amount: amountNum,
          type,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('充值成功');
        setAmount('');
        setType('');
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(data.error || '充值失败');
      }
    } catch (error) {
      console.error('Failed to recharge:', error);
      toast.error('充值失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setAmount('');
    setType('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-white">充值</DialogTitle>
          <DialogDescription className="text-gray-400">
            你确定要执行此操作吗？
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right text-gray-300">
              数量
            </Label>
            <div className="col-span-3">
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="数量"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right text-gray-300">
              类型
            </Label>
            <div className="col-span-3">
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="选择一个选项" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600 text-white">
                  <SelectItem value="充值">充值</SelectItem>
                  <SelectItem value="彩金">彩金</SelectItem>
                  <SelectItem value="提现">提现</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
            className="border-slate-600 text-gray-300 hover:bg-slate-700 hover:text-white"
          >
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-slate-700 hover:bg-slate-600 text-white"
          >
            {loading ? '处理中...' : '运行操作'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
