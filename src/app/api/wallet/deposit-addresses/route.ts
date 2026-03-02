import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function GET(request: NextRequest) {
  try {
    // 鑾峰彇鏁板瓧璐у竵甯佺鍒楄〃
    const { data: currencies, error: currenciesError } = await supabase
      .from('digital_currency_currencies')
      .select('*')
      .eq('is_visible', true)
      .order('id', { ascending: true });

    if (currenciesError) {
      console.error('鑾峰彇甯佺澶辫触:', currenciesError);
      return NextResponse.json(
        { error: '鑾峰彇甯佺澶辫触' },
        { status: 500 }
      );
    }

    // 鑾峰彇鎵€鏈夊叆閲戝湴鍧€
    const { data: addresses, error: addressesError } = await supabase
      .from('crypto_addresses')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (addressesError) {
      console.error('鑾峰彇鍏ラ噾鍦板潃澶辫触:', addressesError);
      return NextResponse.json(
        { error: '鑾峰彇鍏ラ噾鍦板潃澶辫触' },
        { status: 500 }
      );
    }

    // 鍚堝苟甯佺鍜屽湴鍧€淇℃伅
    const depositAddresses = (currencies || []).map(currency => {
      const addressList = (addresses || [])
        .filter(addr => addr.currency === currency.name)
        .map(addr => ({
          id: addr.id,
          network: addr.network,
          address: addr.address,
          memo: addr.memo,
          protocol: addr.protocol,
        }));

      return {
        currency: currency.name,
        currencyName: currency.name,
        currencyIcon: null,
        networks: addressList,
      };
    });

    return NextResponse.json({
      success: true,
      data: depositAddresses,
    });
  } catch (error) {
    console.error('鑾峰彇鍏ラ噾鍦板潃澶辫触:', error);
    return NextResponse.json(
      { error: '鑾峰彇鍏ラ噾鍦板潃澶辫触' },
      { status: 500 }
    );
  }
}

