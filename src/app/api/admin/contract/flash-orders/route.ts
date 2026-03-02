import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
const supabase = getSupabaseClient();
// GET /api/admin/contract/flash-orders - 获取秒合约交易列表
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
      .from('flash_contract_orders')
      .select('*', { count: 'exact' });

    // 搜索条件
    if (search) {
      query = query.or(`account.ilike.%${search}%,symbol.ilike.%${search}%`);
    }

    // 排序
    query = query.order(sort, { ascending: order === 'asc' });

    // 分页
    query = query.range(offset, offset + limit - 1);

    const { data: orders, error, count } = await query;

    if (error) {
      console.error('Failed to fetch flash contract orders:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      orders: orders || [],
      total: count || 0,
      page,
      pageSize: limit
    });
  } catch (error) {
    console.error('Error in GET flash contract orders:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/contract/flash-orders - 创建秒合约订单
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      account,
      symbol,
      type,
      status = '进行中',
      quantity,
      fee,
      result = '无',
      profit = 0,
      openPrice,
      closePrice,
      duration,
      created_at
    } = body;

    if (!account || !type || !quantity) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const { data: order, error } = await supabase
      .from('flash_contract_orders')
      .insert([
        {
          account,
          symbol,
          type,
          status,
          quantity,
          fee,
          result,
          profit,
          open_price: openPrice,
          close_price: closePrice,
          duration,
          created_at: created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Failed to create flash contract order:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (error) {
    console.error('Error in POST flash contract orders:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
