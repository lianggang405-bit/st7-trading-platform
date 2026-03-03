'use client';

import { X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import Image from 'next/image';

interface ImagePreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  src: string;
  alt?: string;
}

export default function ImagePreview({
  open,
  onOpenChange,
  src,
  alt = '图片预览',
}: ImagePreviewProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-full h-[80vh] bg-black/95 border-0 p-0 flex items-center justify-center">
        {/* 关闭按钮 */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* 图片容器 */}
        <div className="relative w-full h-full flex items-center justify-center p-8">
          <Image
            src={src}
            alt={alt}
            fill
            className="object-contain"
            sizes="100vw"
            priority
          />
        </div>

        {/* 底部提示 */}
        <div className="absolute bottom-4 left-0 right-0 text-center">
          <p className="text-white/70 text-sm bg-black/50 inline-block px-4 py-2 rounded-full">
            点击背景或右上角关闭
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
