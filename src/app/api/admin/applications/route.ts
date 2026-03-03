import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/admin-auth';
import { mockDataService } from '@/lib/mock-data-service';

export async function GET(req: NextRequest) {
  try {
    // 从 cookie 或 header 获取 token
    const token = req.cookies.get('admin_token')?.value ||
                  req.headers.get('authorization')?.replace('Bearer ', '');

    if (!token || !verifyAdminToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    // 使用 mockDataService 获取申请数据（与前端统一）
    const applications = mockDataService.getApplications(
      status && ['pending', 'approved', 'rejected'].includes(status)
        ? (status as 'pending' | 'approved' | 'rejected')
        : undefined,
      type && ['deposit', 'withdraw', 'verification'].includes(type)
        ? (type as 'deposit' | 'withdraw' | 'verification')
        : undefined
    );

    // 转换为管理端需要的格式
    const formattedApplications = applications.map(app => ({
      id: app.id,
      userId: app.userId,
      type: app.type,
      status: app.status,
      amount: app.amount,
      bankName: app.bankName,
      bankAccount: app.bankAccount,
      realName: app.realName,
      idCard: app.idCard,
      rejectReason: app.rejectReason,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
      reviewedBy: app.reviewedBy,
      reviewedAt: app.reviewedAt,
      user: app.user,
    }));

    return NextResponse.json({
      success: true,
      applications: formattedApplications,
    });
  } catch (error) {
    console.error('[Admin Applications] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
