'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Plus, ShieldCheck, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Role {
  id: number;
  name: string;
  description: string;
  permissions: string[];
  createdAt: string;
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/admin/roles');
      const data = await response.json();
      if (data.success) setRoles(data.roles || []);
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>桌面</span> / <span>管理员</span> / <span className="text-white">角色管理</span>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-white">角色管理</h1>
        <p className="text-gray-400 mt-1">管理系统角色和权限</p>
      </div>
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => (
          <Card key={role.id} className="bg-slate-800 border-slate-700">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-400" />
                  <CardTitle className="text-white">{role.name}</CardTitle>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white p-1">
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <CardDescription className="text-gray-400">{role.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm text-gray-500">权限:</div>
                <div className="flex flex-wrap gap-1">
                  {role.permissions.map((perm, idx) => (
                    <span key={idx} className="px-2 py-1 bg-slate-700 rounded text-xs text-gray-300">
                      {perm}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        <Card className="bg-slate-800/50 border-slate-700 border-dashed flex items-center justify-center min-h-[200px] cursor-pointer hover:bg-slate-800/70 transition-colors">
          <div className="text-center">
            <Plus className="w-12 h-12 text-gray-500 mx-auto mb-2" />
            <div className="text-gray-500">添加角色</div>
          </div>
        </Card>
      </div>
    </div>
  );
}
