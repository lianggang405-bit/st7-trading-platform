import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
const supabase = getSupabaseClient();
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('wire_currencies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      currencies: data || [],
    });
  } catch (error) {
    console.error('Get wire currencies error:', error);
    return NextResponse.json(
      { success: false, error: '获取电汇币种失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, name, nameEn, symbol, minAmount, maxAmount, fee, feeType, status, icon } = body;

    if (!code || !name || !nameEn || !symbol) {
      return NextResponse.json(
        { success: false, error: '请填写完整信息' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('wire_currencies')
      .insert([{
        code: code.toUpperCase(),
        name,
        name_en: nameEn,
        symbol,
        min_amount: minAmount || 100,
        max_amount: maxAmount || 1000000,
        fee: fee || 0,
        fee_type: feeType || 'fixed',
        status: status || 'active',
        icon: icon || '',
      }])
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      currency: data,
    });
  } catch (error) {
    console.error('Create wire currency error:', error);
    return NextResponse.json(
      { success: false, error: '创建电汇币种失败' },
      { status: 500 }
    );
  }
}
