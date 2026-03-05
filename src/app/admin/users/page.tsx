'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Search, RefreshCw, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: number;
  email: string;
  username: string;
  accountType: 'demo' | 'real';
  balance: string;
  creditScore: number;
  isVerified: boolean;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [accountType, setAccountType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 余额调整对话框
  const [balanceDialogOpen, setBalanceDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newBalance, setNewBalance] = useState('');
  const [balanceReason, setBalanceReason] = useState('');
  const [balanceLoading, setBalanceLoading] = useState(false);

  // 信用分调整对话框
  const [creditDialogOpen, setCreditDialogOpen] = useState(false);
  const [newCreditScore, setNewCreditScore] = useState('');
  const [creditReason, setCreditReason] = useState('');
  const [creditLoading, setCreditLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [accountType]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = users.filter(
        (user) =>
          user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.id.toString().includes(searchQuery)
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users${accountType !== 'all' ? `?accountType=${accountType}` : ''}`);
      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
        setFilteredUsers(data.users);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustBalance = async () => {
    if (!selectedUser || !newBalance) return;

    setBalanceLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}/balance`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ balance: parseFloat(newBalance), reason: balanceReason }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('余额调整成功');
        setBalanceDialogOpen(false);
        setNewBalance('');
        setBalanceReason('');
        setSelectedUser(null);
        fetchUsers();
      } else {
        toast.error(data.error || '调整失败');
      }
    } catch (error) {
      console.error('Balance adjustment error:', error);
      toast.error('调整失败，请稍后重试');
    } finally {
      setBalanceLoading(false);
    }
  };

  const handleAdjustCredit = async () => {
    if (!selectedUser || newCreditScore === '' || !creditReason) return;

    setCreditLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}/credit`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creditScore: parseInt(newCreditScore), reason: creditReason }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('信用分调整成功');
        setCreditDialogOpen(false);
        setNewCreditScore('');
        setCreditReason('');
        setSelectedUser(null);
        fetchUsers();
      } else {
        toast.error(data.error || '调整失败');
      }
    } catch (error) {
      console.error('Credit adjustment error:', error);
      toast.error('调整失败，请稍后重试');
    } finally {
      setCreditLoading(false);
    }
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="hidden lg:block">
        <h1 className="text-2xl font-bold text-gray-900">用户管理</h1>
        <p className="text-gray-600 mt-1">查看和管理所有用户账户</p>
      </div>

      {/* 筛选和搜索 */}
      <Card>
        <CardContent className="pt-4 lg:pt-6">
          <div className="flex flex-col gap-3 lg:gap-4">
            <div className="flex gap-2">
              <div className="flex-1 min-w-0">
                <div className="relative">
                  <Search className="absolute left-2 lg:left-3 top-1/2 -translate-y-1/2 w-3 h-3 lg:w-4 lg:h-4 text-gray-400 flex-shrink-0" />
                  <Input
                    placeholder="搜索..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-7 lg:pl-9 text-sm h-9 lg:h-10"
                  />
                </div>
              </div>
              <Select value={accountType} onValueChange={setAccountType}>
                <SelectTrigger className="w-auto min-w-[70px] lg:w-[120px] h-9 lg:h-10 text-xs lg:text-sm">
                  <SelectValue placeholder="类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="demo">模拟</SelectItem>
                  <SelectItem value="real">正式</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={fetchUsers} variant="outline" size="icon" className="h-9 lg:h-10 w-9 lg:w-10 flex-shrink-0">
                <RefreshCw className={`w-3 h-3 lg:w-4 lg:h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 用户列表 */}
      <Card>
        <CardHeader className="pb-3 lg:pb-0 hidden lg:block">
          <CardTitle>用户列表</CardTitle>
          <CardDescription>
            共 {filteredUsers.length} 个用户
          </CardDescription>
        </CardHeader>
        <CardContent className="lg:pt-6">
          {/* 移动端显示用户数量 */}
          <div className="lg:hidden mb-3 text-xs text-gray-500">
            共 {filteredUsers.length} 个用户
          </div>
          <div className="overflow-x-auto mobile-table">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 lg:py-3 px-2 lg:px-4 font-medium text-gray-600 text-xs lg:text-sm">ID</th>
                  <th className="text-left py-2 lg:py-3 px-2 lg:px-4 font-medium text-gray-600 text-xs lg:text-sm">邮箱</th>
                  <th className="text-left py-2 lg:py-3 px-2 lg:px-4 font-medium text-gray-600 text-xs lg:text-sm">用户名</th>
                  <th className="text-left py-2 lg:py-3 px-2 lg:px-4 font-medium text-gray-600 text-xs lg:text-sm">类型</th>
                  <th className="text-left py-2 lg:py-3 px-2 lg:px-4 font-medium text-gray-600 text-xs lg:text-sm">余额</th>
                  <th className="text-left py-2 lg:py-3 px-2 lg:px-4 font-medium text-gray-600 text-xs lg:text-sm">信用分</th>
                  <th className="text-left py-2 lg:py-3 px-2 lg:px-4 font-medium text-gray-600 text-xs lg:text-sm">认证</th>
                  <th className="text-left py-2 lg:py-3 px-2 lg:px-4 font-medium text-gray-600 text-xs lg:text-sm">操作</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-6 lg:py-8 text-gray-500 text-sm">
                      加载中...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-6 lg:py-8 text-gray-500 text-sm">
                      暂无用户数据
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 lg:py-3 px-2 lg:px-4 text-xs lg:text-sm">{user.id}</td>
                      <td className="py-2 lg:py-3 px-2 lg:px-4 text-xs lg:text-sm truncate-text">{user.email}</td>
                      <td className="py-2 lg:py-3 px-2 lg:px-4 text-xs lg:text-sm">{user.username}</td>
                      <td className="py-2 lg:py-3 px-2 lg:px-4">
                        <span
                          className={`inline-flex items-center px-1.5 lg:px-2 py-0.5 lg:py-1 rounded-full text-[10px] lg:text-xs font-medium ${
                            user.accountType === 'demo'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {user.accountType === 'demo' ? '模拟' : '正式'}
                        </span>
                      </td>
                      <td className="py-2 lg:py-3 px-2 lg:px-4 text-xs lg:text-sm font-medium">
                        ${parseFloat(user.balance).toLocaleString()}
                      </td>
                      <td className="py-2 lg:py-3 px-2 lg:px-4 text-xs lg:text-sm">{user.creditScore}</td>
                      <td className="py-2 lg:py-3 px-2 lg:px-4">
                        <span
                          className={`inline-flex items-center px-1.5 lg:px-2 py-0.5 lg:py-1 rounded-full text-[10px] lg:text-xs font-medium ${
                            user.isVerified
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {user.isVerified ? '已认证' : '未认证'}
                        </span>
                      </td>
                      <td className="py-2 lg:py-3 px-2 lg:px-4">
                        <div className="flex gap-1 lg:gap-2">
                          <Dialog open={balanceDialogOpen} onOpenChange={setBalanceDialogOpen}>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedUser(user)}
                                className="h-7 lg:h-8 px-2 lg:px-3 text-xs lg:text-sm"
                              >
                                <Edit2 className="w-3 h-3 lg:w-4 lg:h-4" />
                                <span className="hidden lg:inline">余额</span>
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>调整余额</DialogTitle>
                                <DialogDescription>
                                  调整用户 <strong>{selectedUser?.email}</strong> 的余额
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label htmlFor="balance">新余额 (USDT)</Label>
                                  <Input
                                    id="balance"
                                    type="number"
                                    value={newBalance}
                                    onChange={(e) => setNewBalance(e.target.value)}
                                    placeholder={selectedUser?.balance}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="reason">调整原因</Label>
                                  <Input
                                    id="reason"
                                    value={balanceReason}
                                    onChange={(e) => setBalanceReason(e.target.value)}
                                    placeholder="请输入调整原因"
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  variant="outline"
                                  onClick={() => setBalanceDialogOpen(false)}
                                >
                                  取消
                                </Button>
                                <Button onClick={handleAdjustBalance} disabled={balanceLoading}>
                                  {balanceLoading ? '提交中...' : '确认'}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          <Dialog open={creditDialogOpen} onOpenChange={setCreditDialogOpen}>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedUser(user)}
                                className="h-7 lg:h-8 px-2 lg:px-3 text-xs lg:text-sm"
                              >
                                <Edit2 className="w-3 h-3 lg:w-4 lg:h-4" />
                                <span className="hidden lg:inline">信用分</span>
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>调整信用分</DialogTitle>
                                <DialogDescription>
                                  调整用户 <strong>{selectedUser?.email}</strong> 的信用分
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label htmlFor="creditScore">新信用分 (0-100)</Label>
                                  <Input
                                    id="creditScore"
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={newCreditScore}
                                    onChange={(e) => setNewCreditScore(e.target.value)}
                                    placeholder={selectedUser?.creditScore?.toString()}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="creditReason">调整原因</Label>
                                  <Input
                                    id="creditReason"
                                    value={creditReason}
                                    onChange={(e) => setCreditReason(e.target.value)}
                                    placeholder="请输入调整原因"
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  variant="outline"
                                  onClick={() => setCreditDialogOpen(false)}
                                >
                                  取消
                                </Button>
                                <Button onClick={handleAdjustCredit} disabled={creditLoading}>
                                  {creditLoading ? '提交中...' : '确认'}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
