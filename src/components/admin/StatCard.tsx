'use client';

import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { useState, useEffect } from 'react';

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Card className="bg-slate-800 border-slate-700 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {mounted && (
                <div className="text-xs bg-slate-700 border border-slate-600 px-3 py-1.5 rounded text-gray-300 cursor-pointer hover:bg-slate-600 transition-colors">
                  Today
                </div>
              )}
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
