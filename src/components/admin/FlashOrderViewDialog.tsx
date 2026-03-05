'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { formatPrice, formatDateTime, getStatusBadge, getTypeBadge, getResultBadge, getPnlColor } from './flashOrderHelpers';

interface FlashOrder {
  id: number;
  account: string;
  symbol: string;
  type: string;
  status: string;
  quantity: number;
  fee: number;
  result: string;
  profit: number;
  openPrice: number;
  closePrice: number;
  createdAt: string;
}

interface FlashOrderViewDialogProps {
  open: boolean;
  onClose: () => void;
  order: FlashOrder | null;
}

export function FlashOrderViewDialog({ open, onClose, order }: FlashOrderViewDialogProps) {
  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">秒合约订单详情</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          {/* 基本信息 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400">订单ID</label>
              <p className="text-lg font-medium">{order.id}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">账户</label>
              <p className="text-lg font-medium">{order.account}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">交易品种</label>
              <p className="text-lg font-medium">{order.symbol}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">状态</label>
              <div className="mt-1">{getStatusBadge(order.status)}</div>
            </div>
          </div>

          {/* 交易信息 */}
          <div className="border-t border-slate-700 pt-4">
            <h3 className="text-lg font-semibold mb-4">交易信息</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400">方向</label>
                <div className="mt-1">{getTypeBadge(order.type)}</div>
              </div>
              <div>
                <label className="text-sm text-gray-400">数量</label>
                <p className="text-lg font-medium">{order.quantity}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">开仓价格</label>
                <p className="text-lg font-medium">{formatPrice(order.openPrice)}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">平仓价格</label>
                <p className="text-lg font-medium">{formatPrice(order.closePrice)}</p>
              </div>
            </div>
          </div>

          {/* 财务信息 */}
          <div className="border-t border-slate-700 pt-4">
            <h3 className="text-lg font-semibold mb-4">财务信息</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400">手续费</label>
                <p className="text-lg font-medium">{formatPrice(order.fee)}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">结果</label>
                <div className="mt-1">{getResultBadge(order.result)}</div>
              </div>
              <div className="col-span-2">
                <label className="text-sm text-gray-400">盈亏</label>
                <p className={`text-2xl font-bold ${getPnlColor(order.profit)}`}>
                  {order.profit > 0 ? '+' : ''}{formatPrice(order.profit)}
                </p>
              </div>
            </div>
          </div>

          {/* 时间信息 */}
          <div className="border-t border-slate-700 pt-4">
            <h3 className="text-lg font-semibold mb-4">时间信息</h3>
            <div>
              <label className="text-sm text-gray-400">创建时间</label>
              <p className="text-lg font-medium">{formatDateTime(order.createdAt)}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
