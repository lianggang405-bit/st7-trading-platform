import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const supabase = getSupabaseClient();

// DELETE - 批量删除电汇币种
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = body;

    // 验证必填字段
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: '请选择要删除的记录',
        },
        { status: 400 }
      );
    }

    // 批量删除
    const { error } = await supabase
      .from('wire_currency_settings')
      .delete()
      .in('id', ids);

    if (error) {
      console.error('Failed to batch delete wire currencies:', error);
      return NextResponse.json(
        {
          success: false,
          message: '批量删除电汇币种失败',
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `成功删除 ${ids.length} 条记录`,
    });
  } catch (error) {
    console.error('Failed to batch delete wire currencies:', error);
    return NextResponse.json(
      {
        success: false,
        message: '批量删除电汇币种失败',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
