'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, RefreshCw, Plus, Edit2, Trash2, DollarSign } from 'lucide-react';

interface CurrencyKxe {
  id: number;
  name: string;
  symbol: string;
  type: 'spot' | 'futures' | 'options' | 'forex';
  rate: number;
  minAmount: number;
  maxAmount: number;
  status: 'active' | 'inactive';
  description: string;
}

/**
 * Currency Kxes 页面 - 纯展示页面
 *
 * 注意：此页面仅用于展示，所有功能已被禁用
 * 该功能暂时未启用，避免误操作引起错误
 */

export default function CurrencyKxesPage() {
  // 静态展示数据
  const staticData: CurrencyKxe[] = [
    {
      id: 14,
      name: '以太坊',
      symbol: 'ETH',
      type: 'spot',
      rate: 2285.50,
      minAmount: 0.01,
      maxAmount: 1000,
      status: 'active',
      description: '以太坊现货交易配置'
    },
    {
      id: 12,
      name: '比特币',
      symbol: 'BTC',
      type: 'spot',
      rate: 43250.00,
      minAmount: 0.001,
      maxAmount: 100,
      status: 'active',
      description: '比特币现货交易配置'
    },
    {
      id: 11,
      name: '澳元兑美元',
      symbol: 'AUDUSD',
      type: 'forex',
      rate: 0.6543,
      minAmount: 0.001,
      maxAmount: 999999,
      status: 'active',
      description: '澳元兑美元外汇交易配置'
    },
  ];

  const [kxes, setKxes] = useState<CurrencyKxe[]>([]);
  const [filteredKxes, setFilteredKxes] = useState<CurrencyKxe[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotice, setShowNotice] = useState(false);

  // 初始化静态数据
  useEffect(() => {
    setKxes(staticData);
    setFilteredKxes(staticData);
    // 显示功能提示
    setShowNotice(true);
    // 5秒后自动隐藏提示
    const timer = setTimeout(() => setShowNotice(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  // 搜索过滤（仅客户端过滤）
  useEffect(() => {
    if (searchQuery) {
      const filtered = kxes.filter(
        (kxe) =>
          kxe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          kxe.symbol.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredKxes(filtered);
    } else {
      setFilteredKxes(kxes);
    }
  }, [searchQuery, kxes]);

  // 禁用的操作函数
  const handleDisabledAction = () => {
    // 不执行任何操作，仅作为占位
    return;
  };

  const getStatusBadge = (status: string) => {
    return status === 'active'
      ? <Badge className="bg-green-500/10 text-green-400">启用</Badge>
      : <Badge className="bg-gray-500/10 text-gray-400">禁用</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const config: { [key: string]: { label: string; color: string } } = {
      spot: { label: '现货', color: 'bg-blue-500/10 text-blue-400' },
      futures: { label: '期货', color: 'bg-purple-500/10 text-purple-400' },
      options: { label: '期权', color: 'bg-green-500/10 text-green-400' },
      forex: { label: '外汇', color: 'bg-orange-500/10 text-orange-400' },
    };
    const typeConfig = config[type] || config.spot;
    return <Badge className={typeConfig.color}>{typeConfig.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* 面包屑 */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-400">桌面</span>
        <span className="text-gray-600">/</span>
        <span className="text-gray-400">品种交易</span>
        <span className="text-gray-600">/</span>
        <span className="text-white">Currency Kxes</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-white">Currency Kxes</h1>
        <p className="text-gray-400 mt-1">货币兑换配置（仅展示）</p>
      </div>

      {/* 功能未启用提示 */}
      {showNotice && (
        <Card className="bg-yellow-900/20 border-yellow-900">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-yellow-400 font-medium mb-1">功能未启用</p>
                <p className="text-yellow-300/80 text-sm">
                  此功能暂时未启用，页面仅用于展示。所有操作按钮已被禁用，无法添加、编辑或删除数据。
                </p>
              </div>
              <button
                onClick={() => setShowNotice(false)}
                className="ml-auto flex-shrink-0 text-yellow-400 hover:text-yellow-300"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 操作栏 - 所有按钮禁用 */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="搜索货币名称或代码..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-slate-700 border-slate-600 text-white placeholder:text-gray-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                className="border-slate-600 bg-slate-700 text-gray-500 cursor-not-allowed"
                disabled
                title="功能已禁用"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button
                disabled
                className="bg-slate-700 text-gray-500 cursor-not-allowed"
                title="功能已禁用"
              >
                <Plus className="w-4 h-4 mr-1" />
                添加配置（已禁用）
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 配置列表 - 只读展示 */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">货币兑换配置（只读）</CardTitle>
          <CardDescription className="text-gray-400">
            共 {filteredKxes.length} 条配置（仅展示）
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredKxes.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-400">暂无货币兑换配置</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-gray-400">货币</TableHead>
                    <TableHead className="text-gray-400">代码</TableHead>
                    <TableHead className="text-gray-400">类型</TableHead>
                    <TableHead className="text-gray-400">汇率</TableHead>
                    <TableHead className="text-gray-400">最小金额</TableHead>
                    <TableHead className="text-gray-400">最大金额</TableHead>
                    <TableHead className="text-gray-400">状态</TableHead>
                    <TableHead className="text-gray-400 text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredKxes.map((kxe) => (
                    <TableRow key={kxe.id} className="border-slate-700 hover:bg-slate-700/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-5 h-5 text-green-400" />
                          <span className="text-gray-300 font-medium">{kxe.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-300">{kxe.symbol}</TableCell>
                      <TableCell>{getTypeBadge(kxe.type)}</TableCell>
                      <TableCell className="text-gray-300">{kxe.rate.toFixed(4)}</TableCell>
                      <TableCell className="text-gray-400">{kxe.minAmount.toFixed(4)}</TableCell>
                      <TableCell className="text-gray-400">{kxe.maxAmount.toLocaleString()}</TableCell>
                      <TableCell>{getStatusBadge(kxe.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled
                            className="text-gray-500 cursor-not-allowed"
                            title="编辑功能已禁用"
                            onClick={handleDisabledAction}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled
                            className="text-gray-500 cursor-not-allowed"
                            title="删除功能已禁用"
                            onClick={handleDisabledAction}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
