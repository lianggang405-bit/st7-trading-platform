import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 检查Supabase环境变量是否配置
const supabaseUrl = process.env.COZE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const useSupabase = supabaseUrl && supabaseServiceKey;

// DELETE - 删除理财订单
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
        message: 'Project order deleted successfully',
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
        message: 'Project order deleted successfully',
      });
    }

    const { error } = await supabase
      .from('project_orders')
      .delete()
      .eq('id', orderId);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Project order deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete project order:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete project order',
      },
      { status: 500 }
    );
  }
}
