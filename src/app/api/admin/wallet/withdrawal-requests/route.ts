import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - 获取提币申请列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '15');
    const sortBy = searchParams.get('sortBy') || 'id';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status'); // 'SUCCESS', 'FAIL', 'PENDING', or undefined

    // 计算偏移量
    const offset = (page - 1) * pageSize;

    // 构建查询
    let query = supabase
      .from('withdrawal_requests')
      .select('*', { count: 'exact' });

    // 搜索过滤
    if (search) {
      query = query.or(`account.ilike.%${search}%,withdrawal_address.ilike.%${search}%`);
    }

    // 状态过滤
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // 排序
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // 分页
    query = query.range(offset, offset + pageSize - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching withdrawal requests:', error);
      return NextResponse.json(
        { error: 'Failed to fetch withdrawal requests' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: data || [],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    });
  } catch (error) {
    console.error('Error in GET /api/admin/wallet/withdrawal-requests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - 创建提币申请
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      account,
      currency,
      withdrawal_address,
      withdrawal_amount,
      fee,
      actual_amount,
      status,
    } = body;

    // 验证必填字段
    if (!account || !currency || !withdrawal_address || withdrawal_amount === undefined || actual_amount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: account, currency, withdrawal_address, withdrawal_amount, actual_amount' },
        { status: 400 }
      );
    }

    // 插入数据
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .insert([
        {
          account,
          currency,
          withdrawal_address,
          withdrawal_amount,
          fee: fee !== undefined ? fee : 0,
          actual_amount,
          status: status || 'PENDING',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating withdrawal request:', error);
      return NextResponse.json(
        { error: 'Failed to create withdrawal request' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/admin/wallet/withdrawal-requests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
