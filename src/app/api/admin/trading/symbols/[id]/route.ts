import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
const supabase = getSupabaseClient();
// DELETE - 删除品种
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: symbolId } = await params;

    const { error } = await supabase
      .from('symbols')
      .delete()
      .eq('id', symbolId);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Symbol deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete symbol:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete symbol',
      },
      { status: 500 }
    );
  }
}
