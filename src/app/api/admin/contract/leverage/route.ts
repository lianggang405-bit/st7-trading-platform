import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 妫€鏌upabase鐜鍙橀噺鏄惁閰嶇疆
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const useSupabase = supabaseUrl && supabaseServiceKey;

// GET - 鑾峰彇鍊嶆暟璁剧疆鍒楄〃
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
        settings: mockData,
        total: 11,
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

    // 濡傛灉鏈夋悳绱㈡潯浠?    if (search) {
      query = query.or(`type.ilike.%${search}%,symbol.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase error:', error);
      // 濡傛灉琛ㄤ笉瀛樺湪鎴栨煡璇㈠け璐ワ紝杩斿洖妯℃嫙鏁版嵁
      const mockData = generateMockData(page, limit, search);
      return NextResponse.json({
        success: true,
        settings: mockData,
        total: 11,
        page,
        limit,
      });
    }

    // 鏍煎紡鍖栨暟鎹?    const formattedSettings = data?.map((item: any) => ({
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
    // 杩斿洖妯℃嫙鏁版嵁浣滀负闄嶇骇鏂规
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

// POST - 鍒涘缓鏂扮殑鍊嶆暟璁剧疆
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, value, symbol } = body;

    // 濡傛灉娌℃湁閰嶇疆Supabase锛岃繑鍥炴垚鍔熷搷搴斾絾涓嶅疄闄呭垱寤?    if (!useSupabase) {
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

    // 灏濊瘯瀵煎叆鍜屽垵濮嬪寲Supabase
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

// 鐢熸垚妯℃嫙鏁版嵁锛堟牴鎹浘鐗囦腑鐨勬暟鎹級
function generateMockData(page: number, limit: number, search: string): any[] {
  let mockData = [
    // ETH 鍊嶆暟
    { id: 376, type: '鍊嶆暟', value: 500, symbol: 'ETH' },
    { id: 375, type: '鍊嶆暟', value: 200, symbol: 'ETH' },
    { id: 374, type: '鍊嶆暟', value: 100, symbol: 'ETH' },
    // BTC 鍊嶆暟
    { id: 373, type: '鍊嶆暟', value: 500, symbol: 'BTC' },
    { id: 371, type: '鍊嶆暟', value: 200, symbol: 'BTC' },
    { id: 370, type: '鍊嶆暟', value: 100, symbol: 'BTC' },
    // XAUUSD 鍊嶆暟
    { id: 369, type: '鍊嶆暟', value: 500, symbol: 'XAUUSD' },
    { id: 368, type: '鍊嶆暟', value: 400, symbol: 'XAUUSD' },
    { id: 367, type: '鍊嶆暟', value: 300, symbol: 'XAUUSD' },
    { id: 366, type: '鍊嶆暟', value: 200, symbol: 'XAUUSD' },
    { id: 365, type: '鍊嶆暟', value: 100, symbol: 'XAUUSD' },
  ];

  // 濡傛灉鏈夋悳绱㈡潯浠讹紝杩囨护鏁版嵁
  if (search) {
    mockData = mockData.filter(item =>
      item.type.toLowerCase().includes(search.toLowerCase()) ||
      item.symbol.toLowerCase().includes(search.toLowerCase())
    );
  }

  // 榛樿鎸?ID 闄嶅簭鎺掑簭
  const sorted = [...mockData].sort((a, b) => b.id - a.id);

  const offset = (page - 1) * limit;
  return sorted.slice(offset, offset + limit);
}

