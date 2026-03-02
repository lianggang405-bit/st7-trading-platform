import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - 获取单个支持法币详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from('supported_fiat_currencies')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching supported fiat currency:', error);
      return NextResponse.json(
        { error: 'Supported fiat currency not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in GET /api/admin/wallet/supported-fiat-currencies/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - 更新支持法币
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // 检查记录是否存在
    const { data: existing } = await supabase
      .from('supported_fiat_currencies')
      .select('id')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: 'Supported fiat currency not found' },
        { status: 404 }
      );
    }

    // 更新数据
    const { data, error } = await supabase
      .from('supported_fiat_currencies')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating supported fiat currency:', error);
      return NextResponse.json(
        { error: 'Failed to update supported fiat currency' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in PATCH /api/admin/wallet/supported-fiat-currencies/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - 删除支持法币
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 删除数据
    const { error } = await supabase
      .from('supported_fiat_currencies')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting supported fiat currency:', error);
      return NextResponse.json(
        { error: 'Failed to delete supported fiat currency' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/admin/wallet/supported-fiat-currencies/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
