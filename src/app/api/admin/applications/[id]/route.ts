import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, type RouteContext } from '@/lib/admin-guard';
import { databaseService } from '@/lib/database-service';

// PATCH - 更新申请状态
export const PATCH = withAdminAuth(async (
  req: NextRequest,
  admin,
  context?: RouteContext
) => {
  try {
    const params = await context?.params;
    const id = params?.id || (await req.json()).id;
    const { status, rejectReason } = await req.json();

    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    if (status === 'rejected' && !rejectReason) {
      return NextResponse.json({ error: 'Reject reason is required' }, { status: 400 });
    }

    // 使用真实数据库服务
    const updatedApplication = await databaseService.updateApplicationStatus(
      parseInt(id),
      status,
      admin.username,
      status === 'rejected' ? rejectReason : undefined
    );

    if (!updatedApplication) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      application: updatedApplication,
    });
  } catch (error) {
    console.error('[Admin Approve] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
