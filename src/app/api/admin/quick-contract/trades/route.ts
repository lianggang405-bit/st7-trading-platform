import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
const supabase = getSupabaseClient();
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const result = searchParams.get('result');
    const symbol = searchParams.get('symbol');

    let query = supabase
      .from('quick_contract_trades')
      .select(`
        *,
        user:users(email)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (result && result !== 'all') {
      query = query.eq('result', result);
    }

    if (symbol && symbol !== 'all') {
      query = query.eq('symbol', symbol);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Get quick contract trades error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const trades = data?.map(trade => ({
      ...trade,
      email: trade.user?.email || 'Unknown',
    })) || [];

    return NextResponse.json({
      success: true,
      trades,
    });
  } catch (error) {
    console.error('Get quick contract trades error:', error);
    return NextResponse.json(
      { success: false, error: '获取秒合约交易失败' },
      { status: 500 }
    );
  }
}
