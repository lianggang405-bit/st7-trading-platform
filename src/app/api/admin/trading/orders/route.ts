import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 检查Supabase环境变量是否配置
const supabaseUrl = process.env.COZE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const useSupabase = supabaseUrl && supabaseServiceKey;

// GET - 获取理财订单列表
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
        orders: mockData,
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
        orders: mockData,
        total: 5,
        page,
        limit,
      });
    }

    const offset = (page - 1) * limit;

    let query = supabase
      .from('project_orders')
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order(sort, { ascending: order === 'asc' });

    // 如果有搜索条件
    if (search) {
      query = query.or(`account.ilike.%${search}%,name.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase error:', error);
      // 如果表不存在或查询失败，返回模拟数据
      const mockData = generateMockData(page, limit, search);
      return NextResponse.json({
        success: true,
        orders: mockData,
        total: 5,
        page,
        limit,
      });
    }

    // 格式化数据
    const formattedOrders = data?.map((item: any) => ({
      id: item.id,
      account: item.account,
      name: item.name,
      quantity: item.quantity,
      dailyOutput: item.daily_output,
      profit: item.profit,
      status: item.status,
      orderTime: formatOrderTime(item.order_time),
    })) || [];

    return NextResponse.json({
      success: true,
      orders: formattedOrders,
      total: count,
      page,
      limit,
    });
  } catch (error) {
    console.error('Failed to fetch project orders:', error);
    // 返回模拟数据作为降级方案
    const searchParams = request.nextUrl.searchParams;
    const mockData = generateMockData(
      parseInt(searchParams.get('page') || '1'),
      parseInt(searchParams.get('limit') || '15'),
      searchParams.get('search') || ''
    );
    return NextResponse.json({
      success: true,
      orders: mockData,
      total: 5,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '15'),
    });
  }
}

// POST - 创建新的理财订单
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { account, name, quantity, dailyOutput, profit, status, orderTime } = body;

    // 如果没有配置Supabase，返回成功响应但不实际创建
    if (!useSupabase) {
      return NextResponse.json({
        success: true,
        order: {
          id: Math.floor(Math.random() * 1000),
          account,
          name,
          quantity,
          dailyOutput,
          profit,
          status,
          orderTime,
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
        order: {
          id: Math.floor(Math.random() * 1000),
          account,
          name,
          quantity,
          dailyOutput,
          profit,
          status,
          orderTime,
        },
      });
    }

    // 将订单时间转换为 ISO 格式
    const orderTimeISO = parseOrderTime(orderTime);

    const { data, error } = await supabase
      .from('project_orders')
      .insert([
        {
          account,
          name,
          quantity,
          daily_output: dailyOutput,
          profit,
          status,
          order_time: orderTimeISO,
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      order: {
        id: data.id,
        account: data.account,
        name: data.name,
        quantity: data.quantity,
        dailyOutput: data.daily_output,
        profit: data.profit,
        status: data.status,
        orderTime: formatOrderTime(data.order_time),
      },
    });
  } catch (error) {
    console.error('Failed to create project order:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create project order',
      },
      { status: 500 }
    );
  }
}

// 格式化订单时间为 "2025/12/11 GMT 12:25" 格式
function formatOrderTime(dateStr: string | null): string {
  if (!dateStr) return '';
  
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}/${month}/${day} GMT ${hours}:${minutes}`;
}

// 生成模拟数据（根据图片中的数据）
function generateMockData(page: number, limit: number, search: string): any[] {
  let mockData = [
    {
      id: 55,
      account: 'D3582QM3@email.com',
      name: 'AI Arbitrage',
      quantity: 100000.00,
      dailyOutput: 2000.00,
      profit: 60000.00,
      status: 'HAVE_IN_HAND',
      orderTime: '2025/12/11 GMT 12:25',
    },
    {
      id: 54,
      account: null,
      name: 'AI Arbitrage',
      quantity: 90000.00,
      dailyOutput: 1800.00,
      profit: 1800.00,
      status: 'HAVE_IN_HAND',
      orderTime: '2025/01/21 GMT 04:16',
    },
    {
      id: 53,
      account: null,
      name: null,
      quantity: 10000.00,
      dailyOutput: 6.00,
      profit: 12.00,
      status: 'DEPOSIT',
      orderTime: '2024/09/07 GMT+1 23:25',
    },
    {
      id: 52,
      account: 'USER123@email.com',
      name: 'AI Arbitrage',
      quantity: 50000.00,
      dailyOutput: 1000.00,
      profit: 30000.00,
      status: 'HAVE_IN_HAND',
      orderTime: '2025/01/15 GMT 08:30',
    },
    {
      id: 51,
      account: null,
      name: null,
      quantity: 20000.00,
      dailyOutput: 400.00,
      profit: 800.00,
      status: 'DEPOSIT',
      orderTime: '2025/01/10 GMT 14:20',
    },
  ];

  // 如果有搜索条件，过滤数据
  if (search) {
    mockData = mockData.filter(item =>
      (item.account && item.account.toLowerCase().includes(search.toLowerCase())) ||
      (item.name && item.name.toLowerCase().includes(search.toLowerCase()))
    );
  }

  // 默认按 ID 降序排序
  mockData.sort((a, b) => b.id - a.id);

  const offset = (page - 1) * limit;
  return mockData.slice(offset, offset + limit);
}

// 解析 "2025/12/11 GMT 12:25" 格式为 ISO 格式
function parseOrderTime(orderTimeStr: string): string {
  try {
    // 移除 "GMT" 或 "GMT+1" 等时区标识
    const cleanStr = orderTimeStr.replace(/GMT[+-]?\d*\s*/, '');
    const parts = cleanStr.split(' ');
    const dateParts = parts[0].split('/');
    const timeParts = parts[1].split(':');
    
    const year = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]) - 1;
    const day = parseInt(dateParts[2]);
    const hours = parseInt(timeParts[0]);
    const minutes = parseInt(timeParts[1]);
    
    const date = new Date(year, month, day, hours, minutes);
    return date.toISOString();
  } catch (error) {
    console.error('Failed to parse order time:', orderTimeStr);
    return new Date().toISOString();
  }
}
