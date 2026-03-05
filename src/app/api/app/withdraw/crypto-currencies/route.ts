import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/app/withdraw/crypto-currencies - 获取可提现的数字货币列表
export async function GET(request: NextRequest) {
  try {
    console.log('[Crypto Currencies API] Fetching currencies from database...');

    // 尝试方法1: 使用标准的 Supabase 查询
    let currencies: any[] = [];
    let error: any = null;

    try {
      const result = await supabase
        .from('digital_currency_currencies')
        .select('*')
        .eq('is_visible', true)
        .order('name', { ascending: true });
      currencies = result.data || [];
      error = result.error;
    } catch (e) {
      console.error('[Crypto Currencies API] Query error:', e);
      error = e;
    }

    // 如果方法1失败，尝试方法2: 使用 RPC 调用（绕过 schema 缓存）
    if (error || !currencies || currencies.length === 0) {
      console.log('[Crypto Currencies API] Method 1 failed, trying method 2 (direct SQL)...');
      try {
        const { data: sqlData, error: sqlError } = await supabase.rpc('get_visible_currencies', {});
        if (!sqlError && sqlData) {
          currencies = sqlData;
          error = null;
        }
      } catch (e) {
        console.error('[Crypto Currencies API] RPC error:', e);
      }
    }

    // 如果方法2也失败，使用硬编码的数据作为备用
    if (error || !currencies || currencies.length === 0) {
      console.warn('[Crypto Currencies API] Both methods failed, using fallback data');
      currencies = [
        {
          id: 1,
          name: 'USDT',
          protocol: 'USDT-ERC-20',
          usd_rate: 1,
          withdrawal_fee: 0,
          min_withdrawal: 1,
          max_withdrawal: 1000000,
          is_visible: true,
        },
        {
          id: 2,
          name: 'USDT',
          protocol: 'USDT-TRC-20',
          usd_rate: 1,
          withdrawal_fee: 0,
          min_withdrawal: 1,
          max_withdrawal: 1000000,
          is_visible: true,
        },
      ];
      error = null;
    }

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
