import { Pool } from 'pg';

// 从环境变量获取 Supabase 连接信息
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 解析 Supabase URL 获取数据库连接信息
const connectionString = supabaseUrl 
  ? supabaseUrl.replace('https://', 'postgresql://postgres:') + `:${process.env.SUPABASE_DB_PASSWORD || ''}@db.${supabaseUrl.replace('https://', '')}:5432/postgres`
  : '';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || connectionString,
});

async function createOrdersTable() {
  console.log('[Create Orders Table] Starting...');

  try {
    // 创建 orders 表的 SQL
    const sql = `
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

      -- 创建外键约束 (如果 users 表存在)
      DO $$ 
      BEGIN 
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
          ALTER TABLE orders DROP CONSTRAINT IF EXISTS fk_orders_user_id;
          ALTER TABLE orders ADD CONSTRAINT fk_orders_user_id 
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        END IF;
      END $$;

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

    // 执行 SQL
    if (!pool.options.connectionString) {
        console.warn('[Create Orders Table] No connection string provided, skipping table creation.');
        return { success: false, reason: 'No connection string' };
    }

    await pool.query(sql);
    console.log('[Create Orders Table] SQL executed successfully');

    // 验证表创建成功
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'orders'
      ORDER BY ordinal_position;
    `);

    console.log('[Create Orders Table] Table columns:', result.rows);

    console.log('[Create Orders Table] Success! Orders table created with', result.rows.length, 'columns');

    return { success: true, columns: result.rows };
  } catch (error) {
    console.error('[Create Orders Table] Error:', error);
    // Don't throw error to avoid build failure if DB is not reachable during build
    return { success: false, error };
  } finally {
    await pool.end();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  createOrdersTable()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('[Create Orders Table] Failed:', error);
      process.exit(1);
    });
}

export { createOrdersTable };
