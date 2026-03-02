'use client';

import { useState, useEffect } from 'react';
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
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface DemoAccount {
  id: string;
  email: string;
  status: string;
  createdAt: string;
  lastLoginAt: string;
}

interface EditDemoAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: string;
  onSuccess?: () => void;
}

export default function EditDemoAccountDialog({
  open,
  onOpenChange,
  accountId,
  onSuccess,
}: EditDemoAccountDialogProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [accountDetails, setAccountDetails] = useState<{
    createdAt: string;
    lastLoginAt: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    status: '正常',
    password: '',
  });

  // 获取账户详情
  useEffect(() => {
    if (open && accountId) {
      fetchAccountDetails();
    }
  }, [open, accountId]);

  const fetchAccountDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users/demo/${accountId}`);

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        toast.error('服务器错误：API 配置异常');
        return;
      }

      const data = await response.json();

      if (data.success && data.account) {
        setFormData({
          email: data.account.email || '',
          status: data.account.status === 'normal' ? '正常' : data.account.status === 'disabled' ? '禁用' : '冻结',
          password: '',
        });
        setAccountDetails({
          createdAt: data.account.createdAt || '',
          lastLoginAt: data.account.lastLoginAt || '',
        });
      } else {
        toast.error(data.error || '获取账户信息失败');
      }
    } catch (error) {
      console.error('Failed to fetch account details:', error);
      toast.error('获取账户信息失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 验证
    if (!formData.email.trim()) {
      toast.error('邮箱不能为空');
      return;
    }

    if (!formData.email.includes('@')) {
      toast.error('邮箱格式不正确');
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        email: formData.email,
        status: formData.status,
      };

      // 如果密码不为空，则更新密码
      if (formData.password.trim()) {
        payload.password = formData.password;
      }

      const response = await fetch(`/api/admin/users/demo/${accountId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('模拟账户更新成功');
        onSuccess?.();
        onOpenChange(false);
        // 清空密码
        setFormData((prev) => ({ ...prev, password: '' }));
      } else {
        toast.error(data.error || '更新失败');
      }
    } catch (error) {
      console.error('Failed to update account:', error);
      toast.error('更新失败');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    // 清空密码
    setFormData((prev) => ({ ...prev, password: '' }));
  };

  const handleDialogChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      // 关闭对话框时清空密码
      setFormData((prev) => ({ ...prev, password: '' }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>更新 模拟账户:{accountId}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 邮箱 */}
            <div className="space-y-2">
              <Label htmlFor="email">
                邮箱 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="请输入邮箱"
                required
              />
            </div>

            {/* 状态 */}
            <div className="space-y-2">
              <Label htmlFor="status">状态</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="正常">正常</SelectItem>
                  <SelectItem value="禁用">禁用</SelectItem>
                  <SelectItem value="冻结">冻结</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 密码 */}
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="密码"
              />
              <p className="text-xs text-gray-400">留空则不修改密码</p>
            </div>

            {/* 注册时间（只读） */}
            <div className="space-y-2">
              <Label htmlFor="createdAt">注册时间</Label>
              <Input
                id="createdAt"
                value={accountDetails?.createdAt || ''}
                className="bg-slate-700/50 border-slate-600 text-gray-400"
                disabled
                readOnly
              />
            </div>

            {/* 最后登录时间（只读） */}
            <div className="space-y-2">
              <Label htmlFor="lastLoginAt">最后登陆时间</Label>
              <Input
                id="lastLoginAt"
                value={accountDetails?.lastLoginAt || ''}
                className="bg-slate-700/50 border-slate-600 text-gray-400"
                disabled
                readOnly
              />
            </div>

            <DialogFooter className="gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                className="border-slate-600 hover:bg-slate-700"
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    保存中...
                  </>
                ) : (
                  '保存'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
