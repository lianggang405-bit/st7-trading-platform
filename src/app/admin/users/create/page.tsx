'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
import { ArrowLeft, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function CreateUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    inviteCode: '',
    status: 'active',
    balance: '',
    password: '',
    remark: '',
    createdAt: new Date().toISOString().slice(0, 19),
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 验证必填字段
    if (!formData.email || !formData.password) {
      toast.error('请填写所有必填字段（邮箱、密码）');
      return;
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('请输入有效的邮箱地址');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/users/list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('用户创建成功');
        router.push('/admin/users/list');
      } else {
        toast.error(data.error || '创建用户失败');
      }
    } catch (error) {
      console.error('Failed to create user:', error);
      toast.error('创建用户失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题和面包屑 */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <span>资源</span>
          <span>/</span>
          <span>用户列表</span>
          <span>/</span>
          <span className="text-gray-900 font-medium">创建用户列表</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">创建 用户列表</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 表单字段 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 邮箱 */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-1">
                  邮箱 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="邮箱"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>

              {/* 上级 */}
              <div className="space-y-2">
                <Label htmlFor="parent">上级</Label>
                <Input
                  id="parent"
                  type="text"
                  value="无"
                  disabled
                  className="bg-gray-50"
                />
              </div>

              {/* 邀请码 */}
              <div className="space-y-2">
                <Label htmlFor="inviteCode">邀请码</Label>
                <Input
                  id="inviteCode"
                  type="text"
                  placeholder="邀请码"
                  value={formData.inviteCode}
                  onChange={(e) => handleInputChange('inviteCode', e.target.value)}
                />
              </div>

              {/* 用户类型 */}
              <div className="space-y-2">
                <Label htmlFor="userType">用户类型</Label>
                <Input
                  id="userType"
                  type="text"
                  value="普通用户"
                  disabled
                  className="bg-gray-50"
                />
              </div>

              {/* 用户等级 */}
              <div className="space-y-2">
                <Label htmlFor="userLevel">用户等级</Label>
                <Input
                  id="userLevel"
                  type="text"
                  value="普通会员"
                  disabled
                  className="bg-gray-50"
                />
              </div>

              {/* 状态 */}
              <div className="space-y-2">
                <Label htmlFor="status">状态</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择一个选项" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">正常</SelectItem>
                    <SelectItem value="inactive">禁用</SelectItem>
                    <SelectItem value="suspended">暂停</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 余额 */}
              <div className="space-y-2">
                <Label htmlFor="balance">余额</Label>
                <Input
                  id="balance"
                  type="number"
                  placeholder="余额"
                  value={formData.balance}
                  onChange={(e) => handleInputChange('balance', e.target.value)}
                  step="0.01"
                  min="0"
                />
              </div>

              {/* 密码 */}
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-1">
                  密码 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="密码"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              {/* 备注 */}
              <div className="space-y-2">
                <Label htmlFor="remark">备注</Label>
                <Input
                  id="remark"
                  type="text"
                  placeholder="备注"
                  value={formData.remark}
                  onChange={(e) => handleInputChange('remark', e.target.value)}
                />
              </div>

              {/* 注册时间 */}
              <div className="space-y-2">
                <Label htmlFor="createdAt">注册时间</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="createdAt"
                    type="datetime-local"
                    value={formData.createdAt}
                    onChange={(e) => handleInputChange('createdAt', e.target.value)}
                    step="1"
                  />
                  <span className="text-xs text-gray-500 whitespace-nowrap">Europe/London</span>
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center justify-end gap-4 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/users/list')}
                disabled={loading}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回
              </Button>
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? '创建中...' : '创建'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
