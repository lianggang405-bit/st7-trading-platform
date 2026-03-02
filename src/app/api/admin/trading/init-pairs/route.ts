import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
const supabase = getSupabaseClient();

// POST - 初始化交易对表和调控机器人表
export async function POST() {
  try {
    console.log('开始初始化交易对表...');

    // 创建交易对表
    const { error: createPairsError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS trading_pairs (
          id SERIAL PRIMARY KEY,
          symbol VARCHAR(20) UNIQUE NOT NULL,
          currency_id INTEGER NOT NULL,
          is_visible BOOLEAN DEFAULT true,
          min_order_size DECIMAL(20, 8) DEFAULT 0.001,
          max_order_size DECIMAL(20, 8) DEFAULT 999999,
          contract_fee DECIMAL(5, 2) DEFAULT 0.1,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (createPairsError) {
      console.error('创建交易对表失败:', createPairsError);
    }

    // 创建索引
    await supabase.rpc('execute_sql', {
      sql: `CREATE INDEX IF NOT EXISTS idx_trading_pairs_symbol ON trading_pairs(symbol);`
    });

    await supabase.rpc('execute_sql', {
      sql: `CREATE INDEX IF NOT EXISTS idx_trading_pairs_visible ON trading_pairs(is_visible);`
    });

    // 创建调控机器人表
    const { error: createBotsError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS trading_bots (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          pair_id INTEGER NOT NULL REFERENCES trading_pairs(id) ON DELETE CASCADE,
          float_value DECIMAL(20, 8) DEFAULT 0,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(pair_id)
        );
      `
    });

    if (createBotsError) {
      console.error('创建调控机器人表失败:', createBotsError);
    }

    // 创建索引
    await supabase.rpc('execute_sql', {
      sql: `CREATE INDEX IF NOT EXISTS idx_trading_bots_pair_id ON trading_bots(pair_id);`
    });

    await supabase.rpc('execute_sql', {
      sql: `CREATE INDEX IF NOT EXISTS idx_trading_bots_active ON trading_bots(is_active);`
    });

    // 插入默认交易对
    const { error: insertError } = await supabase
      .from('trading_pairs')
      .upsert([
        { symbol: 'BTC/USDT', currency_id: 1, is_visible: true, min_order_size: 0.001, max_order_size: 100, contract_fee: 0.1 },
        { symbol: 'ETH/USDT', currency_id: 2, is_visible: true, min_order_size: 0.01, max_order_size: 1000, contract_fee: 0.1 },
        { symbol: 'XAU/USD', currency_id: 3, is_visible: true, min_order_size: 0.01, max_order_size: 100, contract_fee: 0.1 },
        { symbol: 'XAU/USDT', currency_id: 4, is_visible: true, min_order_size: 0.01, max_order_size: 100, contract_fee: 0.1 },
      ], { onConflict: 'symbol' });

    if (insertError) {
      console.error('插入交易对数据失败:', insertError);
    }

    return NextResponse.json({
      success: true,
      message: '交易对表和调控机器人表初始化成功',
    });
  } catch (error) {
    console.error('初始化失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '初始化失败',
      },
      { status: 500 }
    );
  }
}
