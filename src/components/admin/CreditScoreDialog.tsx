'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Award, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: number;
  email: string;
  username?: string;
  creditScore: number;
}

interface CreditScoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onSuccess: () => void;
}

export default function CreditScoreDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}: CreditScoreDialogProps) {
  const [creditScore, setCreditScore] = useState<number>(100);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentScore, setCurrentScore] = useState<number>(100);

  useEffect(() => {
    if (user) {
      setCreditScore(user.creditScore || 100);
      setCurrentScore(user.creditScore || 100);
      setReason('');
    }
  }, [user, open]);

  const handleSubmit = async () => {
    if (!user) return;

    if (creditScore < 0 || creditScore > 100) {
      toast.error('信用分必须在 0-100 之间');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}/credit-score`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creditScore,
          reason: reason || '管理员手动调整',
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(data.message || '信用分更新成功');
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(data.error || '更新失败');
      }
    } catch (error) {
      console.error('Failed to update credit score:', error);
      toast.error('更新失败');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score === 100) return 'text-green-400';
    if (score >= 90) return 'text-yellow-400';
    if (score >= 80) return 'text-orange-500';
    return 'text-red-600';
  };

  const getScoreBadgeColor = (score: number) => {
    if (score === 100) return 'bg-green-600';
    if (score >= 90) return 'bg-yellow-600';
    if (score >= 80) return 'bg-orange-600';
    return 'bg-red-600';
  };

  const getScoreLevel = (score: number) => {
    if (score === 100) return '优秀';
    if (score >= 90) return '良好';
    if (score >= 80) return '中等';
    return '较差';
  };

  const scoreChange = creditScore - currentScore;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Award className="w-5 h-5 text-yellow-400" />
            调整信用分
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            调整用户 {user?.email || ''} 的信用分
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 当前信用分 */}
          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-2">当前信用分</div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`text-4xl font-bold ${getScoreColor(currentScore)}`}>
                  {currentScore}
                </span>
                <Badge className={getScoreBadgeColor(currentScore)}>
                  {getScoreLevel(currentScore)}
                </Badge>
              </div>
              <RefreshCw className="w-5 h-5 text-gray-500" />
            </div>
          </div>

          {/* 调整后信用分 */}
          <div className="bg-blue-600/10 border border-blue-500/30 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-2">调整后信用分</div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`text-4xl font-bold ${getScoreColor(creditScore)}`}>
                  {creditScore}
                </span>
                <Badge className={getScoreBadgeColor(creditScore)}>
                  {getScoreLevel(creditScore)}
                </Badge>
              </div>
              {scoreChange !== 0 && (
                <div className={`flex items-center gap-1 text-sm font-medium ${scoreChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {scoreChange > 0 ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  {scoreChange > 0 ? '+' : ''}{scoreChange}
                </div>
              )}
            </div>
          </div>

          {/* 信用分输入 */}
          <div className="space-y-2">
            <Label htmlFor="credit-score" className="text-white">
              新信用分 (0-100)
            </Label>
            <Input
              id="credit-score"
              type="number"
              min={0}
              max={100}
              value={creditScore}
              onChange={(e) => setCreditScore(parseInt(e.target.value) || 0)}
              className="bg-slate-700 border-slate-600 text-white"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>0</span>
              <span>25</span>
              <span>50</span>
              <span>75</span>
              <span>100</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={creditScore}
              onChange={(e) => setCreditScore(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          {/* 调整原因 */}
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-white">
              调整原因（可选）
            </Label>
            <Textarea
              id="reason"
              placeholder="请输入调整信用分的原因..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-600 hover:bg-slate-700"
            disabled={loading}
          >
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? '保存中...' : '确认调整'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
