import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
const supabase = getSupabaseClient();
// GET /api/admin/contract/demo-orders - 获取模拟合约订单列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const sort = searchParams.get('sort') || 'id';
    const order = searchParams.get('order') || 'desc';
    const search = searchParams.get('search') || '';

    const offset = (page - 1) * limit;

    // 构建查询
    let query = supabase
      .from('demo_contract_orders')
      .select('*, users!inner(email)', { count: 'exact' });

    // 搜索条件
    if (search) {
      query = query.or(`users.email.ilike.%${search}%,symbol.ilike.%${search}%`);
    }

    // 排序
    query = query.order(sort, { ascending: order === 'asc' });

    // 分页
    query = query.range(offset, offset + limit - 1);

    const { data: orders, error, count } = await query;

    if (error) {
      console.error('Failed to fetch demo contract orders:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // 格式化数据
    const formattedOrders = (orders || []).map((item: any) => {
      // 映射数据库值到前端显示值
      const statusMap: Record<string, string> = {
        'open': '进行中',
        'closed': '已平仓',
        'canceled': '已取消',
      };

      return {
        id: item.id,
        account: item.users?.email || `User ${item.user_id}`,
        symbol: item.symbol,
        tradeType: item.side === 'long' ? '买入' : '卖出',
        status: statusMap[item.status] || item.status,
        originalPrice: item.price || 0,
        openPrice: item.entry_price || 0,
        currentPrice: item.exit_price || item.price || 0,
        takeProfit: item.take_profit || 0,
        stopLoss: item.stop_loss || 0,
        lots: item.amount || 0,
        leverage: item.leverage || 1,
        initialMargin: item.initial_capital || 0,
        availableMargin: item.current_capital || 0,
        fee: item.fee || 0,
        profit: item.pnl || 0,
        createdAt: item.created_at,
        closedAt: item.closed_at,
        completedAt: item.closed_at,
      };
    });

    return NextResponse.json({
      success: true,
      orders: formattedOrders,
      total: count || 0,
      page,
      pageSize: limit
    });
  } catch (error) {
    console.error('Error in GET demo contract orders:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/contract/demo-orders - 创建模拟合约订单
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      account,
      symbol = 'BTCUSD',
      tradeType = '买入',
      status = '进行中',
      originalPrice = 50000,
      openPrice = 50000,
      currentPrice = 50000,
      takeProfit = 55000,
      stopLoss = 45000,
      lots = 0.1,
      leverage = 10,
      initialMargin = 500,
      availableMargin = 100000,
      fee = 0.001,
      profit = 0
    } = body;

    // 查找或创建用户（这里简化处理，使用 account 邮箱查询 user_id）
    let userId = 1; // 默认用户 ID

    // 映射前端值到数据库值
    const side = tradeType === '买入' ? 'long' : 'short';
    const statusMap: Record<string, string> = {
      '进行中': 'open',
      '已平仓': 'closed',
      '已取消': 'canceled',
    };
    const dbStatus = statusMap[status] || 'open';

    const { data: order, error } = await supabase
      .from('demo_contract_orders')
      .insert([
        {
          user_id: userId,
          symbol,
          side,
          type: 'market',
          price: originalPrice,
          amount: lots,
          leverage,
          stop_loss: stopLoss,
          take_profit: takeProfit,
          status: dbStatus,
          entry_price: openPrice,
          exit_price: currentPrice,
          fee,
          pnl: profit,
          pnl_percentage: profit > 0 ? (profit / initialMargin) * 100 : 0,
          initial_capital: initialMargin,
          current_capital: availableMargin,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Failed to create demo contract order:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (error) {
    console.error('Error in POST demo contract orders:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
