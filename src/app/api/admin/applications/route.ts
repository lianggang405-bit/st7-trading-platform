import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/admin-auth';
import { databaseService } from '@/lib/database-service';

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

    // 使用数据库服务获取申请数据
    const applications = await databaseService.getApplications({
      status: status && ['pending', 'approved', 'rejected'].includes(status)
        ? (status as 'pending' | 'approved' | 'rejected')
        : undefined,
      type: type && ['deposit', 'withdraw', 'verification'].includes(type)
        ? (type as 'deposit' | 'withdraw' | 'verification')
        : undefined,
    });

    // 关联用户信息
    const applicationsWithUser = await Promise.all(
      applications.map(async (app) => {
        const user = await databaseService.getUserById(app.user_id);
        return {
          id: app.id,
          userId: app.user_id,
          type: app.type,
          status: app.status,
          amount: app.amount,
          bankName: app.bank_name,
          bankAccount: app.bank_account,
          realName: app.real_name,
          idCard: app.id_card,
          rejectReason: app.reject_reason,
          createdAt: app.created_at,
          updatedAt: app.updated_at,
          reviewedBy: app.reviewed_by,
          reviewedAt: app.reviewed_at,
          user: user ? {
            id: user.id,
            email: user.email,
            username: user.username,
            accountType: user.account_type,
          } : undefined,
        };
      })
    );

    return NextResponse.json({
      success: true,
      applications: applicationsWithUser,
    });
  } catch (error) {
    console.error('[Admin Applications] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
