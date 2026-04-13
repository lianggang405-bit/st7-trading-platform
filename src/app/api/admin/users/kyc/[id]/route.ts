import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, type RouteContext } from '@/lib/admin-guard';
import { databaseService } from '@/lib/database-service';

// DELETE - 删除实名认证申请
export const DELETE = withAdminAuth(async (
  _request: NextRequest,
  _admin,
  context?: RouteContext
) => {
  try {
    const params = await context?.params;
    const id = params?.id;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // 删除申请
    const success = await databaseService.deleteApplication(parseInt(id));

    if (!success) {
      return NextResponse.json({ error: 'Application not found or delete failed' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Application deleted successfully',
    });
  } catch (error) {
    console.error('[Admin KYC DELETE] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

// PATCH - 更新实名认证状态
export const PATCH = withAdminAuth(async (
  request: NextRequest,
  admin,
  context?: RouteContext
) => {
  try {
    const params = await context?.params;
    const id = params?.id;
    const body = await request.json();
    const { status, rejectReason } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    if (status === 'rejected' && !rejectReason) {
      return NextResponse.json({ error: 'Reject reason is required' }, { status: 400 });
    }

    // 更新申请状态（使用 applications 表）
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
    console.error('[Admin KYC PATCH] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
