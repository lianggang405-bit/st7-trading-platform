import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
const supabase = getSupabaseClient();
// DELETE - 删除开盘时间配置
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: hourId } = await params;

    const { error } = await supabase
      .from('trading_hours')
      .delete()
      .eq('id', hourId);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Trading hours configuration deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete trading hours:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete trading hours',
      },
      { status: 500 }
    );
  }
}
