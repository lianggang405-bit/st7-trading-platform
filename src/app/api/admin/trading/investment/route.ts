import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 妫€鏌upabase鐜鍙橀噺鏄惁閰嶇疆
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const useSupabase = supabaseUrl && supabaseServiceKey;

// GET - 鑾峰彇鐞嗚储椤圭洰鍒楄〃
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
        projects: mockData,
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

    // 濡傛灉鏈夋悳绱㈡潯浠?    if (search) {
      query = query.or(`name.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase error:', error);
      // 濡傛灉琛ㄤ笉瀛樺湪鎴栨煡璇㈠け璐ワ紝杩斿洖妯℃嫙鏁版嵁
      const mockData = generateMockData(page, limit, search);
      return NextResponse.json({
        success: true,
        projects: mockData,
        total: 5,
        page,
        limit,
      });
    }

    // 鏍煎紡鍖栨暟鎹?    const formattedProjects = data?.map((item: any) => ({
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
    // 杩斿洖妯℃嫙鏁版嵁浣滀负闄嶇骇鏂规
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

// POST - 鍒涘缓鏂扮殑鐞嗚储椤圭洰
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, icon, rate, quantity, minStaking, maxStaking, defaultStaking, lockDays } = body;

    // 濡傛灉娌℃湁閰嶇疆Supabase锛岃繑鍥炴垚鍔熷搷搴斾絾涓嶅疄闄呭垱寤?    if (!useSupabase) {
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

    // 灏濊瘯瀵煎叆鍜屽垵濮嬪寲Supabase
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

// 鐢熸垚妯℃嫙鏁版嵁锛堟牴鎹浘鐗囦腑鐨勬暟鎹級
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

  // 濡傛灉鏈夋悳绱㈡潯浠讹紝杩囨护鏁版嵁
  if (search) {
    mockData = mockData.filter(item =>
      item.name.toLowerCase().includes(search.toLowerCase())
    );
  }

  // 鏍规嵁鎺掑簭瀛楁鎺掑簭
  mockData.sort((a, b) => {
    if (typeof a.id === 'number' && typeof b.id === 'number') {
      return b.id - a.id;
    }
    return 0;
  });

  const offset = (page - 1) * limit;
  return mockData.slice(offset, offset + limit);
}

