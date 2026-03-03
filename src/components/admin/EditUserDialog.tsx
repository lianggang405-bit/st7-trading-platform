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
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface User {
  id: number;
  email: string;
  parent: string;
  inviteCode: string;
  userType: string;
  userLevel: string;
  status: string;
  balance: number;
  remark: string;
  createdAt: string;
  lastLoginAt: string;
  username?: string;
}

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onSuccess?: () => void;
}

export default function EditUserDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}: EditUserDialogProps) {
  const [formData, setFormData] = useState({
    email: '',
    inviteCode: '',
    status: '正常',
    balance: '',
    password: '',
    remark: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        inviteCode: user.inviteCode,
        status: user.status || '正常',
        balance: user.balance.toString(),
        password: '',
        remark: user.remark === '—' ? '' : user.remark,
      });
    }
  }, [user]);

  const handleSubmit = async () => {
    if (!formData.email) {
      toast.error('邮箱为必填项');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${user?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          inviteCode: formData.inviteCode,
          status: formData.status,
          balance: parseFloat(formData.balance) || 0,
          password: formData.password || undefined,
          remark: formData.remark,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('用户更新成功');
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(data.error || '用户更新失败');
      }
    } catch (error) {
      console.error('Failed to update user:', error);
      toast.error('用户更新失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        email: user.email,
        inviteCode: user.inviteCode,
        status: user.status === '正常' ? '正常' : user.status === '禁用' ? '禁用' : '冻结',
        balance: user.balance.toString(),
        password: '',
        remark: user.remark === '—' ? '' : user.remark,
      });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">更新 用户列表</DialogTitle>
          <DialogDescription className="text-gray-400">
            修改用户信息
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              邮箱 <span className="text-red-500">*</span>
            </Label>
            <div className="col-span-3">
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="parent" className="text-right text-gray-400">
              上级
            </Label>
            <div className="col-span-3">
              <Input
                id="parent"
                value={user?.parent || '无'}
                disabled
                className="bg-slate-900/50 border-slate-700 text-gray-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="inviteCode" className="text-right text-gray-300">
              邀请码
            </Label>
            <div className="col-span-3">
              <Input
                id="inviteCode"
                value={formData.inviteCode}
                onChange={(e) => setFormData({ ...formData, inviteCode: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="userType" className="text-right text-gray-400">
              用户类型
            </Label>
            <div className="col-span-3">
              <Input
                id="userType"
                value={user?.userType || ''}
                disabled
                className="bg-slate-900/50 border-slate-700 text-gray-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="userLevel" className="text-right text-gray-400">
              用户等级
            </Label>
            <div className="col-span-3">
              <Input
                id="userLevel"
                value={user?.userLevel || ''}
                disabled
                className="bg-slate-900/50 border-slate-700 text-gray-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right text-gray-300">
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
                  <SelectItem value="正常">正常</SelectItem>
                  <SelectItem value="禁用">禁用</SelectItem>
                  <SelectItem value="冻结">冻结</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="balance" className="text-right text-gray-300">
              余额
            </Label>
            <div className="col-span-3">
              <Input
                id="balance"
                type="number"
                step="0.01"
                value={formData.balance}
                onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password" className="text-right text-gray-300">
              密码
            </Label>
            <div className="col-span-3">
              <Input
                id="password"
                type="password"
                placeholder="密码"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="remark" className="text-right text-gray-300">
              备注
            </Label>
            <div className="col-span-3">
              <Input
                id="remark"
                placeholder="备注"
                value={formData.remark}
                onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="createdAt" className="text-right text-gray-400">
              注册时间
            </Label>
            <div className="col-span-3">
              <Input
                id="createdAt"
                value={user?.createdAt || ''}
                disabled
                className="bg-slate-900/50 border-slate-700 text-gray-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="lastLoginAt" className="text-right text-gray-400">
              最后登录时间
            </Label>
            <div className="col-span-3">
              <Input
                id="lastLoginAt"
                value={user?.lastLoginAt || ''}
                disabled
                className="bg-slate-900/50 border-slate-700 text-gray-500"
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
            className="bg-slate-700 hover:bg-slate-600 text-white"
          >
            {loading ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
