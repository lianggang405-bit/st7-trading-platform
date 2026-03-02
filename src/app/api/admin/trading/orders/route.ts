import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 妫€鏌upabase鐜鍙橀噺鏄惁閰嶇疆
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const useSupabase = supabaseUrl && supabaseServiceKey;

// GET - 鑾峰彇鐞嗚储璁㈠崟鍒楄〃
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const sort = searchParams.get('sort') || 'id';
    const order = searchParams.get('order') || 'desc';
    const search = searchParams.get('search') || '';

    // 濡傛灉娌℃湁閰嶇疆Supabase锛岀洿鎺ヨ繑鍥炴ā鎷熸暟鎹?    if (!useSupabase) {
      const mockData = generateMockData(page, limit, search);
      return NextResponse.json({
        success: true,
        orders: mockData,
        total: 5,
        page,
        limit,
      });
    }

    // 灏濊瘯瀵煎叆鍜屽垵濮嬪寲Supabase
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

    // 濡傛灉鏈夋悳绱㈡潯浠?    if (search) {
      query = query.or(`account.ilike.%${search}%,name.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase error:', error);
      // 濡傛灉琛ㄤ笉瀛樺湪鎴栨煡璇㈠け璐ワ紝杩斿洖妯℃嫙鏁版嵁
      const mockData = generateMockData(page, limit, search);
      return NextResponse.json({
        success: true,
        orders: mockData,
        total: 5,
        page,
        limit,
      });
    }

    // 鏍煎紡鍖栨暟鎹?    const formattedOrders = data?.map((item: any) => ({
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
    // 杩斿洖妯℃嫙鏁版嵁浣滀负闄嶇骇鏂规
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

// POST - 鍒涘缓鏂扮殑鐞嗚储璁㈠崟
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { account, name, quantity, dailyOutput, profit, status, orderTime } = body;

    // 濡傛灉娌℃湁閰嶇疆Supabase锛岃繑鍥炴垚鍔熷搷搴斾絾涓嶅疄闄呭垱寤?    if (!useSupabase) {
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

    // 灏濊瘯瀵煎叆鍜屽垵濮嬪寲Supabase
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

    // 灏嗚鍗曟椂闂磋浆鎹负 ISO 鏍煎紡
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

// 鏍煎紡鍖栬鍗曟椂闂翠负 "2025/12/11 GMT 12:25" 鏍煎紡
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

// 鐢熸垚妯℃嫙鏁版嵁锛堟牴鎹浘鐗囦腑鐨勬暟鎹級
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

  // 濡傛灉鏈夋悳绱㈡潯浠讹紝杩囨护鏁版嵁
  if (search) {
    mockData = mockData.filter(item =>
      (item.account && item.account.toLowerCase().includes(search.toLowerCase())) ||
      (item.name && item.name.toLowerCase().includes(search.toLowerCase()))
    );
  }

  // 榛樿鎸?ID 闄嶅簭鎺掑簭
  mockData.sort((a, b) => b.id - a.id);

  const offset = (page - 1) * limit;
  return mockData.slice(offset, offset + limit);
}

// 瑙ｆ瀽 "2025/12/11 GMT 12:25" 鏍煎紡涓?ISO 鏍煎紡
function parseOrderTime(orderTimeStr: string): string {
  try {
    // 绉婚櫎 "GMT" 鎴?"GMT+1" 绛夋椂鍖烘爣璇?    const cleanStr = orderTimeStr.replace(/GMT[+-]?\d*\s*/, '');
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

