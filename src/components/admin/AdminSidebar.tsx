'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Settings, Users, TrendingUp, FileText, FileClock, Timer, Wallet, ArrowDownCircle, ArrowUpCircle, Shield, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

interface MenuItem {
  id: string;
  title: string;
  icon: any;
  path?: string;
  badge?: string;
  children?: MenuItem[];
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['admin']));

  const menuItems: MenuItem[] = [
    {
      id: 'home',
      title: '主页',
      icon: Home,
      path: '/admin'
    },
    {
      id: 'settings',
      title: '设置',
      icon: Settings,
      path: '/admin/settings'
    },
    {
      id: 'users',
      title: '用户管理',
      icon: Users,
      path: '/admin/users/list'
    },
    {
      id: 'trading',
      title: '品种交易',
      icon: TrendingUp,
      children: [
        { id: 'trading-pairs', title: '交易对管理', icon: TrendingUp, path: '/admin/trading/pairs' },
        { id: 'market', title: '市场行情', icon: TrendingUp, path: '/admin/trading/market' },
        { id: 'trading-settings', title: '交易设置', icon: TrendingUp, path: '/admin/trading/settings' }
      ]
    },
    {
      id: 'information',
      title: '信息管理',
      icon: FileText,
      children: [
        { id: 'announcements', title: '公告管理', icon: FileText, path: '/admin/information/announcements' },
        { id: 'help', title: '帮助中心', icon: FileText, path: '/admin/information/help' }
      ]
    },
    {
      id: 'contracts',
      title: '合约设置',
      icon: FileClock,
      children: [
        { id: 'contract-management', title: '合约管理', icon: FileClock, path: '/admin/contracts/management' },
        { id: 'margin-settings', title: '保证金设置', icon: FileClock, path: '/admin/contracts/margin' },
        { id: 'risk-params', title: '风控参数', icon: FileClock, path: '/admin/contracts/risk' }
      ]
    },
    {
      id: 'flash-contracts',
      title: '秒合约设置',
      icon: Timer,
      children: [
        { id: 'flash-config', title: '交易配置', icon: Timer, path: '/admin/flash/config' },
        { id: 'flash-profit', title: '收益配置', icon: Timer, path: '/admin/flash/profit' }
      ]
    },
    {
      id: 'wallet',
      title: '钱包',
      icon: Wallet,
      children: [
        { id: 'deposit-records', title: '充值记录', icon: Wallet, path: '/admin/wallet/deposit' },
        { id: 'withdraw-records', title: '提现记录', icon: Wallet, path: '/admin/wallet/withdraw' },
        { id: 'balance-details', title: '资金明细', icon: Wallet, path: '/admin/wallet/details' }
      ]
    },
    {
      id: 'deposit-settings',
      title: '充币设置',
      icon: ArrowDownCircle,
      children: [
        { id: 'deposit-address', title: '充币地址', icon: ArrowDownCircle, path: '/admin/deposit/address' },
        { id: 'deposit-records-settings', title: '充币记录', icon: ArrowDownCircle, path: '/admin/deposit/records' }
      ]
    },
    {
      id: 'withdraw-settings',
      title: '提币设置',
      icon: ArrowUpCircle,
      children: [
        { id: 'withdraw-audit', title: '提币审核', icon: ArrowUpCircle, path: '/admin/withdraw/audit' },
        { id: 'withdraw-rules', title: '提币规则', icon: ArrowUpCircle, path: '/admin/withdraw/rules' }
      ]
    },
    {
      id: 'admin',
      title: '管理员',
      icon: Shield,
      children: [
        { id: 'admin-list', title: '管理员列表', icon: Shield, path: '/admin/admin/list' },
        { id: 'admin-roles', title: '角色管理', icon: Shield, path: '/admin/admin/roles' },
        { id: 'admin-logs', title: '操作日志', icon: Shield, path: '/admin/admin/logs' }
      ]
    }
  ];

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const isActive = (path?: string) => {
    if (!path) return false;
    return pathname === path || pathname.startsWith(path + '/');
  };

  return (
    <aside className="w-64 bg-slate-800 border-r border-slate-700 h-[calc(100vh-64px)] overflow-y-auto">
      <nav className="p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = expandedItems.has(item.id);
          const isItemActive = item.path ? isActive(item.path) : false;

          return (
            <div key={item.id}>
              <Button
                variant={isItemActive ? 'secondary' : 'ghost'}
                className={`w-full justify-start ${isItemActive ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400 hover:text-white'}`}
                onClick={() => hasChildren && toggleExpand(item.id)}
                asChild={!hasChildren}
              >
                {item.path ? (
                  <Link href={item.path}>
                    <Icon className="w-4 h-4 mr-2" />
                    <span className="flex-1 text-left">{item.title}</span>
                    {item.badge && <Badge variant="secondary" className="ml-2 bg-slate-700 text-gray-400 text-xs">{item.badge}</Badge>}
                  </Link>
                ) : (
                  <>
                    <Icon className="w-4 h-4 mr-2" />
                    <span className="flex-1 text-left">{item.title}</span>
                    {item.badge && <Badge variant="secondary" className="ml-2 bg-slate-700 text-gray-400 text-xs">{item.badge}</Badge>}
                    {hasChildren && (
                      <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    )}
                  </>
                )}
              </Button>
              {hasChildren && isExpanded && item.children && (
                <div className="ml-4 mt-1 space-y-1">
                  {item.children.map((child) => {
                    const ChildIcon = child.icon;
                    const isChildActive = child.path ? isActive(child.path) : false;

                    return (
                      <Button
                        key={child.id}
                        variant={isChildActive ? 'secondary' : 'ghost'}
                        asChild
                        className={`w-full justify-start ${isChildActive ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400 hover:text-white'}`}
                      >
                        <Link href={child.path || '#'}>
                          <ChildIcon className="w-3.5 h-3.5 mr-2" />
                          {child.title}
                        </Link>
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
