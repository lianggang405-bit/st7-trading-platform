/**
 * 文件存储服务
 * 
 * 使用 S3Storage 实现文件上传、下载、删除等功能
 */

import { S3Storage } from 'coze-coding-dev-sdk';

/* ─── 存储客户端 ───────────────────────────────────────────── */

let storageInstance: S3Storage | null = null;

export function getStorage(): S3Storage {
  if (!storageInstance) {
    storageInstance = new S3Storage({
      endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
      accessKey: '',
      secretKey: '',
      bucketName: process.env.COZE_BUCKET_NAME,
      region: 'cn-beijing',
    });
  }
  return storageInstance;
}

/* ─── 存储路径配置 ────────────────────────────────────────── */

export const StoragePaths = {
  KYC_FRONT: 'kyc/front/',
  KYC_BACK: 'kyc/back/',
  DEPOSIT_PROOF: 'deposit/proof/',
  AVATAR: 'avatars/',
} as const;

/* ─── 上传函数 ────────────────────────────────────────────── */

/**
 * 上传 Base64 图片到对象存储
 * @param base64Data Base64 编码的图片数据（包含 data:image/xxx;base64, 前缀）
 * @param path 存储路径前缀
 * @param userId 用户 ID
 * @returns 存储的 key
 */
export async function uploadBase64Image(
  base64Data: string,
  path: string,
  userId: number
): Promise<string | null> {
  try {
    // 解析 Base64
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      console.error('[Storage] Invalid Base64 format');
      return null;
    }

    const contentType = matches[1];
    const base64Content = matches[2];
    const buffer = Buffer.from(base64Content, 'base64');

    // 生成文件名
    const timestamp = Date.now();
    const fileName = `${path}${userId}_${timestamp}.${getExtensionFromMimeType(contentType)}`;

    // 上传到对象存储
    const storage = getStorage();
    const key = await storage.uploadFile({
      fileContent: buffer,
      fileName: fileName,
      contentType,
    });

    console.log(`[Storage] Uploaded file: ${key}`);
    return key;
  } catch (error) {
    console.error('[Storage] Upload failed:', error);
    return null;
  }
}

/**
 * 上传文件到对象存储
 * @param buffer 文件内容
 * @param path 存储路径前缀
 * @param fileName 原始文件名
 * @param contentType MIME 类型
 * @returns 存储的 key
 */
export async function uploadFile(
  buffer: Buffer,
  path: string,
  fileName: string,
  contentType: string
): Promise<string | null> {
  try {
    const timestamp = Date.now();
    const safeFileName = sanitizeFileName(fileName);
    const fullPath = `${path}${timestamp}_${safeFileName}`;

    const storage = getStorage();
    const key = await storage.uploadFile({
      fileContent: buffer,
      fileName: fullPath,
      contentType,
    });

    return key;
  } catch (error) {
    console.error('[Storage] Upload failed:', error);
    return null;
  }
}

/* ─── URL 生成函数 ────────────────────────────────────────── */

/**
 * 生成签名 URL 用于访问文件
 * @param key 文件存储 key
 * @param expiresIn 有效期（秒），默认 3600
 * @returns 签名 URL
 */
export async function generateFileUrl(
  key: string,
  expiresIn = 3600
): Promise<string | null> {
  try {
    const storage = getStorage();
    const url = await storage.generatePresignedUrl({
      key,
      expireTime: expiresIn,
    });
    return url;
  } catch (error) {
    console.error('[Storage] Generate URL failed:', error);
    return null;
  }
}

/* ─── 删除函数 ────────────────────────────────────────────── */

/**
 * 删除存储的文件
 * @param key 文件存储 key
 * @returns 是否删除成功
 */
export async function deleteFile(key: string): Promise<boolean> {
  try {
    const storage = getStorage();
    return await storage.deleteFile({ fileKey: key });
  } catch (error) {
    console.error('[Storage] Delete failed:', error);
    return false;
  }
}

/* ─── 辅助函数 ────────────────────────────────────────────── */

/**
 * 从 MIME 类型获取文件扩展名
 */
function getExtensionFromMimeType(mimeType: string): string {
  const mimeMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/bmp': 'bmp',
    'image/tiff': 'tiff',
    'application/pdf': 'pdf',
  };
  return mimeMap[mimeType] || 'bin';
}

/**
 * 清理文件名，移除不安全字符
 */
function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .substring(0, 100);
}
