import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
const supabase = getSupabaseClient();
// GET /api/admin/wallet/wire-currencies - 获取电汇币种列表
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
      .from('wire_currencies')
      .select('*', { count: 'exact' });

    // 搜索条件 - 搜索币种名称
    if (search) {
      query = query.ilike('currency_name', `%${search}%`);
    }

    // 排序
    query = query.order(sort, { ascending: order === 'asc' });

    // 分页
    query = query.range(offset, offset + limit - 1);

    const { data: currencies, error, count } = await query;

    if (error) {
      console.error('Failed to fetch wire currencies:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // 转换数据格式以匹配前端期望
    const formattedCurrencies = currencies?.map(currency => ({
      id: currency.id,
      currencyName: currency.currency_name,
      usdPrice: currency.usd_price,
    })) || [];

    return NextResponse.json({
      success: true,
      currencies: formattedCurrencies,
      total: count || 0,
      page,
      pageSize: limit
    });
  } catch (error) {
    console.error('Error in GET wire currencies:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/wallet/wire-currencies - 创建电汇币种
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      currencyName,
      usdPrice
    } = body;

    if (!currencyName || usdPrice === undefined) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const { data: currency, error } = await supabase
      .from('wire_currencies')
      .insert([
        {
          currency_name: currencyName,
          usd_price: usdPrice,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Failed to create wire currency:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, currency }, { status: 201 });
  } catch (error) {
    console.error('Error in POST wire currencies:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
