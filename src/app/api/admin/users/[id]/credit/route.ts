import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/admin-auth';
import { databaseService } from '@/lib/database-service';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 从 cookie 或 header 获取 token
    const token = req.cookies.get('admin_token')?.value ||
                  req.headers.get('authorization')?.replace('Bearer ', '');

    const admin = verifyAdminToken(token || '');
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { creditScore, reason } = await req.json();

    if (creditScore === undefined || isNaN(creditScore) || creditScore < 0 || creditScore > 100) {
      return NextResponse.json({ error: 'Invalid credit score (must be 0-100)' }, { status: 400 });
    }

    if (!reason) {
      return NextResponse.json({ error: 'Reason is required' }, { status: 400 });
    }

    // 使用真实数据库服务
    const user = await databaseService.getUserById(parseInt(id));
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const beforeScore = user.credit_score;
    const changeValue = creditScore - beforeScore;

    const updatedUser = await databaseService.updateUserCreditScore(parseInt(id), creditScore, reason);

    if (!updatedUser) {
      return NextResponse.json({ error: 'Failed to update credit score' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
      adjustment: {
        beforeScore,
        afterScore: creditScore,
        changeValue,
        reason,
      },
    });
  } catch (error) {
    console.error('[Admin Credit] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
