import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
const supabase = getSupabaseClient();
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

    let query = supabase
      .from('symbol_types')
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order(sort, { ascending: order === 'asc' });

    // 如果有搜索条件
    if (search) {
      query = query.or(`name.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    // 格式化数据
    const formattedTypes = data?.map((type: any) => ({
      id: type.id,
      name: type.name,
      sort: type.sort || 0,
      status: type.status || 'normal',
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
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch symbol types',
      },
      { status: 500 }
    );
  }
}
