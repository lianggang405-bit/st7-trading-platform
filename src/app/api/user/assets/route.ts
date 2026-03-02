import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/storage/database/supabase-admin-client';
import { getBatchRealPrices } from '@/lib/market-data-source';

// GET - 获取用户资产信息
export async function GET(request: NextRequest) {
  const supabase = getSupabaseAdminClient();
  
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
    
    // 检查是否为模拟账户
    const isDemo = token.includes('demo');

    // 处理模拟账户逻辑
    if (isDemo) {
      let userEmail = '';
      const demoMatch = token.match(/^token_demo_(.+)_(\d+)$/);
      if (demoMatch) {
        userEmail = demoMatch[1];
      }

      // 1. 尝试从数据库查找持久化的模拟账户
      const { data: dbDemoUser } = await supabase
        .from('users')
        .select('id, balance')
        .eq('email', userEmail)
        .eq('is_demo', true)
        .single();

      if (dbDemoUser) {
        const balance = dbDemoUser.balance;

        // 查询模拟账户的持仓信息（和真实账户一样）
        const { data: positions } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', dbDemoUser.id)
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

        const equity = balance + floatingProfit;
        const freeMargin = balance - usedMargin;
        const lockedBalance = 0;

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
      }

      // 2. 如果数据库中没找到，尝试从内存查找 (兼容旧逻辑)
      const { findAccountByEmail } = await import('@/lib/demo-account-storage');
      
      const demoUser = findAccountByEmail(userEmail);

      if (!demoUser) {
        // 如果都没找到，但因为是 demo token，我们可以尝试返回默认数据或创建一个临时的
        // 这里保持原逻辑返回 404，或者可以考虑返回默认 100000
        return NextResponse.json(
          {
            success: false,
            error: '模拟账户不存在',
          },
          { status: 404 }
        );
      }

      // 模拟账户资产信息 (暂不计算持仓盈亏，直接返回余额)
      // 如果需要更精确的模拟，需要将模拟订单也持久化存储
      const balance = demoUser.balance;
      const equity = balance; // 简化处理：权益 = 余额
      const usedMargin = 0;   // 简化处理
      const freeMargin = balance;
      const floatingProfit = 0;
      const lockedBalance = 0;

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
    }

    // 真实账户逻辑
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
