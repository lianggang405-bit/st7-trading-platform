'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface SuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
  onConfirm?: () => void;
}

export function SuccessDialog({
  open,
  onOpenChange,
  title,
  message,
  onConfirm,
}: SuccessDialogProps) {
  const handleConfirm = () => {
    onOpenChange(false);
    onConfirm?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex flex-col items-center text-center">
            {/* 成功图标 */}
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
            <DialogDescription className="text-sm text-gray-500 mt-2">
              {message}
            </DialogDescription>
          </div>
        </DialogHeader>
        <DialogFooter className="sm:justify-center">
          <button
            onClick={handleConfirm}
            className="w-full sm:w-auto bg-blue-500 text-white px-8 py-2.5 rounded-lg font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            確定
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
