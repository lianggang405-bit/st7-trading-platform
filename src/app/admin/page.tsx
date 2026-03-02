'use client';

import { useEffect, useState } from 'react';
import StatCard from '@/components/admin/StatCard';
import { Users, LogIn, Wallet as WalletIcon, ArrowDownCircle, ArrowUpCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DashboardStats {
  newUsers: number;
  todayLogin: number;
  rechargeCurrency: number;
  bankRechargeCurrency: number;
  extractCurrency: number;
  bankExtractCurrency: number;
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

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/dashboard/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

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
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          刷新数据
        </Button>
      </div>

      {/* 数据统计卡片 */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="今日新增用户"
          value={stats.newUsers || '0 暂无数据'}
          icon={Users}
          iconColor="text-blue-500"
        />
        <StatCard
          title="今日登录用户"
          value={stats.todayLogin || '0 暂无数据'}
          icon={LogIn}
          iconColor="text-green-500"
        />
        <StatCard
          title="今日充值金额（非银行）"
          value={stats.rechargeCurrency || '0 暂无数据'}
          icon={ArrowDownCircle}
          iconColor="text-yellow-500"
        />
        <StatCard
          title="今日银行充值金额"
          value={stats.bankRechargeCurrency || '0 暂无数据'}
          icon={WalletIcon}
          iconColor="text-purple-500"
        />
        <StatCard
          title="今日提现金额（非银行）"
          value={stats.extractCurrency || '0 暂无数据'}
          icon={ArrowUpCircle}
          iconColor="text-red-500"
        />
        <StatCard
          title="今日银行提现金额"
          value={stats.bankExtractCurrency || '0 暂无数据'}
          icon={WalletIcon}
          iconColor="text-orange-500"
        />
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
