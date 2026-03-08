'use client';

import { useEffect, useState, useCallback } from 'react';
import StatCard from '@/components/admin/StatCard';
import { Users, LogIn, Wallet as WalletIcon, ArrowDownCircle, ArrowUpCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface DashboardStats {
  newUsers: number;
  todayLogin: number;
  rechargeCurrency: number;
  bankRechargeCurrency: number;
  extractCurrency: number;
  bankExtractCurrency: number;
}

interface StatCardConfig {
  title: string;
  value: number;
  icon: LucideIcon;
  iconColor: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    newUsers: 0,
    todayLogin: 0,
    rechargeCurrency: 0,
    bankRechargeCurrency: 0,
    extractCurrency: 0,
    bankExtractCurrency: 0
  });
  const [loading, setLoading] = useState(false);

  // 使用 useCallback 避免重新创建函数
  const fetchStats = useCallback(async () => {
    // 加锁，防止并发请求
    if (loading) return;

    setLoading(true);
    try {
      const response = await fetch('/api/admin/dashboard/stats');

      // 检查 HTTP 状态码
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // 检查业务状态
      if (data?.success && data?.stats) {
        setStats(data.stats);
      } else {
        console.error('API returned error:', data?.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      // 不抛出错误，避免页面崩溃
    } finally {
      setLoading(false);
    }
  }, [loading]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // 统一卡片配置，使用 map 渲染，React diff 更稳定
  const statCards: StatCardConfig[] = [
    {
      title: '今日新增用户',
      value: stats.newUsers ?? 0,
      icon: Users,
      iconColor: 'text-blue-500'
    },
    {
      title: '今日登录用户',
      value: stats.todayLogin ?? 0,
      icon: LogIn,
      iconColor: 'text-green-500'
    },
    {
      title: '今日充值金额（非银行）',
      value: stats.rechargeCurrency ?? 0,
      icon: ArrowDownCircle,
      iconColor: 'text-yellow-500'
    },
    {
      title: '今日银行充值金额',
      value: stats.bankRechargeCurrency ?? 0,
      icon: WalletIcon,
      iconColor: 'text-purple-500'
    },
    {
      title: '今日提现金额（非银行）',
      value: stats.extractCurrency ?? 0,
      icon: ArrowUpCircle,
      iconColor: 'text-red-500'
    },
    {
      title: '今日银行提现金额',
      value: stats.bankExtractCurrency ?? 0,
      icon: WalletIcon,
      iconColor: 'text-orange-500'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>桌面</span> / <span className="text-white">主页</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchStats}
          disabled={loading}
          className="border-slate-600 hover:bg-slate-800"
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''} will-change-transform`}
            suppressHydrationWarning
          />
          刷新数据
        </Button>
      </div>

      {/* 数据统计卡片 */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card, index) => (
          <StatCard
            key={card.title}
            title={card.title}
            value={card.value}
            icon={card.icon}
            iconColor={card.iconColor}
          />
        ))}
      </div>

      {/* 底部信息 */}
      <div className="mt-8 p-6 bg-slate-800 rounded-lg border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-2">欢迎使用管理后台</h3>
        <p className="text-gray-400">
          这是一个现代化的交易平台管理系统，支持用户管理、交易对管理、合约设置、钱包管理等全方位功能。
          点击左侧菜单可以进入各个管理模块进行操作。
        </p>
      </div>
    </div>
  );
}
