'use client';

import { Search, Bell, LayoutGrid, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function AdminHeader() {
  return (
    <header className="h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-6 sticky top-0 z-50">
      {/* 左侧 */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">N</span>
          </div>
          <div>
            <span className="text-white font-semibold">Laravel Nova</span>
            <Badge variant="secondary" className="ml-2 bg-slate-700 text-gray-400 text-xs">
              UNREGISTERED
            </Badge>
          </div>
        </div>
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="按 / 键搜索"
            className="pl-9 bg-slate-700 border-slate-600 text-white placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* 右侧 */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
          <Globe className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
          <LayoutGrid className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </Button>
        <div className="h-8 w-px bg-slate-700 mx-2" />
        <Button variant="ghost" className="text-gray-400 hover:text-white flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-medium">A</span>
          </div>
          <span className="text-white">admin</span>
        </Button>
      </div>
    </header>
  );
}
