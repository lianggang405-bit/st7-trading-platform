import { Pool } from 'pg';

// 浠庣幆澧冨彉閲忚幏鍙?Supabase 杩炴帴淇℃伅
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 瑙ｆ瀽 Supabase URL 鑾峰彇鏁版嵁搴撹繛鎺ヤ俊鎭?const connectionString = supabaseUrl?.replace('https://', 'postgresql://postgres:') + `:${process.env.COZE_SUPABASE_DB_PASSWORD || ''}@${supabaseUrl?.replace('https://', '')}/postgres`;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || connectionString,
});

async function createOrdersTable() {
  console.log('[Create Orders Table] Starting...');

  try {
    // 鍒涘缓 orders 琛ㄧ殑 SQL
    const sql = `
      -- 鍒涘缓 orders 琛?      CREATE TABLE IF NOT EXISTS orders (
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

      -- 鍒涘缓绱㈠紩
      CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
      CREATE INDEX IF NOT EXISTS idx_orders_symbol ON orders(symbol);
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
      CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, status);

      -- 鍒涘缓澶栭敭绾︽潫
      ALTER TABLE orders ADD CONSTRAINT IF NOT EXISTS fk_orders_user_id 
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

      -- 鍒涘缓瑙﹀彂鍣ㄥ嚱鏁?      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      -- 鍒涘缓瑙﹀彂鍣?      DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
      CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `;

    // 鎵ц SQL
    await pool.query(sql);
    console.log('[Create Orders Table] SQL executed successfully');

    // 楠岃瘉琛ㄥ垱寤烘垚鍔?    const result = await pool.query(`
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
    throw error;
  } finally {
    await pool.end();
  }
}

// 濡傛灉鐩存帴杩愯姝よ剼鏈?if (require.main === module) {
  createOrdersTable()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('[Create Orders Table] Failed:', error);
      process.exit(1);
    });
}

export { createOrdersTable };

