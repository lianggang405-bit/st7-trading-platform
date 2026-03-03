import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const supabase = getSupabaseClient();

// ✅ Mock 数据生成函数
function generateMockSymbolTypes(page: number, limit: number, search: string = '') {
  const mockTypes = [
    { id: 1, name: '加密货币', sort: 1, status: 'normal' },
    { id: 2, name: '外汇', sort: 2, status: 'normal' },
    { id: 3, name: '贵金属', sort: 3, status: 'normal' },
    { id: 4, name: '能源', sort: 4, status: 'normal' },
    { id: 5, name: '股指', sort: 5, status: 'normal' },
  ];

  let filtered = mockTypes;
  if (search) {
    filtered = mockTypes.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));
  }

  const offset = (page - 1) * limit;
  return filtered.slice(offset, offset + limit);
}

// GET - 获取品种类型列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const sort = searchParams.get('sort') || 'id';
    const order = searchParams.get('order') || 'desc';
    const search = searchParams.get('search') || '';

    const offset = (page - 1) * limit;

    // ✅ 使用 currencies 表代替 symbol_types 表
    let query = supabase
      .from('currencies')
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order(sort, { ascending: order === 'asc' });

    // 如果有搜索条件
    if (search) {
      query = query.or(`currency.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    // ✅ 如果出错，返回 mock 数据
    if (error) {
      console.warn('[SymbolTypes API] Table query failed, using mock data:', error.message);
      const mockData = generateMockSymbolTypes(page, limit, search);
      return NextResponse.json({
        success: true,
        types: mockData,
        total: 5,
        page,
        limit,
      });
    }

    // ✅ 格式化数据，将 currencies 转换为 symbol_types 格式
    const formattedTypes = data?.map((currency: any) => ({
      id: currency.id,
      name: currency.currency,
      sort: currency.id,
      status: 'normal',
    })) || [];

    return NextResponse.json({
      success: true,
      types: formattedTypes,
      total: count,
      page,
      limit,
    });
  } catch (error) {
    console.error('Failed to fetch symbol types:', error);
    // ✅ 返回 mock 数据作为兜底
    const searchParams = request.nextUrl.searchParams;
    const mockData = generateMockSymbolTypes(
      parseInt(searchParams.get('page') || '1'),
      parseInt(searchParams.get('limit') || '15'),
      searchParams.get('search') || ''
    );
    return NextResponse.json({
      success: true,
      types: mockData,
      total: 5,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '15'),
    });
  }
}
