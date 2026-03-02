import { NextResponse } from 'next/server';
import { getSupabaseCredentials } from '@/storage/database/supabase-client';

// POST - 通过 Supabase SQL API 创建 orders 表（使用 pgrest 的 sql API）
export async function POST() {
  try {
    const { url, anonKey } = getSupabaseCredentials();

    // 使用 Supabase 的 SQL API
    const sqlApiUrl = `${url}/rest/v1/sql`;

    // 创建 orders 表的完整 SQL
    const sql = `
      -- 创建 orders 表
      CREATE TABLE IF NOT EXISTS orders (
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
      );

      -- 创建索引
      CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
      CREATE INDEX IF NOT EXISTS idx_orders_symbol ON orders(symbol);
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
      CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, status);

      -- 创建外键约束（使用条件判断避免重复创建）
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'fk_orders_user_id'
        ) THEN
          ALTER TABLE orders ADD CONSTRAINT fk_orders_user_id 
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        END IF;
      END
      $$;

      -- 创建触发器函数
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      -- 创建触发器
      DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
      CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `;

    console.log('[Init Orders SQL] Executing SQL...');

    // 使用 Supabase 的 SQL API
    const response = await fetch(sqlApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ query: sql }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Init Orders SQL] SQL execution failed:', errorText);
      return NextResponse.json({
        success: false,
        error: 'SQL 执行失败',
        details: errorText,
      });
    }

    const result = await response.json();
    console.log('[Init Orders SQL] SQL executed successfully:', result);

    return NextResponse.json({
      success: true,
      message: 'Orders 表初始化成功',
      details: {
        tableName: 'orders',
        result,
      },
    });
  } catch (error) {
    console.error('[Init Orders SQL] Initialization failed:', error);
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
