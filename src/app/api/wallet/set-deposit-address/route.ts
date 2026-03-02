import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { currency, network, address, memo } = body;

    if (!currency || !network || !address) {
      return NextResponse.json(
        { error: '缂哄皯蹇呰鍙傛暟' },
        { status: 400 }
      );
    }

    // 妫€鏌ユ槸鍚﹀凡瀛樺湪鐩稿悓鐨勫湴鍧€
    const { data: existing } = await supabase
      .from('crypto_addresses')
      .select('*')
      .eq('currency', currency)
      .eq('network', network)
      .eq('address', address)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: '璇ュ湴鍧€宸插瓨鍦? },
        { status: 400 }
      );
    }

    // 鎻掑叆鏂扮殑鍏ラ噾鍦板潃
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
      console.error('璁剧疆鍏ラ噾鍦板潃澶辫触:', error);
      return NextResponse.json(
        { error: '璁剧疆鍏ラ噾鍦板潃澶辫触' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: newAddress,
    });
  } catch (error) {
    console.error('璁剧疆鍏ラ噾鍦板潃澶辫触:', error);
    return NextResponse.json(
      { error: '璁剧疆鍏ラ噾鍦板潃澶辫触' },
      { status: 500 }
    );
  }
}

