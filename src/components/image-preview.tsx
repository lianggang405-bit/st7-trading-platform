'use client';

import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Download, X, RotateCw } from 'lucide-react';
import { toast } from 'sonner';

interface ImagePreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  src: string;
  title?: string;
}

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
  onLoad?: () => void;
  onError?: () => void;
}

// 懒加载图片组件
export function LazyImage({ src, alt, className, onClick, onLoad, onError }: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observerRef.current?.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoaded(true);
    onError?.();
  };

  return (
    <div
      ref={imgRef}
      className={`relative ${className}`}
      onClick={onClick}
    >
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-700 animate-pulse">
          <RotateCw className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      )}
      {isInView && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className={`w-full h-full object-contain ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </div>
  );
}

// 图片预览弹窗组件（支持缩放和下载）
export function ImagePreview({ open, onOpenChange, src, title }: ImagePreviewProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // 重置状态
  useEffect(() => {
    if (!open) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [open]);

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 5));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleResetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale((prev) => Math.max(Math.min(prev + delta, 5), 0.5));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDownload = async () => {
    try {
      // 创建下载链接
      const link = document.createElement('a');
      link.href = src;
      link.download = `付款凭证_${Date.now()}.${src.split(';')[0].split('/')[1]}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('图片下载成功');
    } catch (error) {
      toast.error('图片下载失败');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl bg-slate-800 border-slate-700 p-0">
        <DialogHeader className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-white">{title || '付款凭证预览'}</DialogTitle>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="relative w-full h-[600px] bg-slate-900 overflow-hidden">
          {/* 图片容器 */}
          <div
            ref={containerRef}
            className="absolute inset-0 flex items-center justify-center cursor-grab active:cursor-grabbing"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <img
              src={src}
              alt="付款凭证"
              className="max-w-full max-h-full object-contain transition-transform duration-200 select-none"
              style={{
                transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
                cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
              }}
              onError={() => toast.error('图片加载失败')}
            />
          </div>

          {/* 控制按钮 */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-800/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-slate-600">
            <Button
              size="icon"
              variant="ghost"
              onClick={handleZoomOut}
              disabled={scale <= 0.5}
              className="text-gray-400 hover:text-white h-8 w-8"
              title="缩小"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-white text-sm min-w-[50px] text-center">{Math.round(scale * 100)}%</span>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleZoomIn}
              disabled={scale >= 5}
              className="text-gray-400 hover:text-white h-8 w-8"
              title="放大"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <div className="w-px h-6 bg-slate-600 mx-1" />
            <Button
              size="icon"
              variant="ghost"
              onClick={handleResetZoom}
              className="text-gray-400 hover:text-white h-8 w-8"
              title="重置"
            >
              <RotateCw className="w-4 h-4" />
            </Button>
            <div className="w-px h-6 bg-slate-600 mx-1" />
            <Button
              size="icon"
              variant="ghost"
              onClick={handleDownload}
              className="text-gray-400 hover:text-white h-8 w-8"
              title="下载"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>

          {/* 提示文字 */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-800/90 backdrop-blur-sm rounded px-3 py-1.5 text-xs text-gray-400">
            滚轮缩放 • 拖拽移动
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
