'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import {
  MoreHorizontal,
  Edit2,
  Table,
  Plus,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';

interface DemoAccount {
  id: string;
  email: string;
  status: string;
  createdAt: string;
  lastLoginAt: string;
}

export default function DemoAccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [account, setAccount] = useState<DemoAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [id, setId] = useState<string>('');

  useEffect(() => {
    params.then((resolvedParams) => {
      setId(resolvedParams.id);
    });
  }, [params]);

  useEffect(() => {
    if (id) {
      fetchAccount();
    }
  }, [id]);

  const fetchAccount = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users/demo/${id}`);

      // 检查响应类型
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('API returned non-JSON response:', response.status, response.statusText);
        toast.error('服务器错误：API 配置异常，请联系管理员');
        setAccount(null);
        return;
      }

      const data = await response.json();
      if (data.success) {
        setAccount(data.account);
      } else {
        console.error('API returned error:', data.error);
        toast.error(data.error || '获取账户信息失败');
        setAccount(null);
      }
    } catch (error) {
      console.error('Failed to fetch demo account:', error);
      if (error instanceof SyntaxError) {
        toast.error('服务器错误：API 响应格式异常');
      } else {
        toast.error('获取账户信息失败');
      }
      setAccount(null);
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">加载中...</div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">账户不存在</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 面包屑导航 */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <button
          onClick={() => router.push('/admin/users/demo')}
          className="hover:text-white transition-colors"
        >
          资源
        </button>
        <span>/</span>
        <button
          onClick={() => router.push('/admin/users/demo')}
          className="hover:text-white transition-colors"
        >
          模拟账户
        </button>
        <span>/</span>
        <span className="text-white">
          模拟账户详情:{account.id}
        </span>
      </div>

      {/* 页面标题和操作栏 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">
          模拟账户 详情: {account.id}
        </h1>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
            <MoreHorizontal className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
            <Edit2 className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* 账户信息卡片 */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6">
          <div className="space-y-0">
            {/* ID */}
            <div className="flex items-center justify-between py-3 border-b border-slate-700">
              <span className="text-gray-400 w-32">ID</span>
              <span className="text-gray-100">{account.id}</span>
            </div>

            {/* 邮箱 */}
            <div className="flex items-center justify-between py-3 border-b border-slate-700">
              <span className="text-gray-400 w-32">邮箱</span>
              <span className="text-gray-100">{account.email}</span>
            </div>

            {/* 状态 */}
            <div className="flex items-center justify-between py-3 border-b border-slate-700">
              <span className="text-gray-400 w-32">状态</span>
              {getStatusBadge(account.status)}
            </div>

            {/* 注册时间 */}
            <div className="flex items-center justify-between py-3 border-b border-slate-700">
              <span className="text-gray-400 w-32">注册时间</span>
              <span className="text-gray-100">{account.createdAt}</span>
            </div>

            {/* 最后登录时间 */}
            <div className="flex items-center justify-between py-3">
              <span className="text-gray-400 w-32">最后登陆时间</span>
              <span className="text-gray-100">{account.lastLoginAt}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 操作模块 */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-white">
          <h2 className="font-semibold">操作</h2>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-12 flex flex-col items-center justify-center text-gray-400">
            <Table className="w-12 h-12 mb-2 opacity-50" />
            <Plus className="w-12 h-12 mb-2 opacity-50 absolute" />
            <p>操作不符合给定的标准。</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
