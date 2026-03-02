'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Plus, Shield, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface Admin {
  id: number;
  username: string;
  email: string;
  roleName: string;
  status: 'active' | 'inactive';
  lastLogin?: string;
  createdAt: string;
}

export default function AdminListPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/admin/list');
      const data = await response.json();
      if (data.success) setAdmins(data.admins || []);
    } catch (error) {
      console.error('Failed to fetch admins:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    return status === 'active'
      ? <Badge className="bg-green-500/10 text-green-400"><CheckCircle className="w-3 h-3 mr-1" />启用</Badge>
      : <Badge className="bg-gray-500/10 text-gray-400"><XCircle className="w-3 h-3 mr-1" />禁用</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>桌面</span> / <span>管理员</span> / <span className="text-white">管理员列表</span>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-white">管理员列表</h1>
        <p className="text-gray-400 mt-1">管理系统管理员账号</p>
      </div>
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-white">管理员账号</CardTitle>
            <CardDescription className="text-gray-400">共 {admins.length} 个管理员</CardDescription>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="搜索管理员..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 bg-slate-700 border-slate-600 text-white"
            />
            <Button variant="outline" size="icon" onClick={fetchAdmins} className="border-slate-600 hover:bg-slate-700">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-1" />添加管理员
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {admins.map((admin) => (
            <div key={admin.id} className="p-4 bg-slate-700/50 rounded-lg mb-2 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-blue-400" />
                <div>
                  <div className="text-white font-medium">{admin.username}</div>
                  <div className="text-gray-400 text-sm">{admin.email}</div>
                  <div className="text-gray-500 text-xs">{admin.roleName}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {getStatusBadge(admin.status)}
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">编辑</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
