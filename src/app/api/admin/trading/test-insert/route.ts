import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// POST - 测试插入交易对数据
export async function POST() {
  try {
    const supabase = getSupabaseClient();

    // 先检查表是否存在
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_tables_in_schema', { schema: 'public' });

    console.log('Tables:', tables);
    console.log('Tables error:', tablesError);

    // 直接插入数据
    const defaultPairs = [
      { symbol: 'BTC/USDT', currency_id: 1, is_visible: true, min_order_size: 0.001, max_order_size: 100, contract_fee: 0.1 },
      { symbol: 'ETH/USDT', currency_id: 2, is_visible: true, min_order_size: 0.01, max_order_size: 1000, contract_fee: 0.1 },
      { symbol: 'XAU/USD', currency_id: 3, is_visible: true, min_order_size: 0.01, max_order_size: 100, contract_fee: 0.1 },
      { symbol: 'XAU/USDT', currency_id: 4, is_visible: true, min_order_size: 0.01, max_order_size: 100, contract_fee: 0.1 },
    ];

    const { data, error } = await supabase
      .from('trading_pairs')
      .insert(defaultPairs)
      .select();

    if (error) {
      console.error('插入失败:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error,
      });
    }

    return NextResponse.json({
      success: true,
      message: '交易对数据初始化成功',
      data,
    });
  } catch (error) {
    console.error('Failed to initialize trading pairs:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to initialize trading pairs',
        details: error,
      },
      { status: 500 }
    );
  }
}
