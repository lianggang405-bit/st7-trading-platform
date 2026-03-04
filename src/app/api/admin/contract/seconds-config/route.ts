import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// Check if Supabase environment variables are configured
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const useSupabase = supabaseUrl && supabaseServiceKey;

// Mock data for seconds config
const mockConfigs = [
  { id: 1, seconds: 30, status: 'normal', profit_rate: 0.85, max_amount: 10000, min_amount: 10 },
  { id: 2, seconds: 60, status: 'normal', profit_rate: 0.88, max_amount: 10000, min_amount: 10 },
  { id: 3, seconds: 180, status: 'normal', profit_rate: 0.90, max_amount: 10000, min_amount: 10 },
  { id: 4, seconds: 300, status: 'normal', profit_rate: 0.92, max_amount: 10000, min_amount: 10 },
  { id: 5, seconds: 600, status: 'normal', profit_rate: 0.95, max_amount: 10000, min_amount: 10 },
];

// GET /api/admin/contract/seconds-config - 获取秒数设置列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const sort = searchParams.get('sort') || 'id';
    const order = searchParams.get('order') || 'desc';
    const search = searchParams.get('search') || '';

    // If Supabase is not configured, return mock data
    if (!useSupabase) {
      const result = generateMockData(page, limit, search, sort, order);
      return NextResponse.json({
        success: true,
        configs: result.configs,
        total: result.total,
        page,
        pageSize: limit
      });
    }

    // Try to import and initialize Supabase
    let supabase;
    try {
      supabase = getSupabaseClient();
    } catch (error) {
      console.error('Failed to initialize Supabase:', error);
      const result = generateMockData(page, limit, search, sort, order);
      return NextResponse.json({
        success: true,
        configs: result.configs,
        total: result.total,
        page,
        pageSize: limit
      });
    }

    if (!supabase) {
      const result = generateMockData(page, limit, search, sort, order);
      return NextResponse.json({
        success: true,
        configs: result.configs,
        total: result.total,
        page,
        pageSize: limit
      });
    }

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
      const result = generateMockData(page, limit, search, sort, order);
      return NextResponse.json({
        success: true,
        configs: result.configs,
        total: result.total,
        page,
        pageSize: limit
      });
    }

    // Format data
    const formattedConfigs = configs?.map((item: any) => ({
      id: item.id,
      seconds: item.seconds,
      status: item.status,
      profitRate: item.profit_rate,
      maxAmount: item.max_amount,
      minAmount: item.min_amount,
    })) || [];

    return NextResponse.json({
      success: true,
      configs: formattedConfigs,
      total: count || mockConfigs.length,
      page,
      pageSize: limit
    });
  } catch (error) {
    console.error('Error in GET seconds config:', error);
    const searchParams = request.nextUrl.searchParams;
    const result = generateMockData(
      parseInt(searchParams.get('page') || '1'),
      parseInt(searchParams.get('limit') || '15'),
      searchParams.get('search') || '',
      searchParams.get('sort') || 'id',
      searchParams.get('order') || 'desc'
    );
    return NextResponse.json({
      success: true,
      configs: result.configs,
      total: result.total,
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: parseInt(searchParams.get('limit') || '15')
    });
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

    // If Supabase is not configured, return success response with mock data
    if (!useSupabase) {
      return NextResponse.json({
        success: true,
        config: {
          id: Math.floor(Math.random() * 1000),
          seconds,
          status,
          profitRate,
          maxAmount,
          minAmount,
        },
      }, { status: 201 });
    }

    // Try to import and initialize Supabase
    let supabase;
    try {
      supabase = getSupabaseClient();
    } catch (error) {
      console.error('Failed to initialize Supabase:', error);
      return NextResponse.json({
        success: true,
        config: {
          id: Math.floor(Math.random() * 1000),
          seconds,
          status,
          profitRate,
          maxAmount,
          minAmount,
        },
      }, { status: 201 });
    }

    if (!supabase) {
      return NextResponse.json({
        success: true,
        config: {
          id: Math.floor(Math.random() * 1000),
          seconds,
          status,
          profitRate,
          maxAmount,
          minAmount,
        },
      }, { status: 201 });
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
      return NextResponse.json({
        success: true,
        config: {
          id: Math.floor(Math.random() * 1000),
          seconds,
          status,
          profitRate,
          maxAmount,
          minAmount,
        },
      }, { status: 201 });
    }

    return NextResponse.json({
      success: true,
      config: {
        id: config.id,
        seconds: config.seconds,
        status: config.status,
        profitRate: config.profit_rate,
        maxAmount: config.max_amount,
        minAmount: config.min_amount,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST seconds config:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// Generate mock data
function generateMockData(page: number, limit: number, search: string, sort: string, order: string): { configs: any[], total: number } {
  let data = [...mockConfigs];

  // Apply search
  if (search) {
    data = data.filter(item =>
      item.seconds.toString().includes(search)
    );
  }

  // Apply sorting
  data.sort((a, b) => {
    const aVal = a[sort as keyof typeof a];
    const bVal = b[sort as keyof typeof b];
    if (order === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  const total = data.length;
  const offset = (page - 1) * limit;
  const paginatedData = data.slice(offset, offset + limit);

  // Format data
  const formattedData = paginatedData.map(item => ({
    id: item.id,
    seconds: item.seconds,
    status: item.status,
    profitRate: item.profit_rate,
    maxAmount: item.max_amount,
    minAmount: item.min_amount,
  }));

  return {
    configs: formattedData,
    total,
  };
}
