'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface SymbolTypeDetail {
  id: number;
  name: string;
  sort: number;
  status: string;
  created_at?: string;
}

export default function SymbolTypeViewPage() {
  const router = useRouter();
  const params = useParams();
  const typeId = params.id as string;

  const [type, setType] = useState<SymbolTypeDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTypeDetail();
  }, [typeId]);

  const fetchTypeDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/trading/symbol-types/${typeId}`);
      const data = await response.json();

      if (data.success) {
        setType(data.type);
      } else {
        toast.error('获取品种类型详情失败');
        router.back();
      }
    } catch (error) {
      console.error('Failed to fetch symbol type detail:', error);
      toast.error('获取品种类型详情失败');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('确定要删除此品种类型吗？此操作不可恢复！')) return;

    try {
      const response = await fetch(`/api/admin/trading/symbol-types/${typeId}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        toast.success('品种类型删除成功');
        router.push('/admin/trading/types');
      } else {
        toast.error('品种类型删除失败');
      }
    } catch (error) {
      console.error('Failed to delete symbol type:', error);
      toast.error('品种类型删除失败');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      normal: { color: 'bg-green-500/10 text-green-400', text: '正常' },
      disabled: { color: 'bg-red-500/10 text-red-400', text: '禁用' },
    };
    const config = statusMap[status] || statusMap.normal;
    return <Badge className={config.color}>{config.text}</Badge>;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('zh-CN');
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!type) {
    return (
      <div className="flex items-center justify-center h-screen text-white">
        <div>品种类型不存在</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-2 sm:px-0">
      {/* 面包屑导航 - 手机端隐藏 */}
      <div className="hidden sm:flex items-center gap-2 text-sm text-gray-400">
        <span>资源</span>
        <span>/</span>
        <span>品种类型</span>
        <span>/</span>
        <span className="text-white">查看品种类型</span>
      </div>

      {/* 页面标题和操作栏 */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold text-white truncate">查看品种类型</h1>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button
            variant="outline"
            className="border-slate-600 hover:bg-slate-700 text-white"
            onClick={() => router.push(`/admin/trading/types/${typeId}/edit`)}
          >
            <Edit className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">编辑</span>
          </Button>
          <Button
            variant="outline"
            className="border-red-600 hover:bg-red-600/10 text-red-400"
            onClick={handleDelete}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">删除</span>
          </Button>
        </div>
      </div>

      {/* 品种类型信息卡片 */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">{type.name.substring(0, 2)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl sm:text-2xl text-white truncate">{type.name}</CardTitle>
              <p className="text-sm text-gray-400 mt-1">ID: {type.id}</p>
            </div>
            {getStatusBadge(type.status)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">品种类型ID</label>
                <p className="text-base sm:text-lg text-white mt-1">{type.id}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">品种类型名称</label>
                <p className="text-base sm:text-lg text-white mt-1">{type.name}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">排序</label>
                <p className="text-base sm:text-lg text-white mt-1">{type.sort}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">状态</label>
                <p className="mt-1">{getStatusBadge(type.status)}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">创建时间</label>
                <p className="text-base sm:text-lg text-white mt-1">{formatDate(type.created_at)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
