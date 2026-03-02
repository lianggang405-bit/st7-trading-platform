-- =================================================================
-- Orders 表初始化 SQL 脚本
-- 请在 Supabase 控制台的 SQL Editor 中执行此脚本
-- =================================================================

-- 1. 创建 orders 表
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

-- 2. 创建索引
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_symbol ON orders(symbol);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, status);

-- 3. 创建外键约束（PostgreSQL 不支持 ALTER TABLE ... ADD CONSTRAINT IF NOT EXISTS）
-- 如果约束已存在，此语句会报错，但不会影响表结构
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

-- 4. 创建触发器函数（用于自动更新 updated_at）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. 创建触发器
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. 验证表创建成功
SELECT 
  'orders 表创建成功' as message,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'orders') as column_count;
