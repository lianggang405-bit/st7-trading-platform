import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
const supabase = getSupabaseClient();
// GET /api/admin/contract/seconds-config - 获取秒数设置列表
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
      .from('seconds_config')
      .select('*', { count: 'exact' });

    // 搜索条件
    if (search) {
      query = query.or(`seconds.ilike.%${search}%`);
    }

    // 排序
    query = query.order(sort, { ascending: order === 'asc' });

    // 分页
    query = query.range(offset, offset + limit - 1);

    const { data: configs, error, count } = await query;

    if (error) {
      console.error('Failed to fetch seconds config:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      configs: configs || [],
      total: count || 0,
      page,
      pageSize: limit
    });
  } catch (error) {
    console.error('Error in GET seconds config:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/contract/seconds-config - 创建秒数设置
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      seconds,
      status = 'normal',
      profitRate,
      maxAmount,
      minAmount
    } = body;

    if (!seconds || profitRate === undefined || maxAmount === undefined || minAmount === undefined) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const { data: config, error } = await supabase
      .from('seconds_config')
      .insert([
        {
          seconds,
          status,
          profit_rate: profitRate,
          max_amount: maxAmount,
          min_amount: minAmount,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Failed to create seconds config:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, config }, { status: 201 });
  } catch (error) {
    console.error('Error in POST seconds config:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
