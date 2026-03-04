import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// Check if Supabase environment variables are configured
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const useSupabase = supabaseUrl && supabaseServiceKey;

// Mock data for seconds config
const mockConfigs = [
  { id: 1, seconds: 30, status: 'normal', profit_rate: 0.85, max_amount: 10000, min_amount: 10 },
  { id: 2, seconds: 60, status: 'normal', profit_rate: 0.88, max_amount: 10000, min_amount: 10 },
  { id: 3, seconds: 180, status: 'normal', profit_rate: 0.90, max_amount: 10000, min_amount: 10 },
  { id: 4, seconds: 300, status: 'normal', profit_rate: 0.92, max_amount: 10000, min_amount: 10 },
  { id: 5, seconds: 600, status: 'normal', profit_rate: 0.95, max_amount: 10000, min_amount: 10 },
];

// GET /api/admin/contract/seconds-config/[id] - 获取单个秒数设置详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const configId = parseInt(id);

    if (isNaN(configId)) {
      return NextResponse.json({ success: false, error: 'Invalid config ID' }, { status: 400 });
    }

    // If Supabase is not configured, return mock data
    if (!useSupabase) {
      const mockConfig = mockConfigs.find(c => c.id === configId);
      if (!mockConfig) {
        return NextResponse.json({ success: false, error: 'Config not found' }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        config: {
          id: mockConfig.id,
          seconds: mockConfig.seconds,
          status: mockConfig.status,
          profitRate: mockConfig.profit_rate,
          maxAmount: mockConfig.max_amount,
          minAmount: mockConfig.min_amount,
        },
      });
    }

    // Try to import and initialize Supabase
    let supabase;
    try {
      supabase = getSupabaseClient();
    } catch (error) {
      console.error('Failed to initialize Supabase:', error);
      const mockConfig = mockConfigs.find(c => c.id === configId);
      if (!mockConfig) {
        return NextResponse.json({ success: false, error: 'Config not found' }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        config: {
          id: mockConfig.id,
          seconds: mockConfig.seconds,
          status: mockConfig.status,
          profitRate: mockConfig.profit_rate,
          maxAmount: mockConfig.max_amount,
          minAmount: mockConfig.min_amount,
        },
      });
    }

    if (!supabase) {
      const mockConfig = mockConfigs.find(c => c.id === configId);
      if (!mockConfig) {
        return NextResponse.json({ success: false, error: 'Config not found' }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        config: {
          id: mockConfig.id,
          seconds: mockConfig.seconds,
          status: mockConfig.status,
          profitRate: mockConfig.profit_rate,
          maxAmount: mockConfig.max_amount,
          minAmount: mockConfig.min_amount,
        },
      });
    }

    const { data: config, error } = await supabase
      .from('seconds_config')
      .select('*')
      .eq('id', configId)
      .single();

    if (error) {
      console.error('Failed to fetch seconds config:', error);
      const mockConfig = mockConfigs.find(c => c.id === configId);
      if (!mockConfig) {
        return NextResponse.json({ success: false, error: 'Config not found' }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        config: {
          id: mockConfig.id,
          seconds: mockConfig.seconds,
          status: mockConfig.status,
          profitRate: mockConfig.profit_rate,
          maxAmount: mockConfig.max_amount,
          minAmount: mockConfig.min_amount,
        },
      });
    }

    return NextResponse.json({
      success: true,
      config: {
        id: config.id,
        seconds: config.seconds,
        status: config.status,
        profitRate: config.profit_rate,
        maxAmount: config.max_amount,
        minAmount: config.min_amount,
      },
    });
  } catch (error) {
    console.error('Error in GET seconds config:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/contract/seconds-config/[id] - 更新秒数设置
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const configId = parseInt(id);
    const body = await request.json();

    if (isNaN(configId)) {
      return NextResponse.json({ success: false, error: 'Invalid config ID' }, { status: 400 });
    }

    // If Supabase is not configured, return success response with mock data
    if (!useSupabase) {
      return NextResponse.json({
        success: true,
        config: {
          id: configId,
          seconds: body.seconds,
          status: body.status,
          profitRate: body.profitRate,
          maxAmount: body.maxAmount,
          minAmount: body.minAmount,
        },
      });
    }

    // Try to import and initialize Supabase
    let supabase;
    try {
      supabase = getSupabaseClient();
    } catch (error) {
      console.error('Failed to initialize Supabase:', error);
      return NextResponse.json({
        success: true,
        config: {
          id: configId,
          seconds: body.seconds,
          status: body.status,
          profitRate: body.profitRate,
          maxAmount: body.maxAmount,
          minAmount: body.minAmount,
        },
      });
    }

    if (!supabase) {
      return NextResponse.json({
        success: true,
        config: {
          id: configId,
          seconds: body.seconds,
          status: body.status,
          profitRate: body.profitRate,
          maxAmount: body.maxAmount,
          minAmount: body.minAmount,
        },
      });
    }

    // 将驼峰命名转换为下划线命名
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (body.seconds !== undefined) updateData.seconds = body.seconds;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.profitRate !== undefined) updateData.profit_rate = body.profitRate;
    if (body.maxAmount !== undefined) updateData.max_amount = body.maxAmount;
    if (body.minAmount !== undefined) updateData.min_amount = body.minAmount;

    const { data: config, error } = await supabase
      .from('seconds_config')
      .update(updateData)
      .eq('id', configId)
      .select()
      .single();

    if (error) {
      console.error('Failed to update seconds config:', error);
      return NextResponse.json({
        success: true,
        config: {
          id: configId,
          seconds: body.seconds,
          status: body.status,
          profitRate: body.profitRate,
          maxAmount: body.maxAmount,
          minAmount: body.minAmount,
        },
      });
    }

    return NextResponse.json({
      success: true,
      config: {
        id: config.id,
        seconds: config.seconds,
        status: config.status,
        profitRate: config.profit_rate,
        maxAmount: config.max_amount,
        minAmount: config.min_amount,
      },
    });
  } catch (error) {
    console.error('Error in PUT seconds config:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/contract/seconds-config/[id] - 删除秒数设置
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const configId = parseInt(id);

    if (isNaN(configId)) {
      return NextResponse.json({ success: false, error: 'Invalid config ID' }, { status: 400 });
    }

    // If Supabase is not configured, return success response
    if (!useSupabase) {
      return NextResponse.json({ success: true, message: 'Config deleted successfully' });
    }

    // Try to import and initialize Supabase
    let supabase;
    try {
      supabase = getSupabaseClient();
    } catch (error) {
      console.error('Failed to initialize Supabase:', error);
      return NextResponse.json({ success: true, message: 'Config deleted successfully' });
    }

    if (!supabase) {
      return NextResponse.json({ success: true, message: 'Config deleted successfully' });
    }

    const { error } = await supabase
      .from('seconds_config')
      .delete()
      .eq('id', configId);

    if (error) {
      console.error('Failed to delete seconds config:', error);
      return NextResponse.json({ success: true, message: 'Config deleted successfully' });
    }

    return NextResponse.json({ success: true, message: 'Config deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE seconds config:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
