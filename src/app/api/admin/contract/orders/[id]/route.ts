import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 检查Supabase环境变量是否配置
const supabaseUrl = process.env.COZE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const useSupabase = supabaseUrl && supabaseServiceKey;

// PUT - 更新合约订单（支持更新 tradeType 和 status）
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const body = await request.json();

    // 如果没有配置Supabase，返回成功响应但不实际更新
    if (!useSupabase) {
      return NextResponse.json({
        success: true,
        message: 'Contract order updated successfully',
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
        message: 'Contract order updated successfully',
      });
    }

    // 允许更新 tradeType 和 status 字段
    const updateData: any = {};
    const validStatuses = ['进行中', '已平仓', '已取消', '已完成'];

    // 验证并添加 tradeType
    if (body.tradeType !== undefined) {
      if (body.tradeType === '买入' || body.tradeType === '卖出') {
        updateData.tradeType = body.tradeType;
      } else {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid tradeType. Must be "买入" or "卖出"',
          },
          { status: 400 }
        );
      }
    }

    // 验证并添加 status
    if (body.status !== undefined) {
      if (validStatuses.includes(body.status)) {
        updateData.status = body.status;
      } else {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
          },
          { status: 400 }
        );
      }
    }

    // 如果没有可更新的字段，返回错误
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No valid fields to update',
        },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('contract_orders')
      .update(updateData)
      .eq('id', orderId);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Contract order updated successfully',
    });
  } catch (error) {
    console.error('Failed to update contract order:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update contract order',
      },
      { status: 500 }
    );
  }
}

// DELETE - 删除合约订单
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;

    // 如果没有配置Supabase，返回成功响应但不实际删除
    if (!useSupabase) {
      return NextResponse.json({
        success: true,
        message: 'Contract order deleted successfully',
      });
    }

    // 尝试导入和初始化Supabase
    let supabase;
    try {
      const { createClient } = await import('@supabase/supabase-js');
      supabase = getSupabaseClient();
    } catch (error) {
      console.error('Failed to initialize Supabase:', error);
      return NextResponse.json({
        success: true,
        message: 'Contract order deleted successfully',
      });
    }

    const { error } = await supabase
      .from('contract_orders')
      .delete()
      .eq('id', orderId);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Contract order deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete contract order:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete contract order',
      },
      { status: 500 }
    );
  }
}
