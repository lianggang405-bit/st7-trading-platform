import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.COZE_SUPABASE_URL || '',
  process.env.COZE_SUPABASE_ANON_KEY || ''
);

export async function GET(request: NextRequest) {
  try {
    // 获取数字货币币种列表
    const { data: currencies, error: currenciesError } = await supabase
      .from('digital_currency_currencies')
      .select('*')
      .eq('is_visible', true)
      .order('id', { ascending: true });

    if (currenciesError) {
      console.error('获取币种失败:', currenciesError);
      return NextResponse.json(
        { error: '获取币种失败' },
        { status: 500 }
      );
    }

    // 获取所有入金地址
    const { data: addresses, error: addressesError } = await supabase
      .from('crypto_addresses')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (addressesError) {
      console.error('获取入金地址失败:', addressesError);
      return NextResponse.json(
        { error: '获取入金地址失败' },
        { status: 500 }
      );
    }

    // 合并币种和地址信息
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
    console.error('获取入金地址失败:', error);
    return NextResponse.json(
      { error: '获取入金地址失败' },
      { status: 500 }
    );
  }
}
