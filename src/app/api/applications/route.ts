/**
 * 实名认证申请 API
 * 
 * 安全策略：
 * 1. 实名认证图片存储到对象存储（URL + 元数据）
 * 2. 数据库只存储文件 key，不存储 base64
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyTokenAndGetUserId } from '@/lib/auth-helper';
import { databaseService } from '@/lib/database-service';
import { uploadBase64Image, generateFileUrl, StoragePaths } from '@/lib/file-storage';
import { errors, successResponse } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    let userId: string;
    try {
      userId = await verifyTokenAndGetUserId(request);
    } catch {
      return errors.unauthorized('需要登录');
    }

    const body = await request.json();
    const { realName, idCard, frontImage, backImage } = body;

    // 参数校验
    if (!realName || !idCard) {
      return errors.missingParam('realName 或 idCard');
    }

    if (!frontImage || !backImage) {
      return errors.missingParam('frontImage 或 backImage');
    }

    // 上传身份证正面到对象存储
    const frontKey = await uploadBase64Image(
      frontImage,
      StoragePaths.KYC_FRONT,
      parseInt(userId)
    );

    if (!frontKey) {
      return errors.internalError('身份证正面图片上传失败');
    }

    // 上传身份证背面到对象存储
    const backKey = await uploadBase64Image(
      backImage,
      StoragePaths.KYC_BACK,
      parseInt(userId)
    );

    if (!backKey) {
      return errors.internalError('身份证背面图片上传失败');
    }

    // 创建认证申请（存储文件 key，而非 base64）
    const application = await databaseService.createApplication({
      user_id: parseInt(userId),
      type: 'verification',
      real_name: realName,
      id_card: idCard,
      id_card_front_url: frontKey, // 存储对象存储 key
      id_card_back_url: backKey,   // 存储对象存储 key
    });

    if (!application) {
      return errors.databaseError('创建认证申请失败');
    }

    console.log(`[KYC] Created application ${application.id} for user ${userId}`);

    return successResponse({
      application: {
        id: application.id,
        status: application.status,
        createdAt: application.created_at,
      },
    }, { message: '认证申请已提交' });

  } catch (err: any) {
    console.error('[KYC POST] Error:', err);
    return errors.internalError('提交认证申请失败');
  }
}
