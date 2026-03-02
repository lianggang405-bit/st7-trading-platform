import { NextResponse } from 'next/server';
import { getSupabaseCredentials } from '@/storage/database/supabase-client';

// POST - 直接通过 Supabase SQL API 创建 orders 表
export async function POST() {
  try {
    const { url, anonKey } = getSupabaseCredentials();
    const sqlApiUrl = `${url}/rest/v1/rpc/exec_sql`;

    // 创建 orders 表的完整 SQL
    const sqlStatements = [
      // 创建表
      `CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        email VARCHAR(255),
        symbol VARCHAR(20) NOT NULL,
        side VARCHAR(4) NOT NULL CHECK (side IN ('buy', 'sell')),
        order_type VARCHAR(10) NOT NULL DEFAULT 'market' CHECK (order_type IN ('market', 'limit', 'stop')),
        quantity DECIMAL(20, 8) NOT NULL,
        price DECIMAL(20, 8) NOT NULL,
        leverage INTEGER DEFAULT 1,
        status VARCHAR(10) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'cancelled', 'filled')),
        profit DECIMAL(20, 8) DEFAULT 0,
        margin DECIMAL(20, 8) NOT NULL,
        stop_loss_price DECIMAL(20, 8),
        take_profit_price DECIMAL(20, 8),
        close_price DECIMAL(20, 8),
        closed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`,
      // 创建索引
      `CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);`,
      `CREATE INDEX IF NOT EXISTS idx_orders_symbol ON orders(symbol);`,
      `CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);`,
      `CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);`,
      `CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, status);`,
      // 创建外键约束
      `ALTER TABLE orders ADD CONSTRAINT IF NOT EXISTS fk_orders_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;`,
    ];

    const results = [];
    const errors = [];

    // 逐条执行 SQL
    for (const sql of sqlStatements) {
      try {
        console.log(`[Init Orders Direct] Executing: ${sql.substring(0, 50)}...`);

        // 使用 Supabase 的 SQL API
        const response = await fetch(sqlApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': anonKey,
            'Authorization': `Bearer ${anonKey}`,
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({ sql }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[Init Orders Direct] SQL execution failed:`, errorText);
          errors.push({ sql, error: errorText });
        } else {
          results.push({ sql, status: 'success' });
          console.log(`[Init Orders Direct] SQL executed successfully`);
        }
      } catch (error: any) {
        console.error(`[Init Orders Direct] SQL execution error:`, error);
        errors.push({ sql, error: error.message });
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        error: '部分 SQL 执行失败',
        details: errors,
        successful: results.length,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Orders 表初始化成功',
      details: {
        tableName: 'orders',
        statementsExecuted: results.length,
        results,
      },
    });
  } catch (error) {
    console.error('[Init Orders Direct] Initialization failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: '初始化失败',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
