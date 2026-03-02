'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';

interface AdjustDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pair: {
    id: number;
    symbol: string;
    hasBot: boolean;
    botId: number | null;
    floatValue: number;
    isBotActive: boolean;
  } | null;
  onSuccess: () => void;
}

export function AdjustDialog({
  open,
  onOpenChange,
  pair,
  onSuccess,
}: AdjustDialogProps) {
  const [isActive, setIsActive] = useState(false);
  const [floatValue, setFloatValue] = useState('0');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // 当打开对话框时，初始化数据
  useEffect(() => {
    if (pair) {
      setIsActive(pair.isBotActive);
      setFloatValue(pair.floatValue?.toString() || '0');
      setError('');
    }
  }, [pair, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pair) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/trading/adjust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pairId: pair.id,
          floatValue: parseFloat(floatValue) || 0,
          isActive,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || '操作失败');
        setIsLoading(false);
        return;
      }

      // 成功后关闭对话框并刷新列表
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError('操作失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>调控设置</DialogTitle>
          <DialogDescription>
            设置交易对 {pair?.symbol} 的调控参数
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="isActive" className="text-base">
                启用调控
              </Label>
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="floatValue">浮点值</Label>
              <Input
                id="floatValue"
                type="number"
                step="0.00000001"
                value={floatValue}
                onChange={(e) => setFloatValue(e.target.value)}
                placeholder="0.00000000"
                disabled={!isActive}
              />
              <p className="text-xs text-muted-foreground">
                数据源真实的实时价格 + 浮点值 = 调控后的行情实时价格
              </p>
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              保存
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
