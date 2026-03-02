import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
const supabase = getSupabaseClient();

// GET - 获取调控机器人列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const search = searchParams.get('search') || '';

    const offset = (page - 1) * limit;

    let query = supabase
      .from('trading_bots')
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order('id', { ascending: false });

    // 如果有搜索条件
    if (search) {
      query = query.or(`name.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    // 格式化数据
    const formattedBots = data?.map((bot: any) => ({
      id: bot.id,
      name: bot.name,
      pairId: bot.pair_id,
      floatValue: bot.float_value || 0,
    })) || [];

    return NextResponse.json({
      success: true,
      bots: formattedBots,
      total: count,
      page,
      limit,
    });
  } catch (error) {
    console.error('Failed to fetch trading bots:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch trading bots',
      },
      { status: 500 }
    );
  }
}

// POST - 创建调控机器人
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, pairId, floatValue } = body;

    // 验证必填字段
    if (!name || !pairId || floatValue === undefined || floatValue === null) {
      return NextResponse.json(
        {
          success: false,
          error: '名称、交易对和浮点值为必填项',
        },
        { status: 400 }
      );
    }

    // 检查交易对是否已经有关联的机器人
    const { data: existingBot, error: checkError } = await supabase
      .from('trading_bots')
      .select('*')
      .eq('pair_id', pairId)
      .single();

    if (existingBot && !checkError) {
      return NextResponse.json(
        {
          success: false,
          error: '该交易对已经存在调控机器人',
        },
        { status: 400 }
      );
    }

    // 创建调控机器人
    const { data, error } = await supabase
      .from('trading_bots')
      .insert([
        {
          name,
          pair_id: pairId,
          float_value: floatValue,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        name: data.name,
        pairId: data.pair_id,
        floatValue: data.float_value,
      },
    });
  } catch (error) {
    console.error('Failed to create trading bot:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create trading bot',
      },
      { status: 500 }
    );
  }
}
