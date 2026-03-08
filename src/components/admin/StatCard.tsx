'use client';

import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import dynamic from 'next/dynamic';

// 只 dynamic Select（portal 组件），避免多次 chunk 加载和加载顺序不一致
const Select = dynamic(
  () => import('@/components/ui/select').then(mod => mod.Select),
  { ssr: false }
);

// 其他子组件正常 import，避免重复加载
import {
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  todayLabel?: string;
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  iconColor = 'text-blue-500',
  todayLabel = 'Today'
}: StatCardProps) {
  return (
    <Card className="bg-slate-800 border-slate-700 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Select defaultValue="today">
                <SelectTrigger className="w-auto h-6 text-xs bg-slate-700 border-slate-600 text-gray-300">
                  <SelectValue placeholder="Today" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{value}</div>
            <div className="text-sm text-gray-400">{title}</div>
          </div>
          <div className={`p-3 bg-slate-700/50 rounded-lg ${iconColor}`}>
            <Icon className="w-6 h-6" suppressHydrationWarning />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
