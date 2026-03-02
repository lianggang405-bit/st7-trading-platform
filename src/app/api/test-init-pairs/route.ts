import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// POST - 初始化交易对数据（测试用）
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();

    // 检查表是否存在数据
    const { count } = await supabase
      .from('trading_pairs')
      .select('*', { count: 'exact', head: true });

    if (count && count > 0) {
      return NextResponse.json({
        success: true,
        message: '交易对数据已存在',
        count,
      });
    }

    // 创建默认交易对
    const defaultPairs = [
      { symbol: 'BTC/USDT', currency_id: 1, is_visible: true, min_order_size: 0.001, max_order_size: 100, contract_fee: 0.1 },
      { symbol: 'ETH/USDT', currency_id: 2, is_visible: true, min_order_size: 0.01, max_order_size: 1000, contract_fee: 0.1 },
      { symbol: 'XAU/USD', currency_id: 3, is_visible: true, min_order_size: 0.01, max_order_size: 100, contract_fee: 0.1 },
    ];

    const { data, error } = await supabase
      .from('trading_pairs')
      .insert(defaultPairs)
      .select();

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
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
      },
      { status: 500 }
    );
  }
}
