import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - 获取法币配置列表
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('supported_fiat_currencies')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching fiat currencies:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch fiat currencies' },
        { status: 500 }
      );
    }

    // 转换数据格式以匹配前端期望
    const currencies = (data || []).map((item: any) => ({
      id: item.id,
      code: item.name,
      name: item.name,
      symbol: '$',
      minAmount: item.min_withdrawal,
      maxAmount: item.max_withdrawal,
      fee: item.withdrawal_fee,
      status: item.is_visible ? 'active' : 'inactive',
    }));

    return NextResponse.json({
      success: true,
      currencies,
    });
  } catch (error) {
    console.error('Error in GET /api/admin/withdraw-settings/fiat-currencies:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - 创建法币配置
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, name, symbol, minAmount, maxAmount, fee, status } = body;

    // 验证必填字段
    if (!code || minAmount === undefined || maxAmount === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 插入数据
    const { data, error } = await supabase
      .from('supported_fiat_currencies')
      .insert([
        {
          name: code,
          usd_rate: 1,
          withdrawal_fee: fee || 0,
          min_withdrawal: minAmount,
          max_withdrawal: maxAmount,
          is_visible: status === 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating fiat currency:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create fiat currency' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error in POST /api/admin/withdraw-settings/fiat-currencies:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
