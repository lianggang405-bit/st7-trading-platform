import { NextResponse } from 'next/server';
import { getMockUsageStats, getTotalMockUsage, resetMockUsageStats } from '@/lib/mock-monitor';

/**
 * GET /api/admin/mock-usage - 获取 mock 数据使用统计
 */
export async function GET() {
  try {
    const stats = getMockUsageStats();
    const total = getTotalMockUsage();

    return NextResponse.json({
      success: true,
      stats,
      total,
      summary: {
        totalEndpoints: stats.length,
        totalRequests: total,
        topEndpoint: stats[0]?.endpoint || null,
        topCount: stats[0]?.count || 0,
      },
    });
  } catch (error) {
    console.error('Failed to fetch mock usage stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch mock usage stats' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/mock-usage - 重置统计数据
 */
export async function DELETE() {
  try {
    resetMockUsageStats();

    return NextResponse.json({
      success: true,
      message: 'Mock usage statistics reset successfully',
    });
  } catch (error) {
    console.error('Failed to reset mock usage stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reset mock usage stats' },
      { status: 500 }
    );
  }
}
