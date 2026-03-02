import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - 获取单个数字货币币种详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from('digital_currency_currencies')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching digital currency currency:', error);
      return NextResponse.json(
        { error: 'Digital currency currency not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in GET /api/admin/wallet/digital-currency-currencies/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - 更新数字货币币种
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // 检查记录是否存在
    const { data: existing } = await supabase
      .from('digital_currency_currencies')
      .select('id')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: 'Digital currency currency not found' },
        { status: 404 }
      );
    }

    // 更新数据
    const { data, error } = await supabase
      .from('digital_currency_currencies')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating digital currency currency:', error);
      return NextResponse.json(
        { error: 'Failed to update digital currency currency' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in PATCH /api/admin/wallet/digital-currency-currencies/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - 删除数字货币币种
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 删除数据
    const { error } = await supabase
      .from('digital_currency_currencies')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting digital currency currency:', error);
      return NextResponse.json(
        { error: 'Failed to delete digital currency currency' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/admin/wallet/digital-currency-currencies/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
