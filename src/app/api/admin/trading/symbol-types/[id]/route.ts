import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
const supabase = getSupabaseClient();
// DELETE - 删除品种类型
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: typeId } = await params;

    const { error } = await supabase
      .from('symbol_types')
      .delete()
      .eq('id', typeId);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Symbol type deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete symbol type:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete symbol type',
      },
      { status: 500 }
    );
  }
}
