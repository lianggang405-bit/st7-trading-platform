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
  X,
  Image as ImageIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface InfoItem {
  id: number;
  title: string;
  type: string;
  language: string;
  sort: number;
  coverImage: string;
  isShow: boolean;
  keywords: string;
  summary?: string;
  content?: string;
}

export default function InfoManagementPage() {
  const [infos, setInfos] = useState<InfoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedInfos, setSelectedInfos] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(15);
  const [totalCount, setTotalCount] = useState(0);

  // 查看详情相关状态
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewInfo, setViewInfo] = useState<InfoItem | null>(null);

  // 编辑相关状态
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editInfo, setEditInfo] = useState<InfoItem | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    type: '',
    language: '',
    sort: 0,
    coverImage: '',
    isShow: true,
    keywords: '',
    summary: '',
    content: '',
  });
  const [editLoading, setEditLoading] = useState(false);

  // 创建相关状态
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    type: '',
    language: '',
    sort: 0,
    coverImage: '',
    isShow: true,
    keywords: '',
    summary: '',
    content: '',
  });
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    fetchInfos();
  }, [currentPage, sortField, sortOrder]);

  const fetchInfos = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/info/list?page=${currentPage}&limit=${pageSize}&sort=${sortField}&order=${sortOrder}&search=${searchQuery}`
      );
      const data = await response.json();
      if (data.success) {
        setInfos(data.infos || []);
        setTotalCount(data.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch infos:', error);
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
      setSelectedInfos(new Set(infos.map(i => i.id)));
    } else {
      setSelectedInfos(new Set());
    }
  };

  const handleSelectInfo = (infoId: number, checked: boolean) => {
    const newSelected = new Set(selectedInfos);
    if (checked) {
      newSelected.add(infoId);
    } else {
      newSelected.delete(infoId);
    }
    setSelectedInfos(newSelected);
  };

  const handleDelete = async (infoId: number) => {
    if (!confirm('确定要删除此信息吗？')) return;

    try {
      const response = await fetch(`/api/admin/info/list/${infoId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        toast.success('删除成功');
        fetchInfos();
      } else {
        toast.error('删除失败');
      }
    } catch (error) {
      console.error('Failed to delete info:', error);
      toast.error('删除失败');
    }
  };

  const handleView = (info: InfoItem) => {
    setViewInfo(info);
    setViewDialogOpen(true);
  };

  const handleEdit = (info: InfoItem) => {
    setEditInfo(info);
    setEditForm({
      title: info.title,
      type: info.type,
      language: info.language,
      sort: info.sort,
      coverImage: info.coverImage || '',
      isShow: info.isShow,
      keywords: info.keywords || '',
      summary: info.summary || '',
      content: info.content || '',
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editInfo) return;

    setEditLoading(true);
    try {
      const response = await fetch(`/api/admin/info/list/${editInfo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });
      const data = await response.json();
      if (data.success) {
        toast.success('更新成功');
        setEditDialogOpen(false);
        fetchInfos();
      } else {
        toast.error(data.error || '更新失败');
      }
    } catch (error) {
      console.error('Failed to update info:', error);
      toast.error('更新失败');
    } finally {
      setEditLoading(false);
    }
  };

  const handleCreate = () => {
    setCreateForm({
      title: '',
      type: '',
      language: '',
      sort: 0,
      coverImage: '',
      isShow: true,
      keywords: '',
      summary: '',
      content: '',
    });
    setCreateDialogOpen(true);
  };

  const handleCreateSubmit = async () => {
    if (!createForm.title.trim()) {
      toast.error('请输入标题');
      return;
    }

    setCreateLoading(true);
    try {
      const response = await fetch('/api/admin/info/list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createForm),
      });
      const data = await response.json();
      if (data.success) {
        toast.success('创建成功');
        setCreateDialogOpen(false);
        fetchInfos();
      } else {
        toast.error(data.error || '创建失败');
      }
    } catch (error) {
      console.error('Failed to create info:', error);
      toast.error('创建失败');
    } finally {
      setCreateLoading(false);
    }
  };

  const formatEmptyValue = (value: string | null | undefined) => {
    return value && value.trim() !== '' ? value : '—';
  };

  return (
    <div className="space-y-6">
      {/* 面包屑导航 */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>资源</span> / <span className="text-white">信息管理</span>
      </div>

      {/* 页面标题和操作栏 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">信息管理</h1>
        <div className="flex gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="搜索"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchInfos()}
              className="pl-9 bg-slate-700 border-slate-600 text-white"
            />
          </div>
          <Button variant="outline" size="icon" className="border-slate-600 hover:bg-slate-700">
            <Filter className="w-4 h-4" />
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            创建 信息管理
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
                    checked={selectedInfos.size === infos.length && infos.length > 0}
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
                <TableHead className="bg-slate-800 text-gray-400">标题</TableHead>
                <TableHead className="bg-slate-800 text-gray-400">类型</TableHead>
                <TableHead className="bg-slate-800 text-gray-400">语言</TableHead>
                <TableHead className="bg-slate-800 text-gray-400">排序</TableHead>
                <TableHead className="bg-slate-800 text-gray-400">封面图</TableHead>
                <TableHead className="bg-slate-800 text-gray-400">是否展示</TableHead>
                <TableHead className="bg-slate-800 text-gray-400">关键字</TableHead>
                <TableHead className="bg-slate-800 text-gray-400 w-32">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {infos.map((info) => (
                <TableRow key={info.id} className="border-slate-700 hover:bg-slate-700/30">
                  <TableCell>
                    <input
                      type="checkbox"
                      className="rounded border-gray-500 bg-slate-700"
                      checked={selectedInfos.has(info.id)}
                      onChange={(e) => handleSelectInfo(info.id, e.target.checked)}
                    />
                  </TableCell>
                  <TableCell className="text-blue-400 font-medium">{info.id}</TableCell>
                  <TableCell className="text-gray-300 font-medium">{formatEmptyValue(info.title)}</TableCell>
                  <TableCell className="text-gray-300">{formatEmptyValue(info.type)}</TableCell>
                  <TableCell className="text-gray-300">{formatEmptyValue(info.language)}</TableCell>
                  <TableCell className="text-gray-400">{info.sort}</TableCell>
                  <TableCell>
                    {info.coverImage ? (
                      <img
                        src={info.coverImage}
                        alt="封面"
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-slate-700 rounded flex items-center justify-center text-gray-500 text-xs">
                        无封面
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-gray-400">
                    {info.isShow ? '展示内容' : '隐藏'}
                  </TableCell>
                  <TableCell className="text-gray-400">{formatEmptyValue(info.keywords)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-white"
                        onClick={() => handleView(info)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-white"
                        onClick={() => handleEdit(info)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-red-400"
                        onClick={() => handleDelete(info.id)}
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
              {totalCount > 0 ? `${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, totalCount)} of ${totalCount}` : '0-0 of 0'}
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={infos.length < pageSize}
                className="border-slate-600 hover:bg-slate-700"
              >
                下一页
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 创建信息管理对话框 */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>创建 信息管理</DialogTitle>
            <DialogDescription className="text-gray-400">
              创建新的信息管理内容
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="create-title">标题</Label>
              <Input
                id="create-title"
                placeholder="标题"
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="create-type">类型</Label>
                <select
                  id="create-type"
                  value={createForm.type}
                  onChange={(e) => setCreateForm({ ...createForm, type: e.target.value })}
                  className="w-full bg-slate-700 border-slate-600 text-white rounded-md px-3 py-2 mt-1"
                >
                  <option value="">选择一个选项</option>
                  <option value="公告">公告</option>
                  <option value="新闻">新闻</option>
                  <option value="帮助">帮助</option>
                  <option value="活动">活动</option>
                </select>
              </div>
              <div>
                <Label htmlFor="create-language">语言</Label>
                <select
                  id="create-language"
                  value={createForm.language}
                  onChange={(e) => setCreateForm({ ...createForm, language: e.target.value })}
                  className="w-full bg-slate-700 border-slate-600 text-white rounded-md px-3 py-2 mt-1"
                >
                  <option value="">选择一个选项</option>
                  <option value="中文简体">中文简体</option>
                  <option value="中文繁体">中文繁体</option>
                  <option value="English">English</option>
                  <option value="Tiếng Việt">Tiếng Việt</option>
                  <option value="ภาษาไทย">ภาษาไทย</option>
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="create-sort">排序</Label>
              <Input
                id="create-sort"
                type="number"
                placeholder="排序"
                value={createForm.sort}
                onChange={(e) => setCreateForm({ ...createForm, sort: parseInt(e.target.value) || 0 })}
                className="bg-slate-700 border-slate-600 text-white mt-1"
              />
            </div>
            <div>
              <Label htmlFor="create-coverImage">封面图</Label>
              <div className="mt-1">
                <Input
                  id="create-coverImage"
                  type="text"
                  placeholder="输入图片URL或点击选择文件"
                  value={createForm.coverImage}
                  onChange={(e) => setCreateForm({ ...createForm, coverImage: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white mb-2"
                />
                {createForm.coverImage && (
                  <img
                    src={createForm.coverImage}
                    alt="封面预览"
                    className="w-full h-32 object-cover rounded"
                  />
                )}
              </div>
            </div>
            <div>
              <Label>是否展示</Label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="create-isShow"
                    checked={createForm.isShow === true}
                    onChange={() => setCreateForm({ ...createForm, isShow: true })}
                    className="rounded border-gray-500"
                  />
                  <span className="text-white">展示内容</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="create-isShow"
                    checked={createForm.isShow === false}
                    onChange={() => setCreateForm({ ...createForm, isShow: false })}
                    className="rounded border-gray-500"
                  />
                  <span className="text-white">隐藏内容</span>
                </label>
              </div>
            </div>
            <div>
              <Label htmlFor="create-keywords">关键字</Label>
              <Input
                id="create-keywords"
                placeholder="关键字"
                value={createForm.keywords}
                onChange={(e) => setCreateForm({ ...createForm, keywords: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white mt-1"
              />
            </div>
            <div>
              <Label htmlFor="create-summary">摘要</Label>
              <Textarea
                id="create-summary"
                placeholder="摘要"
                value={createForm.summary}
                onChange={(e) => setCreateForm({ ...createForm, summary: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white mt-1"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="create-content">内容</Label>
              <Textarea
                id="create-content"
                placeholder="内容"
                value={createForm.content}
                onChange={(e) => setCreateForm({ ...createForm, content: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white mt-1"
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              className="border-slate-600 hover:bg-slate-700"
            >
              取消
            </Button>
            <Button
              onClick={handleCreateSubmit}
              disabled={createLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {createLoading ? '保存中...' : '确定'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 查看详情对话框 */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>信息详情</DialogTitle>
            <DialogDescription className="text-gray-400">
              查看信息管理详情
            </DialogDescription>
          </DialogHeader>
          {viewInfo && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-400">ID</Label>
                  <div className="text-white mt-1">{viewInfo.id}</div>
                </div>
                <div>
                  <Label className="text-gray-400">排序</Label>
                  <div className="text-white mt-1">{viewInfo.sort}</div>
                </div>
              </div>
              <div>
                <Label className="text-gray-400">标题</Label>
                <div className="text-white mt-1">{viewInfo.title}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-400">类型</Label>
                  <div className="text-white mt-1">{viewInfo.type}</div>
                </div>
                <div>
                  <Label className="text-gray-400">语言</Label>
                  <div className="text-white mt-1">{viewInfo.language}</div>
                </div>
              </div>
              <div>
                <Label className="text-gray-400">封面图</Label>
                {viewInfo.coverImage ? (
                  <img
                    src={viewInfo.coverImage}
                    alt="封面"
                    className="w-full h-48 object-cover rounded mt-2"
                  />
                ) : (
                  <div className="w-full h-48 bg-slate-700 rounded flex items-center justify-center text-gray-500 mt-2">
                    <div className="text-center">
                      <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                      无封面图
                    </div>
                  </div>
                )}
              </div>
              <div>
                <Label className="text-gray-400">关键字</Label>
                <div className="text-white mt-1">{viewInfo.keywords || '—'}</div>
              </div>
              <div>
                <Label className="text-gray-400">是否展示</Label>
                <div className="text-white mt-1">
                  {viewInfo.isShow ? '展示内容' : '隐藏'}
                </div>
              </div>
              <div>
                <Label className="text-gray-400">摘要</Label>
                <div className="text-white mt-1 bg-slate-700 p-3 rounded">
                  {viewInfo.summary || '—'}
                </div>
              </div>
              <div>
                <Label className="text-gray-400">内容</Label>
                <div className="text-white mt-1 bg-slate-700 p-3 rounded max-h-64 overflow-y-auto whitespace-pre-wrap">
                  {viewInfo.content || '—'}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setViewDialogOpen(false)}
              className="border-slate-600 hover:bg-slate-700"
            >
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑对话框 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>编辑信息</DialogTitle>
            <DialogDescription className="text-gray-400">
              修改信息管理内容
            </DialogDescription>
          </DialogHeader>
          {editInfo && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">标题</Label>
                <Input
                  id="edit-title"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-type">类型</Label>
                  <Input
                    id="edit-type"
                    value={editForm.type}
                    onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-language">语言</Label>
                  <Input
                    id="edit-language"
                    value={editForm.language}
                    onChange={(e) => setEditForm({ ...editForm, language: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-sort">排序</Label>
                  <Input
                    id="edit-sort"
                    type="number"
                    value={editForm.sort}
                    onChange={(e) => setEditForm({ ...editForm, sort: parseInt(e.target.value) || 0 })}
                    className="bg-slate-700 border-slate-600 text-white mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-isShow">是否展示</Label>
                  <select
                    id="edit-isShow"
                    value={editForm.isShow.toString()}
                    onChange={(e) => setEditForm({ ...editForm, isShow: e.target.value === 'true' })}
                    className="w-full bg-slate-700 border-slate-600 text-white rounded-md px-3 py-2 mt-1"
                  >
                    <option value="true">展示内容</option>
                    <option value="false">隐藏</option>
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor="edit-coverImage">封面图 URL</Label>
                <Input
                  id="edit-coverImage"
                  value={editForm.coverImage}
                  onChange={(e) => setEditForm({ ...editForm, coverImage: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit-keywords">关键字</Label>
                <Textarea
                  id="edit-keywords"
                  value={editForm.keywords}
                  onChange={(e) => setEditForm({ ...editForm, keywords: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white mt-1"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="edit-summary">摘要</Label>
                <Textarea
                  id="edit-summary"
                  value={editForm.summary}
                  onChange={(e) => setEditForm({ ...editForm, summary: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white mt-1"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="edit-content">内容</Label>
                <Textarea
                  id="edit-content"
                  value={editForm.content}
                  onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white mt-1"
                  rows={6}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              className="border-slate-600 hover:bg-slate-700"
            >
              取消
            </Button>
            <Button
              onClick={handleEditSubmit}
              disabled={editLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {editLoading ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
