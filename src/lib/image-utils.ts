/**
 * 图片压缩工具函数
 * 用于在上传前压缩图片，减少存储空间和传输带宽
 */

export interface CompressImageOptions {
  maxWidth?: number;      // 最大宽度（像素）
  maxHeight?: number;     // 最大高度（像素）
  maxSizeKB?: number;     // 最大文件大小（KB）
  quality?: number;       // 初始质量（0-1）
  format?: 'image/jpeg' | 'image/webp' | 'image/png'; // 输出格式
}

export interface CompressImageResult {
  base64: string;         // 压缩后的 Base64 数据
  originalSize: number;   // 原始大小（字节）
  compressedSize: number; // 压缩后大小（字节）
  ratio: number;          // 压缩比例（0-1）
  format: string;         // 输出格式
}

/**
 * 压缩图片
 * @param file 图片文件
 * @param options 压缩选项
 * @returns 压缩后的图片信息
 */
export async function compressImage(
  file: File,
  options: CompressImageOptions = {}
): Promise<CompressImageResult> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    maxSizeKB = 500,
    quality = 0.85,
    format = 'image/webp',
  } = options;

  const maxSizeBytes = maxSizeKB * 1024;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // 计算缩放比例，保持宽高比
          const ratio = Math.min(
            maxWidth / width,
            maxHeight / height,
            1 // 如果原图比目标尺寸小，不放大
          );
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('无法获取 Canvas 上下文'));
            return;
          }

          // 绘制图片
          ctx.drawImage(img, 0, 0, width, height);

          // 逐步降低质量，直到满足大小要求
          let currentQuality = quality;
          let result = canvas.toDataURL(format, currentQuality);
          let originalSize = file.size;
          let compressedSize = result.length;

          // 如果压缩后仍然超过目标大小，继续降低质量
          while (compressedSize > maxSizeBytes && currentQuality > 0.1) {
            currentQuality -= 0.05;
            result = canvas.toDataURL(format, currentQuality);
            compressedSize = result.length;
          }

          // 如果质量降低到最低仍然超过目标大小，尝试缩小尺寸
          if (compressedSize > maxSizeBytes) {
            let scaleRatio = 0.9;
            while (compressedSize > maxSizeBytes && scaleRatio > 0.5) {
              const newWidth = Math.floor(width * scaleRatio);
              const newHeight = Math.floor(height * scaleRatio);
              canvas.width = newWidth;
              canvas.height = newHeight;
              ctx.drawImage(img, 0, 0, newWidth, newHeight);
              result = canvas.toDataURL(format, currentQuality);
              compressedSize = result.length;
              scaleRatio -= 0.05;
            }
          }

          resolve({
            base64: result,
            originalSize,
            compressedSize,
            ratio: compressedSize / originalSize,
            format,
          });
        } catch (error) {
          reject(error);
        }
      };
      img.onerror = () => reject(new Error('图片加载失败'));
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
  });
}

/**
 * 从 Base64 数据中提取图片类型和内容
 * @param base64Data Base64 图片数据
 * @returns 图片类型和纯 Base64 内容
 */
export function parseBase64Image(base64Data: string): {
  mimeType: string;
  data: string;
} | null {
  // 匹配 data:image/xxx;base64, 格式
  const matches = base64Data.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);

  if (!matches || matches.length !== 3) {
    return null;
  }

  return {
    mimeType: matches[1],
    data: matches[2],
  };
}

/**
 * 将 Base64 数据转换为 Blob
 * @param base64Data Base64 图片数据
 * @returns Blob 对象
 */
export function base64ToBlob(base64Data: string): Blob | null {
  const parsed = parseBase64Image(base64Data);

  if (!parsed) {
    return null;
  }

  const byteCharacters = atob(parsed.data);
  const byteArrays: BlobPart[] = [];

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);

    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  return new Blob(byteArrays, { type: parsed.mimeType });
}

/**
 * 验证图片文件
 * @param file 图片文件
 * @param maxSizeMB 最大文件大小（MB）
 * @returns 验证结果
 */
export function validateImageFile(
  file: File,
  maxSizeMB: number = 5
): { valid: boolean; error?: string } {
  // 检查文件类型
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: '不支持的图片格式，请上传 JPG、PNG、WebP 或 GIF 格式的图片',
    };
  }

  // 检查文件大小
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `图片大小不能超过 ${maxSizeMB}MB`,
    };
  }

  // 检查是否真的是图片
  if (!file.type.startsWith('image/')) {
    return {
      valid: false,
      error: '请上传有效的图片文件',
    };
  }

  return { valid: true };
}

/**
 * 生成唯一文件名
 * @param userId 用户ID
 * @param originalName 原始文件名
 * @returns 唯一文件名
 */
export function generateFileName(userId: string, originalName: string): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const ext = originalName.split('.').pop() || 'png';
  return `${userId}/${timestamp}-${randomStr}.${ext}`;
}
