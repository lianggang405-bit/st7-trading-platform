'use client';

import { useState, useEffect } from 'react';
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
  currencyId: number;
  isVisible: boolean;
  minOrderSize: number;
  maxOrderSize: number;
  contractFee: number;
}

interface AddPairDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddPairDialog({ open, onOpenChange, onSuccess }: AddPairDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    symbol: '',
    currencyId: 1,
    isVisible: true,
    minOrderSize: '0.001',
    maxOrderSize: '100',
    contractFee: '0.1',
  });

  const handleAddPair = async () => {
    // 验证表单
    if (!formData.symbol) {
      toast.error('请输入交易对符号');
      return;
    }

    if (!formData.symbol.match(/^[A-Z]+\/[A-Z]+$/)) {
      toast.error('交易对格式错误，应为 BASE/QUOTE (如 BTC/USDT)');
      return;
    }

    const minOrderSize = parseFloat(formData.minOrderSize);
    const maxOrderSize = parseFloat(formData.maxOrderSize);
    const contractFee = parseFloat(formData.contractFee);

    if (isNaN(minOrderSize) || minOrderSize <= 0) {
      toast.error('请输入有效的最小订单量');
      return;
    }

    if (isNaN(maxOrderSize) || maxOrderSize <= 0) {
      toast.error('请输入有效的最大订单量');
      return;
    }

    if (minOrderSize >= maxOrderSize) {
      toast.error('最大订单量必须大于最小订单量');
      return;
    }

    if (isNaN(contractFee) || contractFee < 0 || contractFee > 100) {
      toast.error('请输入有效的手续费 (0-100)');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/trading/pairs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol: formData.symbol.toUpperCase(),
          currency_id: formData.currencyId,
          is_visible: formData.isVisible,
          min_order_size: minOrderSize,
          max_order_size: maxOrderSize,
          contract_fee: contractFee,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('交易对添加成功');
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(data.error || '添加失败');
      }
    } catch (error) {
      console.error('Failed to add trading pair:', error);
      toast.error('添加失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      symbol: '',
      currencyId: 1,
      isVisible: true,
      minOrderSize: '0.001',
      maxOrderSize: '100',
      contractFee: '0.1',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle>新增交易对</DialogTitle>
          <DialogDescription className="text-gray-400">
            添加新的交易对到数据库
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="symbol">交易对符号 *</Label>
            <Input
              id="symbol"
              placeholder="BTC/USDT"
              value={formData.symbol}
              onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
              className="bg-slate-700 border-slate-600 text-white"
            />
            <p className="text-xs text-gray-400">格式: BASE/QUOTE (如 BTC/USDT)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currencyId">货币 ID</Label>
            <Select
              value={formData.currencyId.toString()}
              onValueChange={(value) => setFormData({ ...formData, currencyId: parseInt(value) })}
            >
              <SelectTrigger id="currencyId" className="bg-slate-700 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="1">1 - BTC</SelectItem>
                <SelectItem value="2">2 - ETH</SelectItem>
                <SelectItem value="3">3 - Gold (USD)</SelectItem>
                <SelectItem value="4">4 - Gold (USDT)</SelectItem>
                <SelectItem value="5">5 - BNB</SelectItem>
                <SelectItem value="6">6 - SOL</SelectItem>
                <SelectItem value="7">7 - DOGE</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minOrderSize">最小订单量 *</Label>
              <Input
                id="minOrderSize"
                type="number"
                step="any"
                value={formData.minOrderSize}
                onChange={(e) => setFormData({ ...formData, minOrderSize: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxOrderSize">最大订单量 *</Label>
              <Input
                id="maxOrderSize"
                type="number"
                step="any"
                value={formData.maxOrderSize}
                onChange={(e) => setFormData({ ...formData, maxOrderSize: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contractFee">手续费 (%) *</Label>
            <Input
              id="contractFee"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={formData.contractFee}
              onChange={(e) => setFormData({ ...formData, contractFee: e.target.value })}
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isVisible"
              checked={formData.isVisible}
              onChange={(e) => setFormData({ ...formData, isVisible: e.target.checked })}
              className="w-4 h-4"
            />
            <Label htmlFor="isVisible" className="text-gray-300">
              启用此交易对
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleReset}
            className="border-slate-600 hover:bg-slate-700"
          >
            重置
          </Button>
          <Button
            onClick={handleAddPair}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                添加中...
              </>
            ) : (
              '添加'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
