import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - 获取支持法币列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '15');
    const sortBy = searchParams.get('sortBy') || 'id';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const search = searchParams.get('search') || '';
    const isVisible = searchParams.get('isVisible'); // 'true', 'false', or undefined

    // 计算偏移量
    const offset = (page - 1) * pageSize;

    // 构建查询
    let query = supabase
      .from('supported_fiat_currencies')
      .select('*', { count: 'exact' });

    // 搜索过滤
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    // 是否展示过滤
    if (isVisible !== null && isVisible !== undefined && isVisible !== '') {
      query = query.eq('is_visible', isVisible === 'true');
    }

    // 排序
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // 分页
    query = query.range(offset, offset + pageSize - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching supported fiat currencies:', error);
      return NextResponse.json(
        { error: 'Failed to fetch supported fiat currencies' },
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
    console.error('Error in GET /api/admin/wallet/supported-fiat-currencies:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - 创建支持法币
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      usd_rate,
      withdrawal_fee,
      min_withdrawal,
      max_withdrawal,
      is_visible,
    } = body;

    // 验证必填字段
    if (!name || min_withdrawal === undefined || max_withdrawal === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: name, min_withdrawal, max_withdrawal' },
        { status: 400 }
      );
    }

    // 插入数据
    const { data, error } = await supabase
      .from('supported_fiat_currencies')
      .insert([
        {
          name,
          usd_rate: usd_rate !== undefined ? usd_rate : 1,
          withdrawal_fee: withdrawal_fee !== undefined ? withdrawal_fee : 0,
          min_withdrawal,
          max_withdrawal,
          is_visible: is_visible !== undefined ? is_visible : true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating supported fiat currency:', error);
      return NextResponse.json(
        { error: 'Failed to create supported fiat currency' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/admin/wallet/supported-fiat-currencies:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
