import { S3Storage } from 'coze-coding-dev-sdk';

// 初始化对象存储客户端
const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: '',
  secretKey: '',
  bucketName: process.env.COZE_BUCKET_NAME,
  region: 'cn-beijing',
});

export class StorageService {
  /**
   * 上传文件到对象存储
   * @param file 文件 Buffer
   * @param fileName 文件名
   * @param contentType 内容类型
   * @returns 存储的 key
   */
  static async uploadFile(
    file: Buffer,
    fileName: string,
    contentType?: string
  ): Promise<string> {
    try {
      const key = await storage.uploadFile({
        fileContent: file,
        fileName: this.sanitizeFileName(fileName),
        contentType: contentType || 'application/octet-stream',
      });

      return key;
    } catch (error) {
      console.error('[StorageService] Upload failed:', error);
      throw new Error('文件上传失败');
    }
  }

  /**
   * 上传 Base64 图片
   * @param base64Data Base64 字符串（包含 data:image/... 前缀）
   * @param fileName 文件名
   * @returns 存储的 key
   */
  static async uploadBase64Image(
    base64Data: string,
    fileName: string
  ): Promise<string> {
    try {
      // 提取 Base64 数据
      const base64 = base64Data.split(',')[1];
      const buffer = Buffer.from(base64, 'base64');

      // 提取内容类型
      const contentType = base64Data.match(/data:([^;]+)/)?.[1] || 'image/jpeg';

      const key = await this.uploadFile(buffer, fileName, contentType);
      return key;
    } catch (error) {
      console.error('[StorageService] Base64 upload failed:', error);
      throw new Error('Base64 图片上传失败');
    }
  }

  /**
   * 从 URL 下载并上传
   * @param url 远程 URL
   * @returns 存储的 key
   */
  static async uploadFromUrl(url: string): Promise<string> {
    try {
      const key = await storage.uploadFromUrl({
        url,
        timeout: 30000,
      });

      return key;
    } catch (error) {
      console.error('[StorageService] URL upload failed:', error);
      throw new Error('从 URL 上传失败');
    }
  }

  /**
   * 生成文件访问 URL
   * @param key 文件 key
   * @param expireTime 过期时间（秒），默认 24 小时
   * @returns 签名 URL
   */
  static async getFileUrl(
    key: string,
    expireTime: number = 86400
  ): Promise<string> {
    try {
      const url = await storage.generatePresignedUrl({
        key,
        expireTime,
      });

      return url;
    } catch (error) {
      console.error('[StorageService] Generate URL failed:', error);
      throw new Error('生成访问 URL 失败');
    }
  }

  /**
   * 删除文件
   * @param key 文件 key
   * @returns 是否删除成功
   */
  static async deleteFile(key: string): Promise<boolean> {
    try {
      const result = await storage.deleteFile({ fileKey: key });
      return result;
    } catch (error) {
      console.error('[StorageService] Delete failed:', error);
      return false;
    }
  }

  /**
   * 检查文件是否存在
   * @param key 文件 key
   * @returns 是否存在
   */
  static async fileExists(key: string): Promise<boolean> {
    try {
      const exists = await storage.fileExists({ fileKey: key });
      return exists;
    } catch (error) {
      console.error('[StorageService] Check existence failed:', error);
      return false;
    }
  }

  /**
   * 列出文件
   * @param prefix 前缀
   * @param maxKeys 最大数量
   * @returns 文件列表
   */
  static async listFiles(
    prefix: string = '',
    maxKeys: number = 100
  ): Promise<{ keys: string[]; nextToken?: string }> {
    try {
      const result = await storage.listFiles({
        prefix,
        maxKeys,
      });

      return {
        keys: result.keys,
        nextToken: result.nextContinuationToken,
      };
    } catch (error) {
      console.error('[StorageService] List files failed:', error);
      return { keys: [] };
    }
  }

  /**
   * 清理文件名，移除非法字符
   * @param fileName 原始文件名
   * @returns 清理后的文件名
   */
  private static sanitizeFileName(fileName: string): string {
    // 移除空格和特殊字符
    return fileName
      .replace(/\s+/g, '_')
      .replace(/[^\w\-./]/g, '')
      .replace(/_{2,}/g, '_')
      .replace(/^_|_$/g, '');
  }
}

export default storage;
