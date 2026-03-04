'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';

interface SymbolDetail {
  id: number;
  name: string;
  alias: string;
  type: string;
  sort: number;
  isVisible: boolean;
  flashContractFee: number;
  contractSize: number;
  min_order_size: number;
  max_order_size: number;
}

export default function SymbolEditPage() {
  const router = useRouter();
  const params = useParams();
  const symbolId = params.id as string;

  const [symbol, setSymbol] = useState<SymbolDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    isVisible: true,
    flashContractFee: 1.0,
    min_order_size: 0.001,
    max_order_size: 999999,
  });

  useEffect(() => {
    fetchSymbolDetail();
  }, [symbolId]);

  const fetchSymbolDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/trading/symbols/${symbolId}`);
      const data = await response.json();

      if (data.success) {
        setSymbol(data.symbol);
        setFormData({
          name: data.symbol.name,
          isVisible: data.symbol.isVisible,
          flashContractFee: data.symbol.flashContractFee,
          min_order_size: data.symbol.min_order_size,
          max_order_size: data.symbol.max_order_size,
        });
      } else {
        toast.error('获取品种详情失败');
        router.back();
      }
    } catch (error) {
      console.error('Failed to fetch symbol detail:', error);
      toast.error('获取品种详情失败');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/admin/trading/symbols/${symbolId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: formData.name,
          is_visible: formData.isVisible,
          contract_fee: formData.flashContractFee,
          min_order_size: formData.min_order_size,
          max_order_size: formData.max_order_size,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('品种更新成功');
        router.back();
      } else {
        toast.error(data.error || '品种更新失败');
      }
    } catch (error) {
      console.error('Failed to update symbol:', error);
      toast.error('品种更新失败');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!symbol) {
    return (
      <div className="flex items-center justify-center h-screen text-white">
        <div>品种不存在</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 面包屑导航 */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>资源</span>
        <span>/</span>
        <span>品种管理</span>
        <span>/</span>
        <span className="text-white">编辑品种</span>
      </div>

      {/* 页面标题和操作栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-white">编辑品种</h1>
        </div>
      </div>

      {/* 编辑表单 */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">品种信息</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 品种代码 */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-300">
                品种代码 <span className="text-red-400">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="如 BTCUSD"
                className="bg-slate-700 border-slate-600 text-white"
                required
              />
              <p className="text-xs text-gray-500">
                品种代码必须唯一，如 BTCUSD、EURUSD 等
              </p>
            </div>

            {/* 是否展示 */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isVisible"
                checked={formData.isVisible}
                onChange={(e) => setFormData({ ...formData, isVisible: e.target.checked })}
                className="rounded border-gray-500 bg-slate-700"
              />
              <Label htmlFor="isVisible" className="text-gray-300">
                展示在前端
              </Label>
            </div>

            {/* 秒合约手续费 */}
            <div className="space-y-2">
              <Label htmlFor="flashContractFee" className="text-gray-300">
                秒合约手续费 (%)
              </Label>
              <Input
                id="flashContractFee"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.flashContractFee}
                onChange={(e) =>
                  setFormData({ ...formData, flashContractFee: parseFloat(e.target.value) || 0 })
                }
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            {/* 最小订单量 */}
            <div className="space-y-2">
              <Label htmlFor="min_order_size" className="text-gray-300">
                最小订单量
              </Label>
              <Input
                id="min_order_size"
                type="number"
                step="0.000001"
                min="0"
                value={formData.min_order_size}
                onChange={(e) =>
                  setFormData({ ...formData, min_order_size: parseFloat(e.target.value) || 0 })
                }
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            {/* 最大订单量 */}
            <div className="space-y-2">
              <Label htmlFor="max_order_size" className="text-gray-300">
                最大订单量
              </Label>
              <Input
                id="max_order_size"
                type="number"
                step="1"
                min="0"
                value={formData.max_order_size}
                onChange={(e) =>
                  setFormData({ ...formData, max_order_size: parseFloat(e.target.value) || 0 })
                }
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            {/* 操作按钮 */}
            <div className="flex justify-end gap-3 pt-6 border-t border-slate-700">
              <Button
                type="button"
                variant="outline"
                className="border-slate-600 hover:bg-slate-700 text-white"
                onClick={() => router.back()}
              >
                取消
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={saving}
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? '保存中...' : '保存'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
