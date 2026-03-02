import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/storage/database/supabase-admin-client';
const supabase = getSupabaseAdminClient();
// GET - 获取交易对列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const sort = searchParams.get('sort') || 'id';
    const order = searchParams.get('order') || 'desc';
    const search = searchParams.get('search') || '';

    const offset = (page - 1) * limit;

    let query = supabase
      .from('trading_pairs')
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order(sort, { ascending: order === 'asc' });

    // 如果有搜索条件
    if (search) {
      query = query.or(`symbol.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    // 格式化数据
    const formattedPairs = data?.map((pair: any) => ({
      id: pair.id,
      currencyId: pair.currency_id,
      symbol: pair.symbol,
      isVisible: pair.is_visible !== false,
      minOrderSize: pair.min_order_size || 0,
      maxOrderSize: pair.max_order_size || 999999,
      contractFee: pair.contract_fee || 1.0,
      createdAt: pair.created_at ? new Date(pair.created_at).toLocaleString('zh-CN') : '—',
    })) || [];

    return NextResponse.json({
      success: true,
      pairs: formattedPairs,
      total: count,
      page,
      limit,
    });
  } catch (error) {
    console.error('Failed to fetch trading pairs:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch trading pairs',
      },
      { status: 500 }
    );
  }
}
