'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  User,
} from 'lucide-react';
import { toast } from 'sonner';

interface Administrator {
  id: number;
  avatar: string;
  name: string;
  email: string;
  password: string;
  created_at: string;
  updated_at: string;
}

export default function AdministratorsPage() {
  const [administrators, setAdministrators] = useState<Administrator[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedAdministrators, setSelectedAdministrators] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(15);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchAdministrators();
  }, [currentPage, sortField, sortOrder]);

  const fetchAdministrators = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/administrators?page=${currentPage}&pageSize=${pageSize}&sortBy=${sortField}&sortOrder=${sortOrder}&search=${searchQuery}`
      );
      const data = await response.json();
      if (response.ok) {
        setAdministrators(data.data || []);
        setTotalCount(data.total || 0);
      } else {
        toast.error(data.error || '获取管理员列表失败');
      }
    } catch (error) {
      console.error('Failed to fetch administrators:', error);
      toast.error('获取管理员列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchAdministrators();
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    fetchAdministrators();
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAdministrators(new Set(administrators.map(a => a.id)));
    } else {
      setSelectedAdministrators(new Set());
    }
  };

  const handleSelectAdministrator = (administratorId: number, checked: boolean) => {
    const newSelected = new Set(selectedAdministrators);
    if (checked) {
      newSelected.add(administratorId);
    } else {
      newSelected.delete(administratorId);
    }
    setSelectedAdministrators(newSelected);
  };

  const handleDelete = async (administratorId: number) => {
    if (!confirm('确定要删除此管理员吗？')) return;

    try {
      const response = await fetch(`/api/admin/administrators/${administratorId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('删除成功');
        fetchAdministrators();
      } else {
        const data = await response.json();
        toast.error(data.error || '删除失败');
      }
    } catch (error) {
      console.error('Failed to delete administrator:', error);
      toast.error('删除失败');
    }
  };

  const handleBatchDelete = async () => {
    if (selectedAdministrators.size === 0) {
      toast.warning('请选择要删除的记录');
      return;
    }

    if (!confirm(`确定要删除选中的 ${selectedAdministrators.size} 条记录吗？`)) return;

    try {
      for (const administratorId of selectedAdministrators) {
        await fetch(`/api/admin/administrators/${administratorId}`, {
          method: 'DELETE',
        });
      }

      toast.success('批量删除成功');
      setSelectedAdministrators(new Set());
      fetchAdministrators();
    } catch (error) {
      console.error('Failed to batch delete:', error);
      toast.error('批量删除失败');
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6">
      {/* 页面标题和面包屑 */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <span>资源</span>
          <span>/</span>
          <span className="text-gray-900 font-medium">管理员</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">管理员</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          {/* 搜索和操作栏 */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="搜索名称、邮箱"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleSearch} variant="outline">
                搜索
              </Button>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              {selectedAdministrators.size > 0 && (
                <Button variant="destructive" onClick={handleBatchDelete}>
                  批量删除 ({selectedAdministrators.size})
                </Button>
              )}
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                创建管理员
              </Button>
            </div>
          </div>

          {/* 表格 */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      checked={selectedAdministrators.size === administrators.length && administrators.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('id')}
                  >
                    <div className="flex items-center gap-1">
                      ID
                      {sortField === 'id' && (
                        sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>头像</TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-1">
                      名称
                      {sortField === 'name' && (
                        sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('email')}
                  >
                    <div className="flex items-center gap-1">
                      邮箱
                      {sortField === 'email' && (
                        sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : administrators.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-16">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="h-8 w-8 text-gray-400" />
                        </div>
                        <div className="text-center">
                          <p className="text-gray-500 mb-1">管理员不符合给定的标准。</p>
                          <Button className="mt-2">
                            <Plus className="h-4 w-4 mr-2" />
                            创建管理员
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  administrators.map((administrator) => (
                    <TableRow key={administrator.id} className="hover:bg-gray-50">
                      <TableCell>
                        <input
                          type="checkbox"
                          className="rounded border-gray-300"
                          checked={selectedAdministrators.has(administrator.id)}
                          onChange={(e) => handleSelectAdministrator(administrator.id, e.target.checked)}
                        />
                      </TableCell>
                      <TableCell className="font-mono">{administrator.id}</TableCell>
                      <TableCell>
                        <img
                          src={administrator.avatar}
                          alt={administrator.name}
                          className="w-10 h-10 rounded-full bg-blue-100 object-cover"
                          onError={(e) => {
                            e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${administrator.name}`;
                          }}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{administrator.name}</TableCell>
                      <TableCell>{administrator.email}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(administrator.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-500">
                {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalCount)} of {totalCount}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  上一页
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
