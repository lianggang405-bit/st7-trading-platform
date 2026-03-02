import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const supabase = getSupabaseClient();

// GET /api/app/withdraw/crypto-currencies - 获取可提现的数字货币列表
export async function GET(request: NextRequest) {
  try {
    // 从数据库查询数字货币配置
    const { data: currencies, error } = await supabase
      .from('digital_currency_currencies')
      .select('*')
      .eq('is_visible', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Failed to fetch crypto currencies:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch currencies' 
      }, { status: 500 });
    }

    // 转换数据格式，适配实际表结构
    const formattedCurrencies = currencies?.map((c: any) => ({
      id: c.id,
      code: c.name, // 使用 name 作为 code
      name: c.name,
      nameEn: c.name,
      symbol: c.name.substring(0, 3).toUpperCase(), // 从 name 生成 symbol
      protocol: c.protocol,
      minAmount: c.min_withdrawal,
      maxAmount: c.max_withdrawal,
      fee: c.withdrawal_fee || 0,
      feeType: 'fixed',
      usdRate: c.usd_rate,
    })) || [];

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
