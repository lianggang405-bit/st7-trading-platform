'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Users,
  FileText,
  TrendingUp,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());

  const navigation = [
    {
      name: '主页',
      href: '/admin',
      icon: LayoutDashboard,
      children: []
    },
    {
      name: '设置',
      href: '/admin/settings',
      icon: TrendingUp,
      children: [
        { name: '站点设置', href: '/admin/settings/site' },
        { name: '常规设置', href: '/admin/settings/general' },
      ]
    },
    {
      name: '用户管理',
      href: '/admin/users',
      icon: Users,
      children: [
        { name: '用户列表', href: '/admin/users/list' },
        { name: '实名管理', href: '/admin/users/kyc' },
        { name: '模拟账户', href: '/admin/users/demo' },
        { name: '用户等级', href: '/admin/users/level' },
      ]
    },
    {
      name: '品种交易',
      href: '/admin/trading',
      icon: TrendingUp,
      children: [
        { name: '品种管理', href: '/admin/trading/symbols' },
        { name: '品种类型', href: '/admin/trading/types' },
        { name: '交易对', href: '/admin/trading/pairs' },
        { name: '开盘时间', href: '/admin/trading/schedule' },
        { name: '调控机器人', href: '/admin/trading/bot' },
        { name: 'Currency Kxes', href: '/admin/trading/currency' },
        { name: '理财项目', href: '/admin/trading/investment' },
        { name: '理财订单', href: '/admin/trading/orders' },
      ]
    },
    {
      name: '信息管理',
      href: '/admin/info',
      icon: FileText,
      children: [
        { name: '信息管理', href: '/admin/info/list' },
      ]
    },
    {
      name: '合约设置',
      href: '/admin/contract',
      icon: FileText,
      children: [
        { name: '倍数设置', href: '/admin/contract/leverage' },
        { name: '合约订单', href: '/admin/contract/orders' },
        { name: '模拟合约订单', href: '/admin/contract/demo-orders' },
      ]
    },
    {
      name: '秒合约设置',
      href: '/admin/quick-contract',
      icon: FileText,
      children: [
        { name: '秒合约交易', href: '/admin/quick-contract/trades' },
        { name: '模拟秒合约交易', href: '/admin/quick-contract/demo-trades' },
        { name: '秒数设置', href: '/admin/quick-contract/durations' },
      ]
    },
    {
      name: '钱包',
      href: '/admin/wallet',
      icon: FileText,
      children: [
        { name: '用户钱包', href: '/admin/wallet/user-wallets' },
        { name: '财务记录', href: '/admin/wallet/financial-records' },
      ]
    },
    {
      name: '充币设置',
      href: '/admin/deposit-settings',
      icon: FileText,
      children: [
        { name: '电汇币种设置', href: '/admin/deposit-settings/wire-currencies' },
        { name: '电汇信息设置', href: '/admin/deposit-settings/wire-info' },
        { name: '数字货币地址设置', href: '/admin/deposit-settings/crypto-addresses' },
        { name: '充币申请', href: '/admin/wallet/deposit-requests' },
        { name: '银行卡充币申请', href: '/admin/deposit-settings/bank-requests' },
      ]
    },
    {
      name: '提币设置',
      href: '/admin/withdraw-settings',
      icon: FileText,
      children: [
        { name: '数字货币币种设置', href: '/admin/withdraw-settings/crypto-currencies' },
        { name: '支持法币设置', href: '/admin/withdraw-settings/fiat-currencies' },
        { name: '提币申请', href: '/admin/withdraw-settings/withdraw-requests' },
        { name: '银行卡提币申请', href: '/admin/withdraw-settings/bank-withdrawals' },
      ]
    },
    {
      name: '管理员',
      href: '/admin/admin',
      icon: Users,
      children: [
        { name: '管理员列表', href: '/admin/admin/list' },
        { name: '角色管理', href: '/admin/admin/roles' },
        { name: '操作日志', href: '/admin/admin/logs' },
      ]
    },
  ];

  const toggleMenu = (menuName: string) => {
    setExpandedMenus((prev: Set<string>) => {
      const newSet = new Set(prev);
      if (newSet.has(menuName)) {
        newSet.delete(menuName);
      } else {
        newSet.add(menuName);
      }
      return newSet;
    });
  };

  const isMenuActive = (item: any) => {
    if (item.children && item.children.length > 0) {
      return item.children.some((child: any) => pathname === child.href);
    }
    return pathname === item.href;
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // 等待组件挂载后再检查认证
    if (!isMounted) return;

    // 检查是否已登录
    const checkAuth = () => {
      if (typeof window === 'undefined') return;

      // 从 localStorage 读取 token
      const token = localStorage.getItem('admin_token');

      if (!token && pathname !== '/admin/login') {
        // 标记需要重定向，不在 useEffect 中直接调用
        setShouldRedirect(true);
        return;
      }

      setIsAuthenticated(!!token);
    };

    checkAuth();
  }, [router, pathname, isMounted]);

  // 在独立的 useEffect 中处理重定向
  useEffect(() => {
    if (shouldRedirect) {
      router.push('/admin/login');
      setShouldRedirect(false);
    }
  }, [shouldRedirect, router]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
      document.cookie = 'admin_token=; path=/; max-age=0';
    }
    toast.success('已退出登录');
    router.push('/admin/login');
  };

  // 等待挂载和认证检查完成
  if (!isMounted) {
    return null;
  }

  // 登录页面直接返回 children
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-800 border-r border-slate-700 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-700">
          <h1 className="text-xl font-bold text-white">管理后台</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md hover:bg-slate-700 text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="mt-6 px-3 space-y-1">
          {navigation.map((item) => {
            const isActive = isMenuActive(item);
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedMenus.has(item.name);

            return (
              <div key={item.name}>
                {hasChildren ? (
                  <button
                    onClick={() => toggleMenu(item.name)}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-white bg-slate-700'
                        : 'text-gray-400 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : ''}`} />
                      {item.name}
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-white bg-slate-700'
                        : 'text-gray-400 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : ''}`} />
                    {item.name}
                  </Link>
                )}

                {hasChildren && isExpanded && (
                  <div className="mt-1 ml-4 space-y-1">
                    {item.children.map((child: any) => {
                      const isChildActive = pathname === child.href;
                      return (
                        <Link
                          key={child.name}
                          href={child.href}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                            isChildActive
                              ? 'text-white bg-slate-700'
                              : 'text-gray-400 hover:bg-slate-700 hover:text-white'
                          }`}
                        >
                          <div className="w-2 h-2 rounded-full bg-blue-400" />
                          {child.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-400 hover:text-white hover:bg-slate-700"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 mr-3" />
            退出登录
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="h-16 bg-slate-800 border-b border-slate-700 flex items-center px-4 lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-md hover:bg-slate-700 mr-4 text-gray-400"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold text-white">
            {navigation.find((item) => item.href === pathname)?.name || '管理后台'}
          </h2>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
