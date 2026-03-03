import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/database-service';

// PUT - 更新用户信用分
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const body = await request.json();
    const { creditScore, reason } = body;

    // 验证必填字段
    if (creditScore === undefined || creditScore === null) {
      return NextResponse.json(
        { success: false, error: 'Credit score is required' },
        { status: 400 }
      );
    }

    // 验证信用分范围
    if (creditScore < 0 || creditScore > 100) {
      return NextResponse.json(
        { success: false, error: 'Credit score must be between 0 and 100' },
        { status: 400 }
      );
    }

    // 更新用户信用分
    const updatedUser = await databaseService.updateUserCreditScore(
      parseInt(userId),
      creditScore,
      reason || '管理员手动调整'
    );

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: 'Failed to update credit score' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error in PUT /api/admin/users/[id]/credit-score:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
