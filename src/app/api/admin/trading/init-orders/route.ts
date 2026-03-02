import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST - 初始化 orders 表
export async function POST() {
  try {
    console.log('[Init Orders API] Starting orders table initialization...');

    // 1. 创建 orders 表
    const createTableSQL = `
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
    `;

    // 2. 创建索引
    const createIndexesSQL = [
      `CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);`,
      `CREATE INDEX IF NOT EXISTS idx_orders_symbol ON orders(symbol);`,
      `CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);`,
      `CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);`,
      `CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, status);`,
    ];

    // 3. 创建外键约束（使用条件判断避免重复创建）
    const createForeignKeySQL = `
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
    `;

    // 4. 创建触发器函数
    const createTriggerFunctionSQL = `
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `;

    // 5. 创建触发器
    const createTriggerSQL = `
      DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
      CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `;

    // 执行 SQL 命令
    try {
      // 创建表
      await supabase.rpc('exec_sql', { sql: createTableSQL });
      console.log('[Init Orders API] Orders table created');
    } catch (error: any) {
      console.error('[Init Orders API] Error creating table:', error);
      // 继续执行，表可能已存在
    }

    try {
      // 创建索引
      for (const indexSQL of createIndexesSQL) {
        await supabase.rpc('exec_sql', { sql: indexSQL });
      }
      console.log('[Init Orders API] Indexes created');
    } catch (error: any) {
      console.error('[Init Orders API] Error creating indexes:', error);
    }

    try {
      // 创建外键约束
      await supabase.rpc('exec_sql', { sql: createForeignKeySQL });
      console.log('[Init Orders API] Foreign key constraint created');
    } catch (error: any) {
      console.error('[Init Orders API] Error creating foreign key:', error);
    }

    try {
      // 创建触发器函数
      await supabase.rpc('exec_sql', { sql: createTriggerFunctionSQL });
      console.log('[Init Orders API] Trigger function created');
    } catch (error: any) {
      console.error('[Init Orders API] Error creating trigger function:', error);
    }

    try {
      // 创建触发器
      await supabase.rpc('exec_sql', { sql: createTriggerSQL });
      console.log('[Init Orders API] Trigger created');
    } catch (error: any) {
      console.error('[Init Orders API] Error creating trigger:', error);
    }

    // 验证表是否创建成功
    const { data: tables, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'orders')
      .single();

    if (checkError || !tables) {
      console.error('[Init Orders API] Failed to verify table creation:', checkError);
      return NextResponse.json(
        {
          success: false,
          error: '验证表创建失败',
        },
        { status: 500 }
      );
    }

    console.log('[Init Orders API] Orders table initialization completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Orders 表初始化成功',
      details: {
        tableName: 'orders',
        indexes: ['user_id', 'symbol', 'status', 'created_at', 'user_id+status'],
        triggers: ['update_orders_updated_at'],
        constraints: ['fk_orders_user_id'],
      },
    });
  } catch (error) {
    console.error('[Init Orders API] Initialization failed:', error);
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
