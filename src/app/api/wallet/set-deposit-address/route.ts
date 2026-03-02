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
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Check if the same address already exists
    const { data: existing } = await supabase
      .from('crypto_addresses')
      .select('*')
      .eq('currency', currency)
      .eq('network', network)
      .eq('address', address)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'This address already exists' },
        { status: 400 }
      );
    }

    // Insert new deposit address
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
      console.error('Failed to set deposit address:', error);
      return NextResponse.json(
        { error: 'Failed to set deposit address' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: newAddress,
    });
  } catch (error) {
    console.error('Failed to set deposit address:', error);
    return NextResponse.json(
      { error: 'Failed to set deposit address' },
      { status: 500 }
    );
  }
}
