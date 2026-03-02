import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
const supabase = getSupabaseClient();
// GET /api/admin/wallet/crypto-addresses - 获取数字货币地址列表
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
      .from('crypto_addresses')
      .select('*', { count: 'exact' });

    // 搜索条件 - 搜索品种、协议、地址
    if (search) {
      query = query.or(`currency.ilike.%${search}%,protocol.ilike.%${search}%,address.ilike.%${search}%`);
    }

    // 排序
    query = query.order(sort, { ascending: order === 'asc' });

    // 分页
    query = query.range(offset, offset + limit - 1);

    const { data: addresses, error, count } = await query;

    if (error) {
      console.error('Failed to fetch crypto addresses:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // 转换数据格式以匹配前端期望
    const formattedAddresses = addresses?.map(addr => ({
      id: addr.id,
      currency: addr.currency,
      protocol: addr.protocol,
      address: addr.address,
      status: addr.status,
      usdPrice: addr.usd_price,
    })) || [];

    return NextResponse.json({
      success: true,
      addresses: formattedAddresses,
      total: count || 0,
      page,
      pageSize: limit
    });
  } catch (error) {
    console.error('Error in GET crypto addresses:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/wallet/crypto-addresses - 创建数字货币地址
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      currency,
      protocol,
      address,
      usdPrice,
      status
    } = body;

    if (!currency || !protocol || !address || usdPrice === undefined) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const { data: cryptoAddress, error } = await supabase
      .from('crypto_addresses')
      .insert([
        {
          currency,
          network: protocol,
          protocol: protocol,
          address,
          usd_price: usdPrice,
          status: status || 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Failed to create crypto address:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, address: cryptoAddress }, { status: 201 });
  } catch (error) {
    console.error('Error in POST crypto addresses:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
