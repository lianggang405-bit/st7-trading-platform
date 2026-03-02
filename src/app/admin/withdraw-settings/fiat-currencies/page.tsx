'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RefreshCw, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import adminFetch from '@/lib/admin-fetch';

interface FiatCurrency {
  id: number;
  code: string;
  name: string;
  symbol: string;
  minAmount: number;
  maxAmount: number;
  fee: number;
  status: 'active' | 'inactive';
}

export default function FiatCurrenciesPage() {
  const [currencies, setCurrencies] = useState<FiatCurrency[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: 'USD',
    name: '美元',
    symbol: '$',
    minAmount: 100,
    maxAmount: 100000,
    fee: 10,
    status: 'active' as 'active' | 'inactive',
  });

  useEffect(() => {
    fetchCurrencies();
  }, []);

  const fetchCurrencies = async () => {
    setLoading(true);
    try {
      const response = await adminFetch('/api/admin/withdraw-settings/fiat-currencies');
      const data = await response.json();
      if (data.success) setCurrencies(data.currencies || []);
    } catch (error) {
      console.error('Failed to fetch fiat currencies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const response = await adminFetch('/api/admin/withdraw-settings/fiat-currencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        toast.success('法币配置保存成功');
        fetchCurrencies();
      }
    } catch (error) {
      toast.error('保存失败');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>桌面</span> / <span>提币设置</span> / <span className="text-white">支持法币设置</span>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-white">支持法币设置</h1>
        <p className="text-gray-400 mt-1">配置提币支持的法币及手续费</p>
      </div>
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">添加法币配置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300">币种代码</Label>
                <Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className="bg-slate-700 border-slate-600 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">符号</Label>
                <Input value={formData.symbol} onChange={(e) => setFormData({ ...formData, symbol: e.target.value })} className="bg-slate-700 border-slate-600 text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">币种名称</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="bg-slate-700 border-slate-600 text-white" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300">最小金额</Label>
                <Input type="number" value={formData.minAmount} onChange={(e) => setFormData({ ...formData, minAmount: parseFloat(e.target.value) })} className="bg-slate-700 border-slate-600 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">最大金额</Label>
                <Input type="number" value={formData.maxAmount} onChange={(e) => setFormData({ ...formData, maxAmount: parseFloat(e.target.value) })} className="bg-slate-700 border-slate-600 text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">手续费</Label>
              <Input type="number" value={formData.fee} onChange={(e) => setFormData({ ...formData, fee: parseFloat(e.target.value) })} className="bg-slate-700 border-slate-600 text-white" />
            </div>
            <Button onClick={handleSave} className="w-full">保存配置</Button>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-white">法币列表</CardTitle>
              <CardDescription className="text-gray-400">共 {currencies.length} 个法币</CardDescription>
            </div>
            <Button variant="outline" size="icon" onClick={fetchCurrencies} className="border-slate-600 hover:bg-slate-700">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </CardHeader>
          <CardContent>
            {currencies.map((c) => (
              <div key={c.id} className="p-3 bg-slate-700/50 rounded-lg mb-2 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  <span className="text-white">{c.code} - {c.name}</span>
                </div>
                <div className="text-right text-sm">
                  <div className="text-gray-400">{c.minAmount}-{c.maxAmount}</div>
                  <div className="text-gray-500">手续费: {c.fee}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
