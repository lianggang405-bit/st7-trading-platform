import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
const supabase = getSupabaseClient();
// DELETE - 删除币种
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: currencyId } = await params;

    const { error } = await supabase
      .from('currency_kxes')
      .delete()
      .eq('id', currencyId);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Currency deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete currency:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete currency',
      },
      { status: 500 }
    );
  }
}
