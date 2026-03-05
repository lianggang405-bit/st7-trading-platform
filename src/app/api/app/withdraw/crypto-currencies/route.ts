import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const supabase = getSupabaseClient();

// GET /api/app/withdraw/crypto-currencies - 获取可提现的数字货币列表
export async function GET(request: NextRequest) {
  try {
    console.log('[Crypto Currencies API] Fetching currencies from database...');

    // 从数据库查询数字货币配置
    const { data: currencies, error } = await supabase
      .from('digital_currency_currencies')
      .select('*')
      .eq('is_visible', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('[Crypto Currencies API] Failed to fetch currencies:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch currencies',
        details: error.message
      }, { status: 500 });
    }

    console.log('[Crypto Currencies API] Found currencies:', currencies?.length || 0);

    // 转换数据格式，适配实际表结构
    const formattedCurrencies = currencies?.map((c: any) => {
      const formatted = {
        id: c.id,
        code: c.name, // 使用 name 作为 code
        name: c.name,
        nameEn: c.name,
        symbol: c.name.substring(0, 3).toUpperCase(), // 从 name 生成 symbol
        protocol: c.protocol,
        minAmount: parseFloat(c.min_withdrawal) || 0,
        maxAmount: parseFloat(c.max_withdrawal) || 0,
        fee: parseFloat(c.withdrawal_fee) || 0,
        feeType: 'fixed',
        usdRate: parseFloat(c.usd_rate) || 0,
      };
      console.log(`[Crypto Currencies API] Formatted currency: ${formatted.code}-${formatted.protocol}`);
      return formatted;
    }) || [];

    console.log('[Crypto Currencies API] Returning currencies:', formattedCurrencies.length);

    return NextResponse.json({
      success: true,
      currencies: formattedCurrencies,
    });
  } catch (error) {
    console.error('Error in GET crypto currencies:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
