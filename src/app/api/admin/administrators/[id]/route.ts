import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - 获取单个管理员详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    const { data, error } = await supabase
      .from('administrators')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching administrator:', error);
      return NextResponse.json(
        { error: 'Administrator not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in GET /api/admin/administrators/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - 更新管理员
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();

    // 检查记录是否存在
    const { data: existing } = await supabase
      .from('administrators')
      .select('id')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: 'Administrator not found' },
        { status: 404 }
      );
    }

    // 更新数据
    const { data, error } = await supabase
      .from('administrators')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating administrator:', error);
      return NextResponse.json(
        { error: 'Failed to update administrator' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in PATCH /api/admin/administrators/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - 删除管理员
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // 删除数据
    const { error } = await supabase
      .from('administrators')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting administrator:', error);
      return NextResponse.json(
        { error: 'Failed to delete administrator' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/admin/administrators/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
