'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RefreshCw, Save } from 'lucide-react';
import { toast } from 'sonner';
import adminFetch from '@/lib/admin-fetch';

interface WireInfo {
  bankName: string;
  bankAddress: string;
  accountName: string;
  accountNumber: string;
  swiftCode: string;
  iban: string;
  routingNumber: string;
}

export default function WireInfoPage() {
  const [info, setInfo] = useState<WireInfo>({
    bankName: '',
    bankAddress: '',
    accountName: '',
    accountNumber: '',
    swiftCode: '',
    iban: '',
    routingNumber: '',
  });
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    fetchInfo();
  }, []);

  const fetchInfo = async () => {
    setLoading(true);
    try {
      const response = await adminFetch('/api/admin/deposit-settings/wire-info');
      const data = await response.json();
      if (data.success && data.info) {
        setInfo(data.info);
      }
    } catch (error) {
      console.error('Failed to fetch wire info:', error);
      toast.error('获取电汇信息失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaveLoading(true);
    try {
      const response = await adminFetch('/api/admin/deposit-settings/wire-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(info),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('电汇信息保存成功');
      } else {
        toast.error(data.error || '保存失败');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('保存失败，请稍后重试');
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 面包屑 */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-400">桌面</span>
        <span className="text-gray-600">/</span>
        <span className="text-gray-400">充币设置</span>
        <span className="text-gray-600">/</span>
        <span className="text-white">电汇信息设置</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-white">电汇信息设置</h1>
        <p className="text-gray-400 mt-1">配置电汇充币的收款账户信息</p>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">电汇收款账户信息</CardTitle>
          <CardDescription className="text-gray-400">
            请填写正确的电汇收款账户信息，用户将根据此信息进行电汇充币
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-gray-300">银行名称</Label>
              <Input
                value={info.bankName}
                onChange={(e) => setInfo({ ...info, bankName: e.target.value })}
                placeholder="请输入银行名称"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">银行地址</Label>
              <Input
                value={info.bankAddress}
                onChange={(e) => setInfo({ ...info, bankAddress: e.target.value })}
                placeholder="请输入银行地址"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">账户名称</Label>
              <Input
                value={info.accountName}
                onChange={(e) => setInfo({ ...info, accountName: e.target.value })}
                placeholder="请输入收款账户名称"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">账户号码</Label>
              <Input
                value={info.accountNumber}
                onChange={(e) => setInfo({ ...info, accountNumber: e.target.value })}
                placeholder="请输入收款账户号码"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300">SWIFT 代码</Label>
                <Input
                  value={info.swiftCode}
                  onChange={(e) => setInfo({ ...info, swiftCode: e.target.value })}
                  placeholder="请输入 SWIFT 代码"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">IBAN</Label>
                <Input
                  value={info.iban}
                  onChange={(e) => setInfo({ ...info, iban: e.target.value })}
                  placeholder="请输入 IBAN（欧洲账户）"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">路由号码（Routing Number，美国账户）</Label>
              <Input
                value={info.routingNumber}
                onChange={(e) => setInfo({ ...info, routingNumber: e.target.value })}
                placeholder="请输入路由号码"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>
          <div className="flex gap-4 mt-6">
            <Button
              onClick={fetchInfo}
              variant="outline"
              className="border-slate-600 hover:bg-slate-700"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </Button>
            <Button onClick={handleSave} disabled={saveLoading}>
              <Save className="w-4 h-4 mr-2" />
              {saveLoading ? '保存中...' : '保存信息'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
