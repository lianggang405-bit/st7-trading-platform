'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreVertical,
  Edit,
  Copy,
  Trash2,
  AlertTriangle,
  DollarSign,
  Table,
  Plus,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import RechargeDialog from '@/components/admin/RechargeDialog';
import EditUserDialog from '@/components/admin/EditUserDialog';

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

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [rechargeDialogOpen, setRechargeDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`);
      const data = await response.json();
      if (data.success) {
        setUser(data.user);
      } else {
        toast.error('获取用户信息失败');
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      toast.error('获取用户信息失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUser = () => {
    if (!user) return;
    const userInfo = `ID: ${user.id}\n邮箱: ${user.email}\n邀请码: ${user.inviteCode}\n用户类型: ${user.userType}\n用户等级: ${user.userLevel}\n余额: ${user.balance}`;
    navigator.clipboard.writeText(userInfo);
    toast.success('用户信息已复制');
  };

  const handleDelete = async (force: boolean = false) => {
    const confirmMsg = force
      ? '确定要强制删除此用户吗？此操作不可撤销！'
      : '确定要删除此用户吗？';
    if (!confirm(confirmMsg)) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        toast.success(force ? '用户已强制删除' : '用户删除成功');
        router.push('/admin/users/list');
      } else {
        toast.error('用户删除失败');
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast.error('用户删除失败');
    }
  };

  const handleRecharge = () => {
    setRechargeDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      正常: { color: 'bg-green-500/10 text-green-400', text: '正常' },
      禁用: { color: 'bg-red-500/10 text-red-400', text: '禁用' },
      冻结: { color: 'bg-yellow-500/10 text-yellow-400', text: '冻结' },
    };
    const config = statusMap[status] || statusMap.正常;
    return <Badge className={config.color}>{config.text}</Badge>;
  };

  const formatBalance = (balance: number) => {
    return balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-white">
        加载中...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen text-white">
        用户不存在
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 面包屑导航 */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>资源</span>
        <span>/</span>
        <span>用户列表</span>
        <span>/</span>
        <span className="text-white">用户列表详情</span>
      </div>

      {/* 返回按钮 */}
      <Button
        variant="ghost"
        onClick={() => router.push('/admin/users/list')}
        className="text-gray-400 hover:text-white mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        返回列表
      </Button>

      {/* 用户信息卡片 */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6">
          {/* 标题和操作按钮 */}
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-xl font-semibold text-white">用户信息</h2>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                  <DropdownMenuItem
                    onClick={handleCopyUser}
                    className="text-gray-300 hover:bg-slate-700 hover:text-white cursor-pointer"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    复制
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDelete(false)}
                    className="text-gray-300 hover:bg-slate-700 hover:text-white cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    删除资源
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDelete(true)}
                    className="text-red-400 hover:bg-slate-700 hover:text-red-300 cursor-pointer"
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    强制删除资源
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleRecharge}
                    className="text-gray-300 hover:bg-slate-700 hover:text-white cursor-pointer"
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    充值
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-white"
                onClick={() => setEditDialogOpen(true)}
              >
                <Edit className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* 用户详情字段 */}
          <div className="space-y-0">
            {[
              { label: 'ID', value: user.id },
              { label: '邮箱', value: user.email },
              { label: '上级', value: user.parent },
              { label: '邀请码', value: user.inviteCode },
              { label: '用户类型', value: user.userType },
              { label: '用户等级', value: user.userLevel },
              {
                label: '状态',
                value: <span className="flex items-center gap-2">{getStatusBadge(user.status)}</span>,
              },
              { label: '余额', value: formatBalance(user.balance) },
              { label: '备注', value: user.remark },
              { label: '注册时间', value: user.createdAt },
              { label: '最后登陆时间', value: user.lastLoginAt },
            ].map((field, index) => (
              <div key={index}>
                <div className="grid grid-cols-2 gap-4 py-4">
                  <div className="text-gray-400">{field.label}</div>
                  <div className="text-gray-200">{field.value}</div>
                </div>
                {index < 10 && <div className="border-t border-slate-700" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 操作区域 */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">操作</h3>
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <div className="relative">
              <Table className="w-12 h-12" />
              <Plus className="w-4 h-4 absolute bottom-0 right-0 bg-slate-700 rounded-full p-1" />
            </div>
            <p className="mt-4 text-sm">操作不符合给定的标准</p>
          </div>
        </CardContent>
      </Card>

      {/* 充值弹窗 */}
      <RechargeDialog
        open={rechargeDialogOpen}
        onOpenChange={setRechargeDialogOpen}
        userId={parseInt(userId)}
        onSuccess={fetchUser}
      />

      {/* 编辑用户弹窗 */}
      <EditUserDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        user={user}
        onSuccess={fetchUser}
      />
    </div>
  );
}
