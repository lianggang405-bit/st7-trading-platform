import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/database-service';

export async function GET(req: NextRequest) {
  try {
    // 从 cookie 获取 token
    const token = req.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 从 token 解析用户 ID (格式: token_<userId>_<timestamp>)
    const userIdMatch = token.match(/token_(\d+)_/);
    if (!userIdMatch) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = parseInt(userIdMatch[1]);

    // 查询用户的实名认证申请记录
    const allApplications = await databaseService.getApplications({
      type: 'verification',
    });

    // 过滤当前用户的实名认证申请
    const verificationApplications = allApplications
      .filter((app) => app.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // 获取最新的申请记录
    const latestApplication = verificationApplications[0] || null;

    return NextResponse.json({
      success: true,
      status: latestApplication?.status || null,
      application: latestApplication ? {
        id: latestApplication.id,
        status: latestApplication.status,
        realName: latestApplication.real_name,
        idCard: latestApplication.id_card,
        createdAt: latestApplication.created_at,
        updatedAt: latestApplication.updated_at,
        reviewedBy: latestApplication.reviewed_by,
        reviewedAt: latestApplication.reviewed_at,
      } : null,
    });
  } catch (error) {
    console.error('[Verification Status GET] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
