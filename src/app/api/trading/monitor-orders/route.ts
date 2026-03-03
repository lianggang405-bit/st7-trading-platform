import { NextRequest, NextResponse } from 'next/server';
import { manualTriggerOrders, cancelExpiredOrders } from '@/lib/order-monitor';

/**
 * POST /api/trading/monitor-orders
 * 手动触发订单监控（用于测试和管理）
 *
 * 请求体:
 * - action: 'trigger' | 'cancel-expired' | 'both'
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action || 'both';

    console.log('[OrderMonitor API] Manual trigger requested:', { action });

    let triggerResult = null;
    let cancelledCount = 0;

    if (action === 'trigger' || action === 'both') {
      triggerResult = await manualTriggerOrders();
    }

    if (action === 'cancel-expired' || action === 'both') {
      cancelledCount = await cancelExpiredOrders();
    }

    return NextResponse.json({
      success: true,
      data: {
        trigger: triggerResult,
        cancelled: cancelledCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[OrderMonitor API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '监控失败',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/trading/monitor-orders
 * 获取订单监控状态（监控中）
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      status: 'active',
      interval: 30000, // 30秒
      lastCheck: new Date().toISOString(),
    },
  });
}
