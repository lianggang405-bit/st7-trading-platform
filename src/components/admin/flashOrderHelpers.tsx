import { Badge } from '@/components/ui/badge';

export const formatPrice = (value: number) => {
  return value.toFixed(8);
};

export const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toISOString().replace('T', ' ').substring(0, 19) + 'Z';
};

export const getStatusBadge = (status: string) => {
  const statusMap: Record<string, { color: string; text: string }> = {
    已平仓: { color: 'bg-gray-500/10 text-gray-400', text: '已平仓' },
    进行中: { color: 'bg-blue-500/10 text-blue-400', text: '进行中' },
    已取消: { color: 'bg-red-500/10 text-red-400', text: '已取消' },
  };
  const config = statusMap[status] || statusMap.已平仓;
  return <Badge className={config.color}>{config.text}</Badge>;
};

export const getTypeBadge = (type: string) => {
  if (type === '涨') {
    return <Badge className="bg-green-500/10 text-green-400">涨</Badge>;
  } else if (type === '跌') {
    return <Badge className="bg-red-500/10 text-red-400">跌</Badge>;
  }
  return <Badge className="bg-gray-500/10 text-gray-400">{type}</Badge>;
};

export const getResultBadge = (result: string) => {
  const resultMap: Record<string, { color: string; text: string }> = {
    盈利: { color: 'bg-green-500/10 text-green-400', text: '盈利' },
    亏损: { color: 'bg-red-500/10 text-red-400', text: '亏损' },
    无: { color: 'bg-gray-500/10 text-gray-400', text: '无' },
  };
  const config = resultMap[result] || resultMap.无;
  return <Badge className={config.color}>{config.text}</Badge>;
};

export const getPnlColor = (profit: number) => {
  if (profit > 0) return 'text-green-400';
  if (profit < 0) return 'text-red-400';
  return 'text-gray-400';
};
