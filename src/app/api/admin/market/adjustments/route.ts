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
    const limit = parseInt(searchParams.get('limit') || '50');

    // 使用真实数据库服务
    const adjustments = await databaseService.getMarketAdjustments(limit);

    return NextResponse.json({
      success: true,
      adjustments,
    });
  } catch (error) {
    console.error('[Admin Market Adjustments] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
