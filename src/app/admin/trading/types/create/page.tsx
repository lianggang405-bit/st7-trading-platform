'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function SymbolTypeCreatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sort: '',
    status: 'normal',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('请输入品种类型名称');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/trading/symbol-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          sort: formData.sort ? parseInt(formData.sort) : 0,
          status: formData.status,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('品种类型创建成功');
        router.push('/admin/trading/types');
      } else {
        toast.error(data.error || '创建品种类型失败');
      }
    } catch (error) {
      console.error('Failed to create symbol type:', error);
      toast.error('创建品种类型失败');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="space-y-6 px-2 sm:px-0">
      {/* 面包屑导航 - 手机端隐藏 */}
      <div className="hidden sm:flex items-center gap-2 text-sm text-gray-400">
        <span>资源</span>
        <span>/</span>
        <span>品种类型</span>
        <span>/</span>
        <span className="text-white">新建品种类型</span>
      </div>

      {/* 页面标题和操作栏 */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white flex-shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl sm:text-2xl font-bold text-white truncate">新建品种类型</h1>
      </div>

      {/* 表单卡片 */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">品种类型信息</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* 品种类型名称 */}
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name" className="text-gray-300">
                  品种类型名称 <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="请输入品种类型名称"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                  disabled={loading}
                />
              </div>

              {/* 排序 */}
              <div className="space-y-2">
                <Label htmlFor="sort" className="text-gray-300">
                  排序
                </Label>
                <Input
                  id="sort"
                  type="number"
                  placeholder="请输入排序值"
                  value={formData.sort}
                  onChange={(e) => handleInputChange('sort', e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                  disabled={loading}
                />
                <p className="text-xs text-gray-400">数值越小，排序越靠前</p>
              </div>

              {/* 状态 */}
              <div className="space-y-2">
                <Label htmlFor="status" className="text-gray-300">
                  状态
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange('status', value)}
                  disabled={loading}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="请选择状态" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="normal" className="text-white">正常</SelectItem>
                    <SelectItem value="disabled" className="text-white">禁用</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-3 pt-4 border-t border-slate-700">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="border-slate-600 hover:bg-slate-700 text-white"
                disabled={loading}
              >
                取消
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? '保存中...' : '保存'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
