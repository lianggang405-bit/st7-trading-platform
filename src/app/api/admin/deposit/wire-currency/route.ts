import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const supabase = getSupabaseClient();

// GET - 获取电汇币种列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';
    const sortField = searchParams.get('sortField') || 'id';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const offset = (page - 1) * pageSize;

    // 构建查询
    let query = supabase
      .from('wire_currency_settings')
      .select('*', { count: 'exact' });

    // 搜索条件
    if (search) {
      query = query.or(`currency_name.ilike.%${search}%`);
    }

    // 排序
    query = query.order(sortField, { ascending: sortOrder === 'asc' });

    // 分页
    query = query.range(offset, offset + pageSize - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Failed to fetch wire currencies:', error);
      return NextResponse.json(
        {
          success: false,
          message: '获取电汇币种列表失败',
          error: error.message,
        },
        { status: 500 }
      );
    }

    // 转换数据格式
    const records = data?.map((item: any) => ({
      id: item.id,
      currencyName: item.currency_name,
      usdPrice: parseFloat(item.usd_price) || 0,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    })) || [];

    return NextResponse.json({
      success: true,
      records,
      total: count || 0,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('Failed to fetch wire currencies:', error);
    return NextResponse.json(
      {
        success: false,
        message: '获取电汇币种列表失败',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST - 创建电汇币种
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { currencyName, usdPrice } = body;

    // 验证必填字段
    if (!currencyName || currencyName.trim() === '') {
      return NextResponse.json(
        {
          success: false,
          message: '币种名称不能为空',
        },
        { status: 400 }
      );
    }

    // 检查币种是否已存在
    const { data: existing } = await supabase
      .from('wire_currency_settings')
      .select('id')
      .eq('currency_name', currencyName.trim().toUpperCase())
      .single();

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: '该币种已存在',
        },
        { status: 400 }
      );
    }

    // 创建记录
    const { data, error } = await supabase
      .from('wire_currency_settings')
      .insert({
        currency_name: currencyName.trim().toUpperCase(),
        usd_price: parseFloat(usdPrice) || 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create wire currency:', error);
      return NextResponse.json(
        {
          success: false,
          message: '创建电汇币种失败',
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '创建成功',
      data: {
        id: data.id,
        currencyName: data.currency_name,
        usdPrice: parseFloat(data.usd_price) || 0,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    });
  } catch (error) {
    console.error('Failed to create wire currency:', error);
    return NextResponse.json(
      {
        success: false,
        message: '创建电汇币种失败',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
