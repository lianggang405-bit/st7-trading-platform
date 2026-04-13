import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/admin-guard';
import { databaseService } from '@/lib/database-service';

// POST - 创建市场调控
export const POST = withAdminAuth(async (req: NextRequest, admin) => {
  try {
    const { action, symbol, beforePrice, afterPrice, changePercent } = await req.json();

    if (!action || !['rise', 'fall', 'flat', 'manual'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    if (!beforePrice || !afterPrice) {
      return NextResponse.json({ error: 'Price values are required' }, { status: 400 });
    }

    // 计算变化百分比
    const actualChangePercent = changePercent || ((parseFloat(afterPrice) - parseFloat(beforePrice)) / parseFloat(beforePrice)) * 100;

    // 使用真实数据库服务记录调控
    const adjustment = await databaseService.createMarketAdjustment({
      action,
      symbol,
      before_price: beforePrice,
      after_price: afterPrice,
      change_percent: actualChangePercent.toFixed(2),
      created_by: admin.username,
    });

    if (!adjustment) {
      return NextResponse.json({ error: 'Failed to create adjustment' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      adjustment,
    });
  } catch (error) {
    console.error('[Admin Market Adjust] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
