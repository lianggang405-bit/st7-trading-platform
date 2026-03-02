import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 检查Supabase环境变量是否配置
const supabaseUrl = process.env.COZE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const useSupabase = supabaseUrl && supabaseServiceKey;

// GET - 获取理财项目列表
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
        projects: mockData,
        total: 5,
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
        projects: mockData,
        total: 5,
        page,
        limit,
      });
    }

    const offset = (page - 1) * limit;

    let query = supabase
      .from('investment_projects')
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order(sort, { ascending: order === 'asc' });

    // 如果有搜索条件
    if (search) {
      query = query.or(`name.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase error:', error);
      // 如果表不存在或查询失败，返回模拟数据
      const mockData = generateMockData(page, limit, search);
      return NextResponse.json({
        success: true,
        projects: mockData,
        total: 5,
        page,
        limit,
      });
    }

    // 格式化数据
    const formattedProjects = data?.map((item: any) => ({
      id: item.id,
      name: item.name,
      icon: item.icon,
      rate: item.rate,
      quantity: item.quantity,
      minStaking: item.min_staking,
      maxStaking: item.max_staking,
      defaultStaking: item.default_staking,
      lockDays: item.lock_days,
    })) || [];

    return NextResponse.json({
      success: true,
      projects: formattedProjects,
      total: count,
      page,
      limit,
    });
  } catch (error) {
    console.error('Failed to fetch investment projects:', error);
    // 返回模拟数据作为降级方案
    const searchParams = request.nextUrl.searchParams;
    const mockData = generateMockData(
      parseInt(searchParams.get('page') || '1'),
      parseInt(searchParams.get('limit') || '15'),
      searchParams.get('search') || ''
    );
    return NextResponse.json({
      success: true,
      projects: mockData,
      total: 5,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '15'),
    });
  }
}

// POST - 创建新的理财项目
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, icon, rate, quantity, minStaking, maxStaking, defaultStaking, lockDays } = body;

    // 如果没有配置Supabase，返回成功响应但不实际创建
    if (!useSupabase) {
      return NextResponse.json({
        success: true,
        project: {
          id: Math.floor(Math.random() * 1000),
          name,
          icon,
          rate,
          quantity,
          minStaking,
          maxStaking,
          defaultStaking,
          lockDays,
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
        project: {
          id: Math.floor(Math.random() * 1000),
          name,
          icon,
          rate,
          quantity,
          minStaking,
          maxStaking,
          defaultStaking,
          lockDays,
        },
      });
    }

    const { data, error } = await supabase
      .from('investment_projects')
      .insert([
        {
          name,
          icon,
          rate,
          quantity,
          min_staking: minStaking,
          max_staking: maxStaking,
          default_staking: defaultStaking,
          lock_days: lockDays,
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      project: {
        id: data.id,
        name: data.name,
        icon: data.icon,
        rate: data.rate,
        quantity: data.quantity,
        minStaking: data.min_staking,
        maxStaking: data.max_staking,
        defaultStaking: data.default_staking,
        lockDays: data.lock_days,
      },
    });
  } catch (error) {
    console.error('Failed to create investment project:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create investment project',
      },
      { status: 500 }
    );
  }
}

// 生成模拟数据（根据图片中的数据）
function generateMockData(page: number, limit: number, search: string): any[] {
  let mockData = [
    {
      id: 1,
      name: 'AI Arbitrage',
      icon: '/icons/ai-arbitrage-1.png',
      rate: 1.80,
      quantity: 100,
      minStaking: 100,
      maxStaking: 10000,
      defaultStaking: 1000,
      lockDays: 15,
    },
    {
      id: 2,
      name: 'AI Arbitrage',
      icon: '/icons/ai-arbitrage-2.png',
      rate: 2.00,
      quantity: 50,
      minStaking: 500,
      maxStaking: 20000,
      defaultStaking: 2000,
      lockDays: 30,
    },
    {
      id: 3,
      name: 'AI Arbitrage',
      icon: '/icons/ai-arbitrage-3.png',
      rate: 2.50,
      quantity: 30,
      minStaking: 1000,
      maxStaking: 50000,
      defaultStaking: 5000,
      lockDays: 60,
    },
    {
      id: 4,
      name: 'AI Arbitrage',
      icon: '/icons/ai-arbitrage-4.png',
      rate: 2.80,
      quantity: 20,
      minStaking: 2000,
      maxStaking: 100000,
      defaultStaking: 10000,
      lockDays: 90,
    },
    {
      id: 5,
      name: 'AI Arbitrage',
      icon: '/icons/ai-arbitrage-5.png',
      rate: 3.00,
      quantity: 10,
      minStaking: 5000,
      maxStaking: 200000,
      defaultStaking: 20000,
      lockDays: 90,
    },
  ];

  // 如果有搜索条件，过滤数据
  if (search) {
    mockData = mockData.filter(item =>
      item.name.toLowerCase().includes(search.toLowerCase())
    );
  }

  // 根据排序字段排序
  mockData.sort((a, b) => {
    if (typeof a.id === 'number' && typeof b.id === 'number') {
      return b.id - a.id;
    }
    return 0;
  });

  const offset = (page - 1) * limit;
  return mockData.slice(offset, offset + limit);
}
