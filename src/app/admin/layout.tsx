'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
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
  const [checkedAuth, setCheckedAuth] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());

  // 生成面包屑导航函数
  const generateBreadcrumb = (nav: any[]) => {
    if (pathname === '/admin' || pathname === '/admin/login') return null;

    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 0) return null;

    const breadcrumbs = [
      { name: '主页', href: '/admin' }
    ];

    if (segments[1] !== 'admin') {
      const segmentName = segments[1];
      const menuItem = nav.find((item: any) =>
        item.href === `/admin/${segmentName}` ||
        item.children?.some((child: any) => child.href === pathname)
      );

      if (menuItem && menuItem.href !== '/admin') {
        breadcrumbs.push({
          name: menuItem.name,
          href: menuItem.href
        });
      }

      // 检查是否有子菜单
      if (menuItem?.children) {
        const childMenu = menuItem.children.find((child: any) => child.href === pathname);
        if (childMenu) {
          breadcrumbs.push({
            name: childMenu.name,
            href: childMenu.href
          });
        }
      }
    }

    return breadcrumbs;
  };

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
        { name: '充币申请', href: '/admin/deposit-settings/deposit-requests' },
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

  // 在 navigation 定义后生成面包屑
  const breadcrumb = generateBreadcrumb(navigation);

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
    console.log('[AdminLayout] Checking auth...');
    // 检查认证
    const checkAuth = () => {
      if (typeof window === 'undefined') return;

      const token = localStorage.getItem('admin_token');
      console.log('[AdminLayout] Token exists:', !!token, 'Path:', pathname);

      if (!token && pathname !== '/admin/login') {
        console.log('[AdminLayout] No token, redirecting to login');
        router.push('/admin/login');
      } else {
        setIsAuthenticated(!!token);
      }
    };

    checkAuth();
    setCheckedAuth(true);
  }, [pathname, router]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
      document.cookie = 'admin_token=; path=/; max-age=0';
    }
    toast.success('已退出登录');
    router.push('/admin/login');
  };

  // 登录页面直接返回 children
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // 检查认证状态，避免闪屏和白屏
  if (!checkedAuth) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">加载中...</div>
      </div>
    );
  }

  // 如果未认证且不是登录页面，不会走到这里（已经重定向到登录页）
  if (!isAuthenticated && pathname !== '/admin/login') {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-900 overflow-hidden">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 max-w-[85vw] bg-slate-800/95 backdrop-blur-sm border-r border-slate-700 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:bg-slate-800 lg:backdrop-blur-none flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-4 lg:px-6 border-b border-slate-700 flex-shrink-0">
          <h1 className="text-lg lg:text-xl font-bold text-white">管理后台</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md hover:bg-slate-700 text-gray-400"
          >
            <X className="w-5 h-5" suppressHydrationWarning />
          </button>
        </div>

        {/* Navigation - Scrollable area */}
        <nav className="mt-6 px-2 lg:px-3 space-y-1 flex-1 overflow-y-auto overscroll-contain">
          {navigation.map((item) => {
            const isActive = isMenuActive(item);
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedMenus.has(item.name);

            return (
              <div key={item.name}>
                {hasChildren ? (
                  <button
                    onClick={() => toggleMenu(item.name)}
                    className={`w-full flex items-center justify-between gap-2 lg:gap-3 px-2 lg:px-3 py-2 lg:py-2.5 rounded-md text-xs lg:text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-white bg-slate-700'
                        : 'text-gray-400 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 lg:gap-3">
                      <item.icon className={`w-4 h-4 lg:w-5 lg:h-5 ${isActive ? 'text-blue-400' : ''}`} suppressHydrationWarning />
                      <span className="truncate">{item.name}</span>
                    </div>
                    <ChevronDown
                      className={`w-3 h-3 lg:w-4 lg:h-4 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      suppressHydrationWarning
                    />
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-2 lg:gap-3 px-2 lg:px-3 py-2 lg:py-2.5 rounded-md text-xs lg:text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-white bg-slate-700'
                        : 'text-gray-400 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    <item.icon className={`w-4 h-4 lg:w-5 lg:h-5 ${isActive ? 'text-blue-400' : ''} flex-shrink-0`} suppressHydrationWarning />
                    <span className="truncate">{item.name}</span>
                  </Link>
                )}

                {hasChildren && isExpanded && (
                  <div className="mt-1 ml-3 lg:ml-4 space-y-1">
                    {item.children.map((child: any) => {
                      const isChildActive = pathname === child.href;
                      return (
                        <Link
                          key={child.name}
                          href={child.href}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex items-center gap-2 lg:gap-3 px-2 lg:px-3 py-2 lg:py-2.5 rounded-md text-xs lg:text-sm font-medium transition-colors ${
                            isChildActive
                              ? 'text-white bg-slate-700'
                              : 'text-gray-400 hover:bg-slate-700 hover:text-white'
                          }`}
                        >
                          <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-blue-400 flex-shrink-0" />
                          <span className="truncate">{child.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Bottom logout button */}
        <div className="p-3 lg:p-4 border-t border-slate-700 flex-shrink-0">
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-400 hover:text-white hover:bg-slate-700 text-xs lg:text-sm py-3 lg:py-2"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 lg:w-5 lg:h-5 mr-2 lg:mr-3" suppressHydrationWarning />
            <span className="truncate">退出登录</span>
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64 h-screen flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 lg:h-16 bg-slate-800 border-b border-slate-700 flex items-center px-3 lg:px-4 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-md hover:bg-slate-700 mr-2 lg:mr-4 text-gray-400"
          >
            <Menu className="w-5 h-5" suppressHydrationWarning />
          </button>

          {/* Breadcrumb Navigation - Desktop Only */}
          <nav className="hidden lg:flex items-center space-x-2 text-sm flex-1">
            {breadcrumb ? (
              breadcrumb.map((item, index) => (
                <div key={item.href} className="flex items-center">
                  {index > 0 && (
                    <span className="text-gray-500 mx-2">/</span>
                  )}
                  {index === breadcrumb.length - 1 ? (
                    <span className="text-gray-200 font-medium truncate">{item.name}</span>
                  ) : (
                    <Link
                      href={item.href}
                      className="text-gray-400 hover:text-white transition-colors truncate"
                    >
                      {item.name}
                    </Link>
                  )}
                </div>
              ))
            ) : (
              <span className="text-gray-200 font-medium">管理后台</span>
            )}
          </nav>

          {/* Mobile Title - Show on mobile only */}
          <div className="lg:hidden flex-1">
            <h2 className="text-sm lg:text-lg font-semibold text-white truncate">
              {navigation.find((item) => item.href === pathname)?.name || '管理后台'}
            </h2>
          </div>
        </header>

        {/* Page content - Scrollable */}
        <main className="flex-1 overflow-y-auto p-3 lg:p-8 overscroll-contain">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Toaster for notifications */}
      <Toaster />
    </div>
  );
}
