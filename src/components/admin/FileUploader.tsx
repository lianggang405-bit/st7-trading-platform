'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, X, File, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface UploadResult {
  key: string;
  url: string;
  fileName: string;
  fileSize: number;
  contentType: string;
}

interface FileUploaderProps {
  onUploadComplete?: (result: UploadResult) => void;
  accept?: string;
  maxSize?: number; // MB
  multiple?: boolean;
}

export function FileUploader({
  onUploadComplete,
  accept = 'image/*,.pdf,.txt',
  maxSize = 10,
  multiple = false,
}: FileUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<UploadResult[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // 验证文件大小
    const oversizedFiles = files.filter(f => f.size > maxSize * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error(`文件大小不能超过 ${maxSize}MB`);
      return;
    }

    // 逐个上传文件
    for (const file of files) {
      await uploadFile(file);
    }

    // 重置 input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/storage/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`上传成功: ${result.data.fileName}`);
        setUploadedFiles(prev => [...prev, result.data]);
        onUploadComplete?.(result.data);
      } else {
        toast.error(result.error || '上传失败');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('上传失败');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="space-y-4">
      {/* 上传按钮 */}
      <div className="flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="gap-2"
        >
          <Upload className="w-4 h-4" />
          选择文件
        </Button>
        {uploading && (
          <span className="text-sm text-gray-400 self-center">
            上传中... {uploadProgress}%
          </span>
        )}
      </div>

      {/* 进度条 */}
      {uploading && (
        <Progress value={uploadProgress} className="h-2" />
      )}

      {/* 已上传文件列表 */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          {uploadedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-slate-800 border border-slate-700 rounded-lg"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0">
                  <File className="w-8 h-8 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {file.fileName}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatFileSize(file.fileSize)} • {file.contentType}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <Check className="w-5 h-5 text-green-400" />
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveFile(index)}
                className="flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* 提示信息 */}
      <div className="text-xs text-gray-400">
        <p>• 支持格式: {accept}</p>
        <p>• 最大文件大小: {maxSize}MB</p>
      </div>
    </div>
  );
}
