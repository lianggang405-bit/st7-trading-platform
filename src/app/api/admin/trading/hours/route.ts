import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
const supabase = getSupabaseClient();
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

    if (error) {
      throw error;
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
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch trading hours',
      },
      { status: 500 }
    );
  }
}
