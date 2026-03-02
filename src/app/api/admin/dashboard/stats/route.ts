import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
const supabase = getSupabaseClient();
export async function GET(request: NextRequest) {
  try {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

    // 获取今日新增用户
    const { count: newUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayStart)
      .lt('created_at', todayEnd);

    // 获取今日登录用户数（简化版，假设有登录记录表）
    const { count: todayLogin } = await supabase
      .from('user_login_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayStart)
      .lt('created_at', todayEnd);

    // 获取今日充值金额（非银行）
    const { data: rechargeData } = await supabase
      .from('deposits')
      .select('amount')
      .gte('created_at', todayStart)
      .lt('created_at', todayEnd)
      .eq('status', 'completed');

    const rechargeCurrency = rechargeData?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0;

    // 获取今日银行充值金额
    const { data: bankRechargeData } = await supabase
      .from('bank_deposits')
      .select('amount')
      .gte('created_at', todayStart)
      .lt('created_at', todayEnd)
      .eq('status', 'completed');

    const bankRechargeCurrency = bankRechargeData?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0;

    // 获取今日提现金额（非银行）
    const { data: extractData } = await supabase
      .from('withdrawals')
      .select('amount')
      .gte('created_at', todayStart)
      .lt('created_at', todayEnd)
      .eq('status', 'completed');

    const extractCurrency = extractData?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0;

    // 获取今日银行提现金额
    const { data: bankExtractData } = await supabase
      .from('bank_withdrawals')
      .select('amount')
      .gte('created_at', todayStart)
      .lt('created_at', todayEnd)
      .eq('status', 'completed');

    const bankExtractCurrency = bankExtractData?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0;

    return NextResponse.json({
      success: true,
      stats: {
        newUsers: newUsers || 0,
        todayLogin: todayLogin || 0,
        rechargeCurrency,
        bankRechargeCurrency,
        extractCurrency,
        bankExtractCurrency
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch stats'
    }, { status: 500 });
  }
}
