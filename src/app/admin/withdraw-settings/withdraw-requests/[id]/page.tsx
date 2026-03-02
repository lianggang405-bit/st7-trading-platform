'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  RefreshCw,
  Save,
  Trash2,
  DollarSign,
  MapPin,
  User,
  Hash,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import adminFetch from '@/lib/admin-fetch';

interface WithdrawalRequest {
  id: number;
  account: string;
  currency: string;
  withdrawal_address: string;
  withdrawal_amount: number;
  fee: number;
  actual_amount: number;
  status: 'PENDING' | 'SUCCESS' | 'FAIL';
  reject_reason?: string;
  created_at: string;
  updated_at: string;
}

export default function WithdrawRequestEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [request, setRequest] = useState<WithdrawalRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    account: '',
    currency: '',
    withdrawal_address: '',
    withdrawal_amount: '',
    fee: '',
    actual_amount: '',
    status: 'PENDING' as 'PENDING' | 'SUCCESS' | 'FAIL',
    reject_reason: '',
  });

  useEffect(() => {
    fetchRequest();
  }, [id]);

  useEffect(() => {
    if (request) {
      setFormData({
        account: request.account,
        currency: request.currency,
        withdrawal_address: request.withdrawal_address,
        withdrawal_amount: request.withdrawal_amount.toString(),
        fee: request.fee.toString(),
        actual_amount: request.actual_amount.toString(),
        status: request.status,
        reject_reason: request.reject_reason || '',
      });
    }
  }, [request]);

  const fetchRequest = async () => {
    setLoading(true);
    try {
      const response = await adminFetch(`/api/admin/wallet/withdrawal-requests/${id}`);
      const data = await response.json();
      if (response.ok) {
        setRequest(data.data);
      } else {
        toast.error(data.error || '获取提币申请失败');
      }
    } catch (error) {
      console.error('Failed to fetch withdrawal request:', error);
      toast.error('获取提币申请失败');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // 自动计算到账数量
    if (field === 'withdrawal_amount' || field === 'fee') {
      const withdrawalAmount = parseFloat(field === 'withdrawal_amount' ? value : formData.withdrawal_amount) || 0;
      const fee = parseFloat(field === 'fee' ? value : formData.fee) || 0;
      const actualAmount = Math.max(0, withdrawalAmount - fee);
      setFormData(prev => ({
        ...prev,
        actual_amount: actualAmount.toString(),
      }));
    }
  };

  const handleSave = async () => {
    if (!formData.account.trim()) {
      toast.error('请输入账号');
      return;
    }
    if (!formData.currency.trim()) {
      toast.error('请输入品种');
      return;
    }
    if (!formData.withdrawal_address.trim()) {
      toast.error('请输入提币地址');
      return;
    }
    const withdrawalAmount = parseFloat(formData.withdrawal_amount);
    if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
      toast.error('请输入有效的提币数量');
      return;
    }
    const fee = parseFloat(formData.fee);
    if (isNaN(fee) || fee < 0) {
      toast.error('请输入有效的手续费');
      return;
    }

    setSaving(true);
    try {
      const response = await adminFetch(`/api/admin/wallet/withdrawal-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account: formData.account.trim(),
          currency: formData.currency.trim(),
          withdrawal_address: formData.withdrawal_address.trim(),
          withdrawal_amount: withdrawalAmount,
          fee: fee,
          actual_amount: parseFloat(formData.actual_amount),
          status: formData.status,
          reject_reason: formData.status === 'FAIL' ? formData.reject_reason.trim() : null,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success('保存成功');
        fetchRequest();
      } else {
        toast.error(data.error || '保存失败');
      }
    } catch (error) {
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('确认删除该申请？')) return;
    try {
      const response = await adminFetch(`/api/admin/wallet/withdrawal-requests/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (response.ok) {
        toast.success('申请已删除');
        router.push('/admin/withdraw-settings/withdraw-requests');
      } else {
        toast.error(data.error || '删除失败');
      }
    } catch (error) {
      toast.error('删除失败');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center text-gray-400 p-8">
        未找到提币申请记录
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 面包屑导航 */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>资源</span> / <span>提币申请</span> / <span>编辑</span>
      </div>

      {/* 顶部操作栏 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">编辑提币申请</h1>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/withdraw-settings/withdraw-requests')}
            className="border-slate-600 hover:bg-slate-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回列表
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/withdraw-settings/withdraw-requests/${id}/view`)}
            className="border-slate-600 hover:bg-slate-700"
          >
            <Hash className="w-4 h-4 mr-2" />
            查看详情
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? '保存中...' : '保存'}
          </Button>
          <Button
            variant="outline"
            onClick={handleDelete}
            className="border-red-600 text-red-400 hover:bg-red-600/20"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            删除
          </Button>
        </div>
      </div>

      {/* 编辑表单 */}
      <div className="grid gap-4">
        {/* 基本信息 */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Hash className="w-5 h-5" />
              基本信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-400 flex items-center gap-1">
                  <Hash className="w-4 h-4" />
                  申请ID
                </Label>
                <Input
                  value={request.id}
                  disabled
                  className="bg-slate-900 border-slate-600 text-white font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-400">状态</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleChange('status', value)}
                >
                  <SelectTrigger className="bg-slate-900 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="PENDING">申请中</SelectItem>
                    <SelectItem value="SUCCESS">成功</SelectItem>
                    <SelectItem value="FAIL">失败</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-400 flex items-center gap-1">
                  <User className="w-4 h-4" />
                  账号
                </Label>
                <Input
                  value={formData.account}
                  onChange={(e) => handleChange('account', e.target.value)}
                  placeholder="请输入账号"
                  className="bg-slate-900 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-400 flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  品种
                </Label>
                <Input
                  value={formData.currency}
                  onChange={(e) => handleChange('currency', e.target.value)}
                  placeholder="请输入品种，如 USDT"
                  className="bg-slate-900 border-slate-600 text-white"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 提币信息 */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              提币信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-400">提币地址</Label>
              <Input
                value={formData.withdrawal_address}
                onChange={(e) => handleChange('withdrawal_address', e.target.value)}
                placeholder="请输入提币地址"
                className="bg-slate-900 border-slate-600 text-white font-mono"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-400">提币数量</Label>
                <Input
                  type="number"
                  step="0.00000001"
                  value={formData.withdrawal_amount}
                  onChange={(e) => handleChange('withdrawal_amount', e.target.value)}
                  placeholder="0.00000000"
                  className="bg-slate-900 border-slate-600 text-white font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-400">手续费</Label>
                <Input
                  type="number"
                  step="0.00000001"
                  value={formData.fee}
                  onChange={(e) => handleChange('fee', e.target.value)}
                  placeholder="0.00000000"
                  className="bg-slate-900 border-slate-600 text-white font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-400">到账数量</Label>
                <Input
                  type="number"
                  step="0.00000001"
                  value={formData.actual_amount}
                  onChange={(e) => handleChange('actual_amount', e.target.value)}
                  placeholder="自动计算"
                  className="bg-slate-900 border-slate-600 text-white font-mono"
                />
              </div>
            </div>
            <div className="flex items-start gap-2 text-sm text-gray-400">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <p>到账数量将自动计算为：提币数量 - 手续费</p>
            </div>
          </CardContent>
        </Card>

        {/* 拒绝原因 */}
        {formData.status === 'FAIL' && (
          <Card className="bg-slate-800 border-slate-700 border-red-600/50">
            <CardHeader>
              <CardTitle className="text-red-400 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                拒绝原因
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Textarea
                value={formData.reject_reason}
                onChange={(e) => handleChange('reject_reason', e.target.value)}
                placeholder="请输入拒绝原因"
                rows={4}
                className="bg-slate-900 border-slate-600 text-white"
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
