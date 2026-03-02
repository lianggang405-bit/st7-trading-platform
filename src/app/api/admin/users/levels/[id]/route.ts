import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
const supabase = getSupabaseClient();
// DELETE - 删除用户等级
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: levelId } = await params;

    const { error } = await supabase
      .from('user_levels')
      .delete()
      .eq('id', levelId);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'User level deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete user level:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete user level',
      },
      { status: 500 }
    );
  }
}
