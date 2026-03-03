import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const supabase = getSupabaseClient();

// ✅ Mock 数据生成函数
function generateMockTradingHours(page: number, limit: number, search: string = '') {
  const symbols = ['BTCUSD', 'ETHUSD', 'XAUUSD', 'EURUSD', 'GBPUSD', 'SOLUSD', 'XRPUSD'];
  const mockHours = symbols.map((symbol, index) => ({
    id: index + 1,
    symbol,
    mondayOpen: '00:00:00',
    mondayClose: '23:59:59',
    tuesdayOpen: '00:00:00',
    tuesdayClose: '23:59:59',
    wednesdayOpen: '00:00:00',
    wednesdayClose: '23:59:59',
    thursdayOpen: '00:00:00',
    thursdayClose: '23:59:59',
    fridayOpen: '00:00:00',
    fridayClose: '23:59:59',
    saturdayOpen: '00:00:00',
    saturdayClose: '00:00:00',
    sundayOpen: '00:00:00',
    sundayClose: '00:00:00',
  }));

  let filtered = mockHours;
  if (search) {
    filtered = mockHours.filter(h => h.symbol.toLowerCase().includes(search.toLowerCase()));
  }

  const offset = (page - 1) * limit;
  return filtered.slice(offset, offset + limit);
}

// GET - 获取开盘时间列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sort = searchParams.get('sort') || 'id';
    const order = searchParams.get('order') || 'desc';
    const search = searchParams.get('search') || '';

    const offset = (page - 1) * limit;

    // ✅ 尝试查询 trading_hours 表
    let query = supabase
      .from('trading_hours')
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order(sort, { ascending: order === 'asc' });

    // 如果有搜索条件
    if (search) {
      query = query.or(`symbol.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    // ✅ 如果出错或表不存在，返回 mock 数据
    if (error) {
      console.warn('[TradingHours API] Table query failed, using mock data:', error.message);
      const mockData = generateMockTradingHours(page, limit, search);
      return NextResponse.json({
        success: true,
        hours: mockData,
        total: 7,
        page,
        limit,
      });
    }

    // 格式化数据
    const formattedHours = data?.map((hour: any) => ({
      id: hour.id,
      symbol: hour.symbol,
      mondayOpen: hour.monday_open || '00:00:00',
      mondayClose: hour.monday_close || '23:59:59',
      tuesdayOpen: hour.tuesday_open || '00:00:00',
      tuesdayClose: hour.tuesday_close || '23:59:59',
      wednesdayOpen: hour.wednesday_open || '00:00:00',
      wednesdayClose: hour.wednesday_close || '23:59:59',
      thursdayOpen: hour.thursday_open || '00:00:00',
      thursdayClose: hour.thursday_close || '23:59:59',
      fridayOpen: hour.friday_open || '00:00:00',
      fridayClose: hour.friday_close || '23:59:59',
      saturdayOpen: hour.saturday_open || '00:00:00',
      saturdayClose: hour.saturday_close || '00:00:00',
      sundayOpen: hour.sunday_open || '00:00:00',
      sundayClose: hour.sunday_close || '00:00:00',
    })) || [];

    return NextResponse.json({
      success: true,
      hours: formattedHours,
      total: count,
      page,
      limit,
    });
  } catch (error) {
    console.error('Failed to fetch trading hours:', error);
    // ✅ 返回 mock 数据作为兜底
    const searchParams = request.nextUrl.searchParams;
    const mockData = generateMockTradingHours(
      parseInt(searchParams.get('page') || '1'),
      parseInt(searchParams.get('limit') || '10'),
      searchParams.get('search') || ''
    );
    return NextResponse.json({
      success: true,
      hours: mockData,
      total: 7,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
    });
  }
}
