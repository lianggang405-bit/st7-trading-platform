'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import RechargeDialog from '@/components/admin/RechargeDialog';
import CreditScoreDialog from '@/components/admin/CreditScoreDialog';
import {
  Search,
  Plus,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  ChevronUp,
  ChevronDown,
  Copy,
  DollarSign,
  Award,
} from 'lucide-react';
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
  creditScore: number;
  createdAt: string;
  lastLoginAt: string;
}

export default function UserListPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(15);
  const [rechargeDialogOpen, setRechargeDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [creditScoreDialogOpen, setCreditScoreDialogOpen] = useState(false);
  const [selectedUserForCreditScore, setSelectedUserForCreditScore] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchUsers();
  }, [currentPage, sortField, sortOrder]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/users/list?page=${currentPage}&limit=${pageSize}&sort=${sortField}&order=${sortOrder}&search=${searchQuery}`
      );
      const data = await response.json();
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(new Set(users.map(u => u.id)));
    } else {
      setSelectedUsers(new Set());
    }
  };

  const handleSelectUser = (userId: number, checked: boolean) => {
    const newSelected = new Set(selectedUsers);
    if (checked) {
      newSelected.add(userId);
    } else {
      newSelected.delete(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleDelete = async (userId: number) => {
    if (!confirm('确定要删除此用户吗？')) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        toast.success('用户删除成功');
        fetchUsers();
      } else {
        toast.error('用户删除失败');
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast.error('用户删除失败');
    }
  };

  const handleCopyUser = (user: User) => {
    const userInfo = `ID: ${user.id}\n邮箱: ${user.email}\n邀请码: ${user.inviteCode}\n用户类型: ${user.userType}\n用户等级: ${user.userLevel}\n余额: ${formatBalance(user.balance)}`;
    navigator.clipboard.writeText(userInfo);
    toast.success('用户信息已复制');
  };

  const handleRecharge = (userId: number) => {
    setSelectedUserId(userId);
    setRechargeDialogOpen(true);
  };

  const handleRechargeSuccess = () => {
    fetchUsers();
  };

  const handleAdjustCreditScore = (user: User) => {
    setSelectedUserForCreditScore(user);
    setCreditScoreDialogOpen(true);
  };

  const handleCreditScoreSuccess = () => {
    fetchUsers();
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      normal: { color: 'bg-green-500/10 text-green-400', text: '正常' },
      disabled: { color: 'bg-red-500/10 text-red-400', text: '禁用' },
      frozen: { color: 'bg-yellow-500/10 text-yellow-400', text: '冻结' },
    };
    const config = statusMap[status] || statusMap.normal;
    return <Badge className={config.color}>{config.text}</Badge>;
  };

  const formatBalance = (balance: number) => {
    return balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="space-y-6">
      {/* 面包屑导航 */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>资源</span> / <span className="text-white">用户列表</span>
      </div>

      {/* 页面标题和操作栏 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">用户列表</h1>
        <div className="flex gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="搜索"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchUsers()}
              className="pl-9 bg-slate-700 border-slate-600 text-white"
            />
          </div>
          <Button variant="outline" size="icon" className="border-slate-600 hover:bg-slate-700">
            <Filter className="w-4 h-4" />
          </Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => window.location.href = '/admin/users/create'}
          >
            <Plus className="w-4 h-4 mr-2" />
            创建用户列表
          </Button>
        </div>
      </div>

      {/* 数据表格 */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700 hover:bg-slate-700/50">
                <TableHead className="w-12 bg-slate-800">
                  <input
                    type="checkbox"
                    className="rounded border-gray-500 bg-slate-700"
                    checked={selectedUsers.size === users.length && users.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </TableHead>
                <TableHead className="bg-slate-800 text-gray-400">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-blue-400 hover:text-blue-300"
                    onClick={() => handleSort('id')}
                  >
                    ID
                    {sortField === 'id' && (
                      sortOrder === 'asc' ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />
                    )}
                  </Button>
                </TableHead>
                <TableHead className="bg-slate-800 text-gray-400">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-blue-400 hover:text-blue-300"
                    onClick={() => handleSort('email')}
                  >
                    邮箱
                    {sortField === 'email' && (
                      sortOrder === 'asc' ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />
                    )}
                  </Button>
                </TableHead>
                <TableHead className="bg-slate-800 text-gray-400">上级</TableHead>
                <TableHead className="bg-slate-800 text-gray-400">邀请码</TableHead>
                <TableHead className="bg-slate-800 text-gray-400">用户类型</TableHead>
                <TableHead className="bg-slate-800 text-gray-400">用户等级</TableHead>
                <TableHead className="bg-slate-800 text-gray-400">状态</TableHead>
                <TableHead className="bg-slate-800 text-gray-400">余额</TableHead>
                <TableHead className="bg-slate-800 text-gray-400">信用分</TableHead>
                <TableHead className="bg-slate-800 text-gray-400">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-blue-400 hover:text-blue-300"
                    onClick={() => handleSort('createdAt')}
                  >
                    注册时间
                    {sortField === 'createdAt' && (
                      sortOrder === 'asc' ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />
                    )}
                  </Button>
                </TableHead>
                <TableHead className="bg-slate-800 text-gray-400">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-blue-400 hover:text-blue-300"
                    onClick={() => handleSort('lastLoginAt')}
                  >
                    最后登陆时间
                    {sortField === 'lastLoginAt' && (
                      sortOrder === 'asc' ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />
                    )}
                  </Button>
                </TableHead>
                <TableHead className="bg-slate-800 text-gray-400 w-24">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className="border-slate-700 hover:bg-slate-700/30">
                  <TableCell>
                    <input
                      type="checkbox"
                      className="rounded border-gray-500 bg-slate-700"
                      checked={selectedUsers.has(user.id)}
                      onChange={(e) => handleSelectUser(user.id, e.target.checked)}
                    />
                  </TableCell>
                  <TableCell className="text-blue-400 font-medium">{user.id}</TableCell>
                  <TableCell className="text-gray-300">{user.email}</TableCell>
                  <TableCell className="text-gray-400">{user.parent || '无'}</TableCell>
                  <TableCell className="text-gray-400">{user.inviteCode}</TableCell>
                  <TableCell className="text-gray-400">{user.userType}</TableCell>
                  <TableCell className="text-gray-400">{user.userLevel}</TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell className="text-gray-300">{formatBalance(user.balance)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-300 font-mono">{user.creditScore || 100}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-yellow-400 hover:text-yellow-300"
                        onClick={() => handleAdjustCreditScore(user)}
                      >
                        <Award className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-400">{user.createdAt}</TableCell>
                  <TableCell className="text-gray-400">{user.lastLoginAt}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                          <DropdownMenuItem
                            onClick={() => handleCopyUser(user)}
                            className="text-gray-300 hover:bg-slate-700 hover:text-white cursor-pointer"
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            复制
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleRecharge(user.id)}
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
                        className="h-8 w-8 text-gray-400 hover:text-white"
                        onClick={() => router.push(`/admin/users/${user.id}`)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-white"
                        onClick={() => toast.info(`编辑用户: ${user.email}`)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-red-400"
                        onClick={() => handleDelete(user.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* 分页 */}
          <div className="flex items-center justify-between p-4 border-t border-slate-700">
            <div className="text-sm text-gray-400">
              显示 {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, users.length)} 条，共 {users.length} 条
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="border-slate-600 hover:bg-slate-700"
              >
                上一页
              </Button>
              <Select
                value={currentPage.toString()}
                onValueChange={(value) => setCurrentPage(parseInt(value))}
              >
                <SelectTrigger className="w-20 bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  {[1, 2, 3, 4, 5].map((page) => (
                    <SelectItem key={page} value={page.toString()}>{page}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={users.length < pageSize}
                className="border-slate-600 hover:bg-slate-700"
              >
                下一页
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 充值弹窗 */}
      <RechargeDialog
        open={rechargeDialogOpen}
        onOpenChange={setRechargeDialogOpen}
        userId={selectedUserId || 0}
        onSuccess={handleRechargeSuccess}
      />

      {/* 信用分调整弹窗 */}
      <CreditScoreDialog
        open={creditScoreDialogOpen}
        onOpenChange={setCreditScoreDialogOpen}
        user={selectedUserForCreditScore}
        onSuccess={handleCreditScoreSuccess}
      />
    </div>
  );
}
