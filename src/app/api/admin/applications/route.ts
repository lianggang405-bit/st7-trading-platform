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

    // 1. 从 applications 表获取入金、出金、旧版实名认证申请
    const applications = await databaseService.getApplications({
      status: status && ['pending', 'approved', 'rejected'].includes(status)
        ? (status as 'pending' | 'approved' | 'rejected')
        : undefined,
      type: type && ['deposit', 'withdraw', 'verification'].includes(type)
        ? (type as 'deposit' | 'withdraw' | 'verification')
        : undefined,
    });

    // 2. 从 kyc_requests 表获取新版实名认证申请
    const kycRequests = await databaseService.getKYCRequests({
      status: status && ['pending', 'approved', 'rejected'].includes(status)
        ? (status as 'pending' | 'approved' | 'rejected')
        : undefined,
    });

    // 3. 转换 kyc_requests 数据为 applications 格式
    const kycApplications = kycRequests.map((kyc) => ({
      id: kyc.id,
      user_id: kyc.user_id,
      type: 'verification' as const,
      status: kyc.status,
      amount: undefined,
      bank_name: undefined,
      bank_account: undefined,
      real_name: kyc.real_name,
      id_card: kyc.id_number,
      reject_reason: kyc.reject_reason,
      created_at: kyc.created_at,
      updated_at: kyc.updated_at,
      reviewed_by: undefined,
      reviewed_at: undefined,
    }));

    // 4. 合并两个数据源（如果 type 过滤了，需要过滤）
    let allApplications = [...applications];
    if (!type || type === 'verification') {
      allApplications = [...allApplications, ...kycApplications];
    }

    // 5. 关联用户信息
    const applicationsWithUser = await Promise.all(
      allApplications.map(async (app) => {
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

    // 6. 按创建时间降序排序
    applicationsWithUser.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
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
