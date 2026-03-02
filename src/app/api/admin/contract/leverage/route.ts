import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 检查Supabase环境变量是否配置
const supabaseUrl = process.env.COZE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const useSupabase = supabaseUrl && supabaseServiceKey;

// GET - 获取倍数设置列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const sort = searchParams.get('sort') || 'id';
    const order = searchParams.get('order') || 'desc';
    const search = searchParams.get('search') || '';

    // 如果没有配置Supabase，直接返回模拟数据
    if (!useSupabase) {
      const mockData = generateMockData(page, limit, search);
      return NextResponse.json({
        success: true,
        settings: mockData,
        total: 11,
        page,
        limit,
      });
    }

    // 尝试导入和初始化Supabase
    let supabase;
    try {
      const { createClient } = await import('@supabase/supabase-js');
      supabase = getSupabaseClient();
    } catch (error) {
      console.error('Failed to initialize Supabase:', error);
      const mockData = generateMockData(page, limit, search);
      return NextResponse.json({
        success: true,
        settings: mockData,
        total: 11,
        page,
        limit,
      });
    }

    const offset = (page - 1) * limit;

    let query = supabase
      .from('leverage_settings')
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order(sort, { ascending: order === 'asc' });

    // 如果有搜索条件
    if (search) {
      query = query.or(`type.ilike.%${search}%,symbol.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase error:', error);
      // 如果表不存在或查询失败，返回模拟数据
      const mockData = generateMockData(page, limit, search);
      return NextResponse.json({
        success: true,
        settings: mockData,
        total: 11,
        page,
        limit,
      });
    }

    // 格式化数据
    const formattedSettings = data?.map((item: any) => ({
      id: item.id,
      type: item.type,
      value: item.value,
      symbol: item.symbol,
    })) || [];

    return NextResponse.json({
      success: true,
      settings: formattedSettings,
      total: count,
      page,
      limit,
    });
  } catch (error) {
    console.error('Failed to fetch leverage settings:', error);
    // 返回模拟数据作为降级方案
    const searchParams = request.nextUrl.searchParams;
    const mockData = generateMockData(
      parseInt(searchParams.get('page') || '1'),
      parseInt(searchParams.get('limit') || '15'),
      searchParams.get('search') || ''
    );
    return NextResponse.json({
      success: true,
      settings: mockData,
      total: 11,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '15'),
    });
  }
}

// POST - 创建新的倍数设置
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, value, symbol } = body;

    // 如果没有配置Supabase，返回成功响应但不实际创建
    if (!useSupabase) {
      return NextResponse.json({
        success: true,
        setting: {
          id: Math.floor(Math.random() * 1000),
          type,
          value,
          symbol,
        },
      });
    }

    // 尝试导入和初始化Supabase
    let supabase;
    try {
      const { createClient } = await import('@supabase/supabase-js');
      supabase = getSupabaseClient();
    } catch (error) {
      console.error('Failed to initialize Supabase:', error);
      return NextResponse.json({
        success: true,
        setting: {
          id: Math.floor(Math.random() * 1000),
          type,
          value,
          symbol,
        },
      });
    }

    const { data, error } = await supabase
      .from('leverage_settings')
      .insert([
        {
          type,
          value,
          symbol,
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      setting: {
        id: data.id,
        type: data.type,
        value: data.value,
        symbol: data.symbol,
      },
    });
  } catch (error) {
    console.error('Failed to create leverage setting:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create leverage setting',
      },
      { status: 500 }
    );
  }
}

// 生成模拟数据（根据图片中的数据）
function generateMockData(page: number, limit: number, search: string): any[] {
  let mockData = [
    // ETH 倍数
    { id: 376, type: '倍数', value: 500, symbol: 'ETH' },
    { id: 375, type: '倍数', value: 200, symbol: 'ETH' },
    { id: 374, type: '倍数', value: 100, symbol: 'ETH' },
    // BTC 倍数
    { id: 373, type: '倍数', value: 500, symbol: 'BTC' },
    { id: 371, type: '倍数', value: 200, symbol: 'BTC' },
    { id: 370, type: '倍数', value: 100, symbol: 'BTC' },
    // XAUUSD 倍数
    { id: 369, type: '倍数', value: 500, symbol: 'XAUUSD' },
    { id: 368, type: '倍数', value: 400, symbol: 'XAUUSD' },
    { id: 367, type: '倍数', value: 300, symbol: 'XAUUSD' },
    { id: 366, type: '倍数', value: 200, symbol: 'XAUUSD' },
    { id: 365, type: '倍数', value: 100, symbol: 'XAUUSD' },
  ];

  // 如果有搜索条件，过滤数据
  if (search) {
    mockData = mockData.filter(item =>
      item.type.toLowerCase().includes(search.toLowerCase()) ||
      item.symbol.toLowerCase().includes(search.toLowerCase())
    );
  }

  // 默认按 ID 降序排序
  const sorted = [...mockData].sort((a, b) => b.id - a.id);

  const offset = (page - 1) * limit;
  return sorted.slice(offset, offset + limit);
}
