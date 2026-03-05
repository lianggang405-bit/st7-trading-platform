import { NextRequest, NextResponse } from 'next/server';
import { StorageService } from '@/lib/storage-service';

/**
 * 文件上传 API
 * POST /api/storage/upload
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: '未找到文件' },
        { status: 400 }
      );
    }

    // 验证文件大小（最大 10MB）
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: '文件大小不能超过 10MB' },
        { status: 400 }
      );
    }

    // 验证文件类型
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: '不支持的文件类型' },
        { status: 400 }
      );
    }

    // 读取文件内容
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 上传到对象存储
    const key = await StorageService.uploadFile(buffer, file.name, file.type);

    // 生成访问 URL
    const url = await StorageService.getFileUrl(key, 86400); // 24 小时有效期

    return NextResponse.json({
      success: true,
      data: {
        key,
        url,
        fileName: file.name,
        fileSize: file.size,
        contentType: file.type,
      },
    });
  } catch (error) {
    console.error('[Storage API] Upload error:', error);
    return NextResponse.json(
      { error: '文件上传失败' },
      { status: 500 }
    );
  }
}

/**
 * 生成文件访问 URL
 * GET /api/storage/upload?key=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json(
        { error: '缺少文件 key' },
        { status: 400 }
      );
    }

    // 检查文件是否存在
    const exists = await StorageService.fileExists(key);
    if (!exists) {
      return NextResponse.json(
        { error: '文件不存在' },
        { status: 404 }
      );
    }

    // 生成访问 URL
    const url = await StorageService.getFileUrl(key, 86400); // 24 小时有效期

    return NextResponse.json({
      success: true,
      data: {
        key,
        url,
      },
    });
  } catch (error) {
    console.error('[Storage API] Generate URL error:', error);
    return NextResponse.json(
      { error: '生成 URL 失败' },
      { status: 500 }
    );
  }
}
