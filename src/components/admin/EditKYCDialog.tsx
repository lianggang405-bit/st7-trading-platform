'use client';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Image from 'next/image';
import { X } from 'lucide-react';

interface KYCRequest {
  id: number;
  userId: number;
  email: string;
  realName: string;
  idNumber: string;
  idCardFront?: string;
  idCardBack?: string;
  applyTime: string;
  reviewTime?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectReason?: string;
}

interface EditKYCDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kyc: KYCRequest | null;
  onSuccess?: () => void;
}

export default function EditKYCDialog({
  open,
  onOpenChange,
  kyc,
  onSuccess,
}: EditKYCDialogProps) {
  const [status, setStatus] = useState<string>('pending');
  const [rejectReason, setRejectReason] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (kyc) {
      setStatus(kyc.status);
      setRejectReason(kyc.rejectReason && kyc.rejectReason !== '—' ? kyc.rejectReason : '');
    }
  }, [kyc]);

  const handleSubmit = async () => {
    if (!kyc) return;

    if (status === 'rejected' && !rejectReason.trim()) {
      toast.error('拒绝审核时必须填写拒绝原因');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users/kyc/${kyc.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          rejectReason: status === 'rejected' ? rejectReason : null,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('审核操作成功');
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(data.error || '审核操作失败');
      }
    } catch (error) {
      console.error('Failed to update KYC:', error);
      toast.error('审核操作失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (kyc) {
      setStatus(kyc.status);
      setRejectReason(kyc.rejectReason && kyc.rejectReason !== '—' ? kyc.rejectReason : '');
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">
            更新 实名管理:{kyc?.realName || '—'}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            审核实名认证信息
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right text-gray-400">
              邮箱
            </Label>
            <div className="col-span-3">
              <Input
                id="email"
                value={kyc?.email || ''}
                disabled
                className="bg-slate-900/50 border-slate-700 text-gray-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="realName" className="text-right text-gray-400">
              真实姓名
            </Label>
            <div className="col-span-3">
              <Input
                id="realName"
                value={kyc?.realName || ''}
                disabled
                className="bg-slate-900/50 border-slate-700 text-gray-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="idNumber" className="text-right text-gray-400">
              证件号码
            </Label>
            <div className="col-span-3">
              <Input
                id="idNumber"
                value={kyc?.idNumber || ''}
                disabled
                className="bg-slate-900/50 border-slate-700 text-gray-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="applyTime" className="text-right text-gray-400">
              申请时间
            </Label>
            <div className="col-span-3">
              <Input
                id="applyTime"
                value={kyc?.applyTime || ''}
                disabled
                className="bg-slate-900/50 border-slate-700 text-gray-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right text-gray-300">
              状态
            </Label>
            <div className="col-span-3">
              <Select
                value={status}
                onValueChange={setStatus}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600 text-white">
                  <SelectItem value="pending">未审核</SelectItem>
                  <SelectItem value="approved">通过审核</SelectItem>
                  <SelectItem value="rejected">拒绝审核</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="rejectReason" className="text-right text-gray-300">
              拒绝备注
            </Label>
            <div className="col-span-3">
              <Input
                id="rejectReason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="拒绝备注"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300">证件照正面</Label>
            {kyc?.idCardFront && (
              <div className="bg-slate-900 rounded-lg overflow-hidden min-h-[200px] flex items-center justify-center">
                <Image
                  src={kyc.idCardFront}
                  alt="证件照正面"
                  width={600}
                  height={400}
                  className="object-contain max-w-full"
                />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300">证件照反面</Label>
            {kyc?.idCardBack && (
              <div className="bg-slate-900 rounded-lg overflow-hidden min-h-[200px] flex items-center justify-center">
                <Image
                  src={kyc.idCardBack}
                  alt="证件照反面"
                  width={600}
                  height={400}
                  className="object-contain max-w-full"
                />
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
            className="border-slate-600 text-gray-300 hover:bg-slate-700 hover:text-white"
          >
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-slate-700 hover:bg-slate-600 text-white"
          >
            {loading ? '处理中...' : '运行操作'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
