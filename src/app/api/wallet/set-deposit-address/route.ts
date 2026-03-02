import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.COZE_SUPABASE_URL || '',
  process.env.COZE_SUPABASE_ANON_KEY || ''
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { currency, network, address, memo } = body;

    if (!currency || !network || !address) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 检查是否已存在相同的地址
    const { data: existing } = await supabase
      .from('crypto_addresses')
      .select('*')
      .eq('currency', currency)
      .eq('network', network)
      .eq('address', address)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: '该地址已存在' },
        { status: 400 }
      );
    }

    // 插入新的入金地址
    const { data: newAddress, error } = await supabase
      .from('crypto_addresses')
      .insert([
        {
          currency,
          network,
          address,
          memo: memo || null,
          status: 'active',
          protocol: network,
          usd_price: 0,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('设置入金地址失败:', error);
      return NextResponse.json(
        { error: '设置入金地址失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: newAddress,
    });
  } catch (error) {
    console.error('设置入金地址失败:', error);
    return NextResponse.json(
      { error: '设置入金地址失败' },
      { status: 500 }
    );
  }
}
