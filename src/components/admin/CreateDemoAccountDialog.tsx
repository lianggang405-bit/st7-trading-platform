'use client';

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
import { useState } from 'react';
import { toast } from 'sonner';

interface CreateDemoAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function CreateDemoAccountDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateDemoAccountDialogProps) {
  const [formData, setFormData] = useState({
    status: '',
    password: '',
    registeredAt: '',
    lastLoginAt: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    // 验证必填字段
    if (!formData.password.trim()) {
      toast.error('密码为必填项');
      return;
    }

    // 如果未选择状态，默认为正常
    const statusToSubmit = formData.status || 'normal';

    setLoading(true);
    try {
      const response = await fetch('/api/admin/users/demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: statusToSubmit,
          password: formData.password,
          registeredAt: formData.registeredAt || new Date().toISOString(),
          lastLoginAt: formData.lastLoginAt || null,
        }),
      });

      // 检查响应类型
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('API returned non-JSON response:', response.status, response.statusText);
        toast.error('服务器错误：API 配置异常，请联系管理员');
        return;
      }

      const data = await response.json();
      if (data.success) {
        toast.success('模拟账户创建成功');
        // 重置表单
        setFormData({
          status: '',
          password: '',
          registeredAt: '',
          lastLoginAt: '',
        });
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(data.error || '模拟账户创建失败');
      }
    } catch (error) {
      console.error('Failed to create demo account:', error);
      if (error instanceof SyntaxError) {
        toast.error('服务器错误：API 响应格式异常');
      } else {
        toast.error('模拟账户创建失败');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      status: '',
      password: '',
      registeredAt: '',
      lastLoginAt: '',
    });
    onOpenChange(false);
  };

  const formatDateTime = (dateTime: string) => {
    if (!dateTime) return '';
    return new Date(dateTime).toISOString().slice(0, 16);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">创建 模拟账户</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* 邮箱提示 - 自动生成 */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right text-gray-400">
              邮箱
            </Label>
            <div className="col-span-3">
              <div className="bg-slate-700/50 border border-slate-600 rounded-md px-4 py-3 text-gray-400 text-sm">
                <span className="text-yellow-400 mr-2">ℹ️</span>
                模拟账户邮箱将自动生成，无需手动输入
              </div>
            </div>
          </div>

          {/* 状态 */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              状态
            </Label>
            <div className="col-span-3">
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="选择一个选项" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600 text-white">
                  <SelectItem value="normal">正常</SelectItem>
                  <SelectItem value="disabled">禁用</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 密码 */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password" className="text-right">
              密码 <span className="text-red-500">*</span>
            </Label>
            <div className="col-span-3">
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="密码"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>

          {/* 注册时间 */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="registeredAt" className="text-right">
              注册时间
            </Label>
            <div className="col-span-3">
              <Input
                id="registeredAt"
                type="datetime-local"
                value={formData.registeredAt}
                onChange={(e) => setFormData({ ...formData, registeredAt: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white [color-scheme:dark]"
              />
            </div>
          </div>

          {/* 最后登录时间 */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="lastLoginAt" className="text-right">
              最后登陆时间
            </Label>
            <div className="col-span-3">
              <Input
                id="lastLoginAt"
                type="datetime-local"
                value={formData.lastLoginAt}
                onChange={(e) => setFormData({ ...formData, lastLoginAt: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white [color-scheme:dark]"
              />
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
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? '创建中...' : '确认'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
