'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
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
import {
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import EditDemoAccountDialog from '@/components/admin/EditDemoAccountDialog';

interface DemoAccount {
  id: string;
  email: string;
  status: string;
  createdAt: string;
  lastLoginAt: string;
}

export default function DemoAccountsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<DemoAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(15);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  useEffect(() => {
    fetchAccounts();
  }, [currentPage, sortField, sortOrder]);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/users/demo?page=${currentPage}&limit=${pageSize}&sort=${sortField}&order=${sortOrder}&search=${searchQuery}`
      );

      // 检查响应类型
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('API returned non-JSON response:', response.status, response.statusText);
        toast.error('服务器错误：API 配置异常，请联系管理员');
        setAccounts([]);
        return;
      }

      const data = await response.json();

      if (data.success) {
        setAccounts(data.accounts || []);
      } else {
        console.error('API returned error:', data.error);
        toast.error(data.error || '获取模拟账户列表失败');
        setAccounts([]);
      }
    } catch (error) {
      console.error('Failed to fetch demo accounts:', error);
      if (error instanceof SyntaxError) {
        toast.error('服务器错误：API 响应格式异常');
      } else {
        toast.error('获取模拟账户列表失败');
      }
      setAccounts([]);
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
      setSelectedAccounts(new Set(accounts.map(a => a.id)));
    } else {
      setSelectedAccounts(new Set());
    }
  };

  const handleSelectAccount = (accountId: string, checked: boolean) => {
    const newSelected = new Set(selectedAccounts);
    if (checked) {
      newSelected.add(accountId);
    } else {
      newSelected.delete(accountId);
    }
    setSelectedAccounts(newSelected);
  };

  const handleDelete = async (accountId: string) => {
    if (!confirm('确定要删除此模拟账户吗？')) return;

    try {
      const response = await fetch(`/api/admin/users/demo/${accountId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        toast.success('模拟账户删除成功');
        fetchAccounts();
      } else {
        toast.error('模拟账户删除失败');
      }
    } catch (error) {
      console.error('Failed to delete demo account:', error);
      toast.error('模拟账户删除失败');
    }
  };

  const handleEdit = (accountId: string) => {
    setSelectedAccountId(accountId);
    setEditDialogOpen(true);
  };

  const handleEditSuccess = () => {
    toast.success('模拟账户更新成功');
    fetchAccounts();
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

  return (
    <div className="space-y-6">
      {/* 面包屑导航 */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>资源</span> / <span className="text-white">模拟账户</span>
      </div>

      {/* 页面标题和操作栏 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">模拟账户</h1>
        <div className="flex gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="搜索"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchAccounts()}
              className="pl-9 bg-slate-700 border-slate-600 text-white"
            />
          </div>
          <Button variant="outline" size="icon" className="border-slate-600 hover:bg-slate-700">
            <Filter className="w-4 h-4" />
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
                    checked={selectedAccounts.size === accounts.length && accounts.length > 0}
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
                <TableHead className="bg-slate-800 text-gray-400">状态</TableHead>
                <TableHead className="bg-slate-800 text-gray-400">注册时间</TableHead>
                <TableHead className="bg-slate-800 text-gray-400">最后登陆时间</TableHead>
                <TableHead className="bg-slate-800 text-gray-400 w-24">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account.id} className="border-slate-700 hover:bg-slate-700/30">
                  <TableCell>
                    <input
                      type="checkbox"
                      className="rounded border-gray-500 bg-slate-700"
                      checked={selectedAccounts.has(account.id)}
                      onChange={(e) => handleSelectAccount(account.id, e.target.checked)}
                    />
                  </TableCell>
                  <TableCell className="text-blue-400 font-medium">{account.id}</TableCell>
                  <TableCell className="text-gray-300">{account.email}</TableCell>
                  <TableCell>{getStatusBadge(account.status)}</TableCell>
                  <TableCell className="text-gray-400">{account.createdAt}</TableCell>
                  <TableCell className="text-gray-400">{account.lastLoginAt}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-white"
                        onClick={() => router.push(`/admin/users/demo/${account.id}`)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-white"
                        onClick={() => handleEdit(account.id)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-red-400"
                        onClick={() => handleDelete(account.id)}
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
              显示 {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, accounts.length)} 条，共 {accounts.length} 条
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
                disabled={accounts.length < pageSize}
                className="border-slate-600 hover:bg-slate-700"
              >
                下一页
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 编辑模拟账户对话框 */}
      {selectedAccountId && (
        <EditDemoAccountDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          accountId={selectedAccountId}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}
