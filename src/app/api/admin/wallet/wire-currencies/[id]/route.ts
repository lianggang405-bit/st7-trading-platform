import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
const supabase = getSupabaseClient();
// DELETE /api/admin/wallet/wire-currencies/[id] - 删除电汇币种
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currencyId = parseInt(id);

    if (isNaN(currencyId)) {
      return NextResponse.json({ success: false, error: 'Invalid currency ID' }, { status: 400 });
    }

    const { error } = await supabase
      .from('wire_currencies')
      .delete()
      .eq('id', currencyId);

    if (error) {
      console.error('Failed to delete wire currency:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE wire currency:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/admin/wallet/wire-currencies/[id] - 更新电汇币种
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currencyId = parseInt(id);
    const body = await request.json();

    if (isNaN(currencyId)) {
      return NextResponse.json({ success: false, error: 'Invalid currency ID' }, { status: 400 });
    }

    // 将驼峰命名转换为下划线命名
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (body.currencyName !== undefined) updateData.currency_name = body.currencyName;
    if (body.usdPrice !== undefined) updateData.usd_price = body.usdPrice;

    const { data: currency, error } = await supabase
      .from('wire_currencies')
      .update(updateData)
      .eq('id', currencyId)
      .select()
      .single();

    if (error) {
      console.error('Failed to update wire currency:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, currency });
  } catch (error) {
    console.error('Error in PATCH wire currency:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/admin/wallet/wire-currencies/[id] - 获取单个电汇币种详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currencyId = parseInt(id);

    if (isNaN(currencyId)) {
      return NextResponse.json({ success: false, error: 'Invalid currency ID' }, { status: 400 });
    }

    const { data: currency, error } = await supabase
      .from('wire_currencies')
      .select('*')
      .eq('id', currencyId)
      .single();

    if (error) {
      console.error('Failed to fetch wire currency:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // 转换数据格式
    const formattedCurrency = {
      id: currency.id,
      currencyName: currency.currency_name,
      usdPrice: currency.usd_price,
      createdAt: currency.created_at,
      updatedAt: currency.updated_at,
    };

    return NextResponse.json({ success: true, currency: formattedCurrency });
  } catch (error) {
    console.error('Error in GET wire currency:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
