'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  Plus,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';

interface TradingPair {
  id: number;
  currencyId: number;
  symbol: string;
  isVisible: boolean;
  minOrderSize: number;
  maxOrderSize: number;
  contractFee: number;
  createdAt: string;
}

export default function TradingPairsPage() {
  const [pairs, setPairs] = useState<TradingPair[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedPairs, setSelectedPairs] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(15);

  useEffect(() => {
    fetchPairs();
  }, [currentPage, sortField, sortOrder]);

  const fetchPairs = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/trading/pairs?page=${currentPage}&limit=${pageSize}&sort=${sortField}&order=${sortOrder}&search=${searchQuery}`
      );
      const data = await response.json();
      if (data.success) {
        setPairs(data.pairs || []);
      }
    } catch (error) {
      console.error('Failed to fetch trading pairs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPairs(new Set(pairs.map(p => p.id)));
    } else {
      setSelectedPairs(new Set());
    }
  };

  const handleSelectPair = (pairId: number, checked: boolean) => {
    const newSelected = new Set(selectedPairs);
    if (checked) {
      newSelected.add(pairId);
    } else {
      newSelected.delete(pairId);
    }
    setSelectedPairs(newSelected);
  };

  const handleDelete = async (pairId: number) => {
    if (!confirm('确定要删除此交易对吗？')) return;

    try {
      const response = await fetch(`/api/admin/trading/pairs/${pairId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        toast.success('交易对删除成功');
        fetchPairs();
      } else {
        toast.error('交易对删除失败');
      }
    } catch (error) {
      console.error('Failed to delete trading pair:', error);
      toast.error('交易对删除失败');
    }
  };

  const getVisibilityBadge = (isVisible: boolean) => {
    return isVisible ? (
      <Badge className="bg-green-500/10 text-green-400">展示内容</Badge>
    ) : (
      <Badge className="bg-gray-500/10 text-gray-400">隐藏内容</Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* 面包屑导航 */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>资源</span> / <span className="text-white">交易对</span>
      </div>

      {/* 页面标题和操作栏 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">交易对</h1>
        <div className="flex gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="搜索"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchPairs()}
              className="pl-9 bg-slate-700 border-slate-600 text-white"
            />
          </div>
          <Button variant="outline" size="icon" className="border-slate-600 hover:bg-slate-700">
            <Filter className="w-4 h-4" />
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            创建交易对
          </Button>
        </div>
      </div>

      {/* 数据表格 */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700 hover:bg-slate-700/50">
                <TableHead className="w-12 bg-slate-800">
                  <input
                    type="checkbox"
                    className="rounded border-gray-500 bg-slate-700"
                    checked={selectedPairs.size === pairs.length && pairs.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </TableHead>
                <TableHead className="bg-slate-800 text-gray-400">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-blue-400 hover:text-blue-300"
                    onClick={() => handleSort('id')}
                  >
                    ID
                    {sortField === 'id' && (
                      sortOrder === 'asc' ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />
                    )}
                  </Button>
                </TableHead>
                <TableHead className="bg-slate-800 text-gray-400">法币</TableHead>
                <TableHead className="bg-slate-800 text-gray-400">交易币</TableHead>
                <TableHead className="bg-slate-800 text-gray-400">是否展示</TableHead>
                <TableHead className="bg-slate-800 text-gray-400">合约最小下单数量</TableHead>
                <TableHead className="bg-slate-800 text-gray-400">合约最大下单数量</TableHead>
                <TableHead className="bg-slate-800 text-gray-400">合约手续费%</TableHead>
                <TableHead className="bg-slate-800 text-gray-400">创建时间</TableHead>
                <TableHead className="bg-slate-800 text-gray-400 w-24">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pairs.map((pair) => (
                <TableRow key={pair.id} className="border-slate-700 hover:bg-slate-700/30">
                  <TableCell>
                    <input
                      type="checkbox"
                      className="rounded border-gray-500 bg-slate-700"
                      checked={selectedPairs.has(pair.id)}
                      onChange={(e) => handleSelectPair(pair.id, e.target.checked)}
                    />
                  </TableCell>
                  <TableCell className="text-blue-400 font-medium">{pair.id}</TableCell>
                  <TableCell className="text-gray-400">{pair.currencyId}</TableCell>
                  <TableCell className="text-blue-400 font-medium">{pair.symbol}</TableCell>
                  <TableCell>{getVisibilityBadge(pair.isVisible)}</TableCell>
                  <TableCell className="text-gray-400">{pair.minOrderSize}</TableCell>
                  <TableCell className="text-gray-400">{pair.maxOrderSize.toLocaleString()}</TableCell>
                  <TableCell className="text-gray-400">{pair.contractFee.toFixed(4)}%</TableCell>
                  <TableCell className="text-gray-400">{pair.createdAt || '—'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-red-400"
                        onClick={() => handleDelete(pair.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* 分页 */}
          <div className="flex items-center justify-between p-4 border-t border-slate-700">
            <div className="text-sm text-gray-400">
              显示 {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, pairs.length)} 条，共 {pairs.length} 条
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="border-slate-600 hover:bg-slate-700"
              >
                上一页
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={pairs.length < pageSize}
                className="border-slate-600 hover:bg-slate-700"
              >
                下一页
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
