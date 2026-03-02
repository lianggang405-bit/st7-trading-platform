import { NextResponse } from 'next/server';
import { getSupabaseCredentials } from '@/storage/database/supabase-client';

// POST - 通过SQL API初始化数据库表
export async function POST() {
  try {
    const { url, anonKey } = getSupabaseCredentials();

    // 使用Supabase的SQL API
    const sqlApiUrl = `${url}/rest/v1/rpc/exec_sql`;

    const sqlStatements = [
      // 创建交易对表
      `CREATE TABLE IF NOT EXISTS trading_pairs (
        id SERIAL PRIMARY KEY,
        symbol VARCHAR(20) UNIQUE NOT NULL,
        currency_id INTEGER NOT NULL,
        is_visible BOOLEAN DEFAULT true,
        min_order_size DECIMAL(20, 8) DEFAULT 0.001,
        max_order_size DECIMAL(20, 8) DEFAULT 999999,
        contract_fee DECIMAL(5, 2) DEFAULT 0.1,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`,
      // 创建索引
      `CREATE INDEX IF NOT EXISTS idx_trading_pairs_symbol ON trading_pairs(symbol);`,
      `CREATE INDEX IF NOT EXISTS idx_trading_pairs_visible ON trading_pairs(is_visible);`,
      // 创建调控机器人表
      `CREATE TABLE IF NOT EXISTS trading_bots (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        pair_id INTEGER NOT NULL REFERENCES trading_pairs(id) ON DELETE CASCADE,
        float_value DECIMAL(20, 8) DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(pair_id)
      );`,
      // 创建索引
      `CREATE INDEX IF NOT EXISTS idx_trading_bots_pair_id ON trading_bots(pair_id);`,
      `CREATE INDEX IF NOT EXISTS idx_trading_bots_active ON trading_bots(is_active);`,
    ];

    // 逐条执行SQL
    for (const sql of sqlStatements) {
      try {
        const response = await fetch(sqlApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': anonKey,
            'Authorization': `Bearer ${anonKey}`,
          },
          body: JSON.stringify({ sql }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('SQL执行失败:', errorText);
        }
      } catch (error) {
        console.error('SQL执行异常:', error);
      }
    }

    return NextResponse.json({
      success: true,
      message: '数据库表初始化完成',
      note: '请手动插入交易对数据',
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
