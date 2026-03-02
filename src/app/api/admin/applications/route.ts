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

    const applications = await databaseService.getApplications({
      status: status && ['pending', 'approved', 'rejected'].includes(status)
        ? (status as 'pending' | 'approved' | 'rejected')
        : undefined,
      type: type && ['deposit', 'withdraw', 'verification'].includes(type)
        ? (type as 'deposit' | 'withdraw' | 'verification')
        : undefined,
    });

    return NextResponse.json({
      success: true,
      applications,
    });
  } catch (error) {
    console.error('[Admin Applications] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
