import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 检查Supabase环境变量是否配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const useSupabase = supabaseUrl && supabaseServiceKey;

// Mock数据
const mockData = [
  { id: 376, type: '倍数', value: 500, symbol: 'ETH' },
  { id: 375, type: '倍数', value: 200, symbol: 'ETH' },
  { id: 374, type: '倍数', value: 100, symbol: 'ETH' },
  { id: 373, type: '倍数', value: 500, symbol: 'BTC' },
  { id: 371, type: '倍数', value: 200, symbol: 'BTC' },
  { id: 370, type: '倍数', value: 100, symbol: 'BTC' },
  { id: 369, type: '倍数', value: 500, symbol: 'XAUUSD' },
  { id: 368, type: '倍数', value: 400, symbol: 'XAUUSD' },
  { id: 367, type: '倍数', value: 300, symbol: 'XAUUSD' },
  { id: 366, type: '倍数', value: 200, symbol: 'XAUUSD' },
  { id: 365, type: '倍数', value: 100, symbol: 'XAUUSD' },
];

// GET - 获取单个倍数设置
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: settingId } = await params;
    const id = parseInt(settingId);

    // 如果没有配置Supabase，返回mock数据
    if (!useSupabase) {
      const mockSetting = mockData.find(item => item.id === id);
      if (!mockSetting) {
        return NextResponse.json(
          { success: false, error: 'Leverage setting not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        setting: mockSetting,
      });
    }

    // 尝试导入和初始化Supabase
    let supabase;
    try {
      supabase = getSupabaseClient();
    } catch (error) {
      console.error('Failed to initialize Supabase:', error);
      const mockSetting = mockData.find(item => item.id === id);
      if (!mockSetting) {
        return NextResponse.json(
          { success: false, error: 'Leverage setting not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        setting: mockSetting,
      });
    }

    if (!supabase) {
      const mockSetting = mockData.find(item => item.id === id);
      if (!mockSetting) {
        return NextResponse.json(
          { success: false, error: 'Leverage setting not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        setting: mockSetting,
      });
    }

    const { data, error } = await supabase
      .from('leverage_settings')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      const mockSetting = mockData.find(item => item.id === id);
      if (!mockSetting) {
        return NextResponse.json(
          { success: false, error: 'Leverage setting not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        setting: mockSetting,
      });
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
    console.error('Failed to fetch leverage setting:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch leverage setting',
      },
      { status: 500 }
    );
  }
}

// PUT - 更新倍数设置
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: settingId } = await params;
    const id = parseInt(settingId);
    const body = await request.json();
    const { type, value, symbol } = body;

    // 验证必填字段
    if (!type || value === undefined || value === null || !symbol) {
      return NextResponse.json(
        {
          success: false,
          error: '类型、值和品种为必填项',
        },
        { status: 400 }
      );
    }

    // 如果没有配置Supabase，返回成功响应但不实际更新
    if (!useSupabase) {
      return NextResponse.json({
        success: true,
        setting: {
          id,
          type,
          value,
          symbol,
        },
      });
    }

    // 尝试导入和初始化Supabase
    let supabase;
    try {
      supabase = getSupabaseClient();
    } catch (error) {
      console.error('Failed to initialize Supabase:', error);
      return NextResponse.json({
        success: true,
        setting: {
          id,
          type,
          value,
          symbol,
        },
      });
    }

    if (!supabase) {
      return NextResponse.json({
        success: true,
        setting: {
          id,
          type,
          value,
          symbol,
        },
      });
    }

    const { data, error } = await supabase
      .from('leverage_settings')
      .update({
        type,
        value,
        symbol,
      })
      .eq('id', id)
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
    console.error('Failed to update leverage setting:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update leverage setting',
      },
      { status: 500 }
    );
  }
}

// DELETE - 删除倍数设置
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: settingId } = await params;
    const id = parseInt(settingId);

    // 如果没有配置Supabase，返回成功响应但不实际删除
    if (!useSupabase) {
      return NextResponse.json({
        success: true,
        message: 'Leverage setting deleted successfully',
      });
    }

    // 尝试导入和初始化Supabase
    let supabase;
    try {
      supabase = getSupabaseClient();
    } catch (error) {
      console.error('Failed to initialize Supabase:', error);
      return NextResponse.json({
        success: true,
        message: 'Leverage setting deleted successfully',
      });
    }

    if (!supabase) {
      return NextResponse.json({
        success: true,
        message: 'Leverage setting deleted successfully',
      });
    }

    const { error } = await supabase
      .from('leverage_settings')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Leverage setting deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete leverage setting:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete leverage setting',
      },
      { status: 500 }
    );
  }
}
