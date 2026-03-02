import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/storage/database/supabase-admin-client';
const supabase = getSupabaseAdminClient();
// DELETE - 删除交易对
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pairId } = await params;

    const { error } = await supabase
      .from('trading_pairs')
      .delete()
      .eq('id', pairId);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Trading pair deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete trading pair:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete trading pair',
      },
      { status: 500 }
    );
  }
}
