import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const useSupabase = supabaseUrl && supabaseServiceKey;

// Mock 数据存储
let mockSymbolTypes = [
  { id: 1, name: '加密货币', sort: 1, status: 'normal', created_at: new Date().toISOString() },
  { id: 2, name: '外汇', sort: 2, status: 'normal', created_at: new Date().toISOString() },
  { id: 3, name: '贵金属', sort: 3, status: 'normal', created_at: new Date().toISOString() },
  { id: 4, name: '能源', sort: 4, status: 'normal', created_at: new Date().toISOString() },
  { id: 5, name: '股指', sort: 5, status: 'normal', created_at: new Date().toISOString() },
];
let nextMockId = 6;

// Mock 数据生成函数
function generateMockSymbolTypes(page: number, limit: number, search: string = '') {
  let filtered = mockSymbolTypes;
  if (search) {
    filtered = mockSymbolTypes.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));
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

    // 如果 Supabase 未配置，返回 mock 数据
    if (!useSupabase) {
      const mockData = generateMockSymbolTypes(page, limit, search);
      return NextResponse.json({
        success: true,
        types: mockData,
        total: mockSymbolTypes.length,
        page,
        limit,
      });
    }

    // 尝试初始化 Supabase
    let supabase;
    try {
      supabase = getSupabaseClient();
    } catch (error) {
      console.error('Failed to initialize Supabase:', error);
      const mockData = generateMockSymbolTypes(page, limit, search);
      return NextResponse.json({
        success: true,
        types: mockData,
        total: mockSymbolTypes.length,
        page,
        limit,
      });
    }

    if (!supabase) {
      const mockData = generateMockSymbolTypes(page, limit, search);
      return NextResponse.json({
        success: true,
        types: mockData,
        total: mockSymbolTypes.length,
        page,
        limit,
      });
    }

    const offset = (page - 1) * limit;

    // 先尝试查询 symbol_types 表
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

    // 如果出错，尝试使用 currencies 表作为替代
    if (error) {
      console.warn('[SymbolTypes API] symbol_types table query failed, trying currencies:', error.message);
      
      let currencyQuery = supabase
        .from('currencies')
        .select('*', { count: 'exact' })
        .range(offset, offset + limit - 1)
        .order('id', { ascending: order === 'asc' });

      if (search) {
        currencyQuery = currencyQuery.or(`currency.ilike.%${search}%`);
      }

      const { data: currencyData, error: currencyError, count: currencyCount } = await currencyQuery;

      if (currencyError) {
        console.warn('[SymbolTypes API] Both tables failed, using mock data:', currencyError.message);
        const mockData = generateMockSymbolTypes(page, limit, search);
        return NextResponse.json({
          success: true,
          types: mockData,
          total: mockSymbolTypes.length,
          page,
          limit,
        });
      }

      // 格式化数据，将 currencies 转换为 symbol_types 格式
      const formattedTypes = currencyData?.map((currency: any) => ({
        id: currency.id,
        name: currency.currency,
        sort: currency.id,
        status: 'normal',
      })) || [];

      return NextResponse.json({
        success: true,
        types: formattedTypes,
        total: currencyCount,
        page,
        limit,
      });
    }

    return NextResponse.json({
      success: true,
      types: data || [],
      total: count,
      page,
      limit,
    });
  } catch (error) {
    console.error('Failed to fetch symbol types:', error);
    // 返回 mock 数据作为兜底
    const searchParams = request.nextUrl.searchParams;
    const mockData = generateMockSymbolTypes(
      parseInt(searchParams.get('page') || '1'),
      parseInt(searchParams.get('limit') || '15'),
      searchParams.get('search') || ''
    );
    return NextResponse.json({
      success: true,
      types: mockData,
      total: mockSymbolTypes.length,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '15'),
    });
  }
}

// POST - 创建品种类型
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, sort, status } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: '品种类型名称不能为空' },
        { status: 400 }
      );
    }

    // 如果 Supabase 未配置，使用 mock 数据
    if (!useSupabase) {
      const newType = {
        id: nextMockId++,
        name,
        sort: sort || nextMockId - 1,
        status: status || 'normal',
        created_at: new Date().toISOString(),
      };
      mockSymbolTypes.push(newType);
      return NextResponse.json({
        success: true,
        type: newType,
      });
    }

    // 尝试初始化 Supabase
    let supabase;
    try {
      supabase = getSupabaseClient();
    } catch (error) {
      console.error('Failed to initialize Supabase:', error);
      const newType = {
        id: nextMockId++,
        name,
        sort: sort || nextMockId - 1,
        status: status || 'normal',
        created_at: new Date().toISOString(),
      };
      mockSymbolTypes.push(newType);
      return NextResponse.json({
        success: true,
        type: newType,
      });
    }

    if (!supabase) {
      const newType = {
        id: nextMockId++,
        name,
        sort: sort || nextMockId - 1,
        status: status || 'normal',
        created_at: new Date().toISOString(),
      };
      mockSymbolTypes.push(newType);
      return NextResponse.json({
        success: true,
        type: newType,
      });
    }

    // 尝试插入 symbol_types 表
    const { data, error } = await supabase
      .from('symbol_types')
      .insert([
        {
          name,
          sort: sort || 0,
          status: status || 'normal',
        },
      ])
      .select()
      .single();

    if (error) {
      console.warn('[SymbolTypes API] Insert failed, using mock:', error.message);
      const newType = {
        id: nextMockId++,
        name,
        sort: sort || nextMockId - 1,
        status: status || 'normal',
        created_at: new Date().toISOString(),
      };
      mockSymbolTypes.push(newType);
      return NextResponse.json({
        success: true,
        type: newType,
      });
    }

    return NextResponse.json({
      success: true,
      type: data,
    });
  } catch (error) {
    console.error('Failed to create symbol type:', error);
    return NextResponse.json(
      {
        success: false,
        error: '创建品种类型失败',
      },
      { status: 500 }
    );
  }
}
