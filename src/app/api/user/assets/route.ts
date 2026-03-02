import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getBatchRealPrices } from '@/lib/market-data-source';

// GET - 获取用户资产信息
export async function GET(request: NextRequest) {
  try {
    // 从 Authorization header 获取 token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          success: false,
          error: '未提供认证令牌',
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const match = token.match(/^token_(.+)_(\d+)$/);

    if (!match) {
      return NextResponse.json(
        {
          success: false,
          error: '无效的认证令牌',
        },
        { status: 401 }
      );
    }

    const userId = match[1];

    // 从数据库查询用户资产信息
    const { data: user, error } = await supabase
      .from('users')
      .select('balance')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return NextResponse.json(
        {
          success: false,
          error: '用户不存在',
        },
        { status: 404 }
      );
    }

    // 查询用户的持仓信息
    const { data: positions } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'open'); // 只查询开仓状态的订单

    let usedMargin = 0;
    let floatingProfit = 0;
    
    if (positions && positions.length > 0) {
      // 获取持仓相关的所有 symbol
      const symbols = Array.from(new Set(positions.map((p: any) => p.symbol)));
      
      // 批量获取实时价格
      const currentPrices = await getBatchRealPrices(symbols);
      
      // 计算已用保证金和浮动盈亏
      positions.forEach((pos: any) => {
        // 累加保证金
        usedMargin += (pos.margin || 0);
        
        // 计算单个持仓盈亏
        const currentPrice = currentPrices[pos.symbol] || pos.price;
        const openPrice = pos.price;
        const volume = pos.quantity;
        const isLong = pos.side === 'buy';
        
        const profit = (currentPrice - openPrice) * volume * (isLong ? 1 : -1);
        floatingProfit += profit;
      });
    }

    const balance = user.balance || 0;
    const lockedBalance = 0; // 暂时没有冻结资金逻辑，如有挂单冻结可在此添加

    const equity = balance + floatingProfit;
    const freeMargin = balance - usedMargin - lockedBalance;

    return NextResponse.json({
      success: true,
      data: {
        balance,
        equity,
        usedMargin,
        freeMargin,
        floatingProfit,
        lockedBalance,
      },
    });
  } catch (error) {
    console.error('[Assets API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '服务器错误',
      },
      { status: 500 }
    );
  }
}
