import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
const supabase = getSupabaseClient();

// PUT - 更新调控机器人
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: botId } = await params;
    const body = await request.json();
    const { name, floatValue } = body;

    // 验证必填字段
    if (!name || floatValue === undefined || floatValue === null) {
      return NextResponse.json(
        {
          success: false,
          error: '名称和浮点值为必填项',
        },
        { status: 400 }
      );
    }

    // 检查机器人是否存在
    const { data: existingBot, error: checkError } = await supabase
      .from('trading_bots')
      .select('*')
      .eq('id', botId)
      .single();

    if (checkError || !existingBot) {
      return NextResponse.json(
        {
          success: false,
          error: '调控机器人不存在',
        },
        { status: 404 }
      );
    }

    // 更新调控机器人
    const { data, error } = await supabase
      .from('trading_bots')
      .update({
        name,
        float_value: floatValue,
        updated_at: new Date().toISOString(),
      })
      .eq('id', botId)
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
    console.error('Failed to update trading bot:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update trading bot',
      },
      { status: 500 }
    );
  }
}

// DELETE - 删除调控机器人
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: botId } = await params;

    // 检查机器人是否存在
    const { data: existingBot, error: checkError } = await supabase
      .from('trading_bots')
      .select('*')
      .eq('id', botId)
      .single();

    if (checkError || !existingBot) {
      return NextResponse.json(
        {
          success: false,
          error: '调控机器人不存在',
        },
        { status: 404 }
      );
    }

    // 删除调控机器人
    const { error } = await supabase
      .from('trading_bots')
      .delete()
      .eq('id', botId);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: '调控机器人删除成功',
    });
  } catch (error) {
    console.error('Failed to delete trading bot:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete trading bot',
      },
      { status: 500 }
    );
  }
}

// GET - 获取单个调控机器人详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: botId } = await params;

    const { data, error } = await supabase
      .from('trading_bots')
      .select('*')
      .eq('id', botId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        {
          success: false,
          error: '调控机器人不存在',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      bot: {
        id: data.id,
        name: data.name,
        pairId: data.pair_id,
        floatValue: data.float_value || 0,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    });
  } catch (error) {
    console.error('Failed to fetch trading bot:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch trading bot',
      },
      { status: 500 }
    );
  }
}
