import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
const supabase = getSupabaseClient();
// GET - 获取品种列表
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
      .from('symbols')
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order(sort, { ascending: order === 'asc' });

    // 如果有搜索条件
    if (search) {
      query = query.or(`name.ilike.%${search}%,alias.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    // 格式化数据
    const formattedSymbols = data?.map((symbol: any) => ({
      id: symbol.id,
      name: symbol.name,
      alias: symbol.alias,
      icon: symbol.icon,
      type: symbol.type,
      sort: symbol.sort || 0,
      isVisible: symbol.is_visible !== false,
      flashContractFee: symbol.flash_contract_fee || 1.0,
      contractSize: symbol.contract_size || 100,
    })) || [];

    return NextResponse.json({
      success: true,
      symbols: formattedSymbols,
      total: count,
      page,
      limit,
    });
  } catch (error) {
    console.error('Failed to fetch symbols:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch symbols',
      },
      { status: 500 }
    );
  }
}
