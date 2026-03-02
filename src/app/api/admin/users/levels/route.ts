import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
const supabase = getSupabaseClient();
// GET - 获取用户等级列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sort = searchParams.get('sort') || 'level';
    const order = searchParams.get('order') || 'asc';
    const search = searchParams.get('search') || '';

    let query = supabase
      .from('user_levels')
      .select('*')
      .order(sort, { ascending: order === 'asc' });

    // 如果有搜索条件
    if (search) {
      query = query.or(`name.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // 格式化数据
    const formattedLevels = data?.map((level: any) => ({
      id: level.id,
      name: level.name,
      level: level.level,
      minDeposit: level.min_deposit || 0,
      maxDeposit: level.max_deposit || 0,
      tradingFee: level.trading_fee || 0,
      withdrawalFee: level.withdrawal_fee || 0,
      privileges: level.privileges || [],
      status: level.status || 'active',
      createdAt: new Date(level.created_at).toLocaleString('zh-CN'),
    })) || [];

    return NextResponse.json({
      success: true,
      levels: formattedLevels,
    });
  } catch (error) {
    console.error('Failed to fetch user levels:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch user levels',
      },
      { status: 500 }
    );
  }
}
