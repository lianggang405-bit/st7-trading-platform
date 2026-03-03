import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/admin-auth';
import { databaseService } from '@/lib/database-service';

// PATCH - 更新实名认证状态
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adminToken = request.cookies.get('admin_token')?.value ||
                      request.headers.get('authorization')?.replace('Bearer ', '');

    // 验证管理员权限
    const admin = verifyAdminToken(adminToken || '');
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status, rejectReason } = body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    if (status === 'rejected' && !rejectReason) {
      return NextResponse.json({ error: 'Reject reason is required' }, { status: 400 });
    }

    // 更新申请状态（实际是更新 applications 表中的 type=verification 的记录）
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
}
