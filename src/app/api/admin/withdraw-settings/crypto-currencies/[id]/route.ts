import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// 数据库字段映射到API字段
interface DatabaseCurrency {
  id: number;
  name: string;
  protocol: string;
  usd_rate: number;
  withdrawal_fee: number;
  min_withdrawal: number;
  max_withdrawal: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

// API响应字段
interface ApiCurrency {
  id: number;
  currency: string;
  network: string;
  minAmount: number;
  maxAmount: number;
  fee: number;
  feeType: 'fixed' | 'percentage';
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

// 映射函数：数据库 -> API
function mapDbToApi(db: DatabaseCurrency): ApiCurrency {
  return {
    id: db.id,
    currency: db.name,
    network: db.protocol,
    minAmount: db.min_withdrawal,
    maxAmount: db.max_withdrawal,
    fee: db.withdrawal_fee,
    feeType: 'fixed', // 默认为固定费率
    status: db.is_visible ? 'active' : 'inactive',
    created_at: db.created_at,
    updated_at: db.updated_at,
  };
}

// 映射函数：API -> 数据库
function mapApiToDb(api: Partial<ApiCurrency>): Partial<DatabaseCurrency> {
  const db: Partial<DatabaseCurrency> = {};

  if (api.currency !== undefined) db.name = api.currency;
  if (api.network !== undefined) db.protocol = api.network;
  if (api.minAmount !== undefined) db.min_withdrawal = api.minAmount;
  if (api.maxAmount !== undefined) db.max_withdrawal = api.maxAmount;
  if (api.fee !== undefined) db.withdrawal_fee = api.fee;
  if (api.status !== undefined) db.is_visible = api.status === 'active';

  return db;
}

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
        { success: false, error: 'Digital currency currency not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, currency: mapDbToApi(data) });
  } catch (error) {
    console.error('Error in GET /api/admin/withdraw-settings/crypto-currencies/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
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
        { success: false, error: 'Digital currency currency not found' },
        { status: 404 }
      );
    }

    // 映射到数据库字段
    const dbData = mapApiToDb(body);

    // 更新数据
    const { data, error } = await supabase
      .from('digital_currency_currencies')
      .update({
        ...dbData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating digital currency currency:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update digital currency currency' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, currency: mapDbToApi(data) });
  } catch (error) {
    console.error('Error in PATCH /api/admin/withdraw-settings/crypto-currencies/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
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
        { success: false, error: 'Failed to delete digital currency currency' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/admin/withdraw-settings/crypto-currencies/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
