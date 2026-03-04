-- ============================================
-- 完整数据库初始化脚本
-- 包含用户端和管理端需要的所有表
-- ============================================

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. Users 表（用户表）
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  username VARCHAR(100) NOT NULL,
  account_type VARCHAR(20) DEFAULT 'demo' NOT NULL CHECK (account_type IN ('demo', 'real')),
  balance DECIMAL(20, 2) DEFAULT 0 NOT NULL,
  credit_score INTEGER DEFAULT 100,
  is_verified BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  parent_id INTEGER,
  invite_code VARCHAR(50),
  user_level VARCHAR(50) DEFAULT '1',
  status VARCHAR(20) DEFAULT '正常' NOT NULL,
  is_demo BOOLEAN DEFAULT false NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  last_login_at TIMESTAMP WITH TIME ZONE,
  remark TEXT
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_account_type ON users(account_type);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_is_demo ON users(is_demo);

-- ============================================
-- 2. Orders 表（用户端交易订单表）
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(100) PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255),
  symbol VARCHAR(20) NOT NULL,
  side VARCHAR(10) NOT NULL CHECK (side IN ('buy', 'sell')),
  order_type VARCHAR(20) DEFAULT 'market' NOT NULL CHECK (order_type IN ('market', 'limit')),
  quantity DECIMAL(20, 2) NOT NULL,
  price DECIMAL(20, 2) NOT NULL,
  leverage INTEGER DEFAULT 1,
  status VARCHAR(20) DEFAULT 'open' NOT NULL CHECK (status IN ('open', 'closed', 'cancelled', 'pending')),
  profit DECIMAL(20, 2) DEFAULT 0,
  margin DECIMAL(20, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_symbol ON orders(symbol);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(email);

-- ============================================
-- 3. Contract Orders 表（管理端合约订单表）
-- ============================================
CREATE TABLE IF NOT EXISTS contract_orders (
  id SERIAL PRIMARY KEY,
  account VARCHAR(255) NOT NULL,
  symbol VARCHAR(50) NOT NULL,
  trade_type VARCHAR(10) NOT NULL CHECK (trade_type IN ('买入', '卖出')),
  status VARCHAR(20) DEFAULT '待成交' NOT NULL CHECK (status IN ('待成交', '持仓中', '已平仓', '已取消')),
  original_price DECIMAL(30, 9) DEFAULT 0 NOT NULL,
  open_price DECIMAL(30, 9) DEFAULT 0 NOT NULL,
  current_price DECIMAL(30, 9) DEFAULT 0 NOT NULL,
  take_profit DECIMAL(30, 9) DEFAULT 0 NOT NULL,
  stop_loss DECIMAL(30, 9) DEFAULT 0 NOT NULL,
  lots INTEGER DEFAULT 0 NOT NULL,
  leverage INTEGER DEFAULT 100 NOT NULL,
  initial_margin DECIMAL(30, 9) DEFAULT 0 NOT NULL,
  available_margin DECIMAL(30, 9) DEFAULT 0 NOT NULL,
  fee DECIMAL(30, 9) DEFAULT 0 NOT NULL,
  profit DECIMAL(30, 9) DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  closed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_contract_orders_account ON contract_orders(account);
CREATE INDEX IF NOT EXISTS idx_contract_orders_symbol ON contract_orders(symbol);
CREATE INDEX IF NOT EXISTS idx_contract_orders_status ON contract_orders(status);
CREATE INDEX IF NOT EXISTS idx_contract_orders_created_at ON contract_orders(created_at DESC);

-- ============================================
-- 4. Positions 表（持仓表）
-- ============================================
CREATE TABLE IF NOT EXISTS positions (
  id VARCHAR(100) PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol VARCHAR(20) NOT NULL,
  side VARCHAR(10) NOT NULL CHECK (side IN ('buy', 'sell')),
  volume DECIMAL(20, 2) NOT NULL,
  open_price DECIMAL(20, 2) NOT NULL,
  current_price DECIMAL(20, 2) NOT NULL,
  profit DECIMAL(20, 2) DEFAULT 0,
  leverage INTEGER,
  open_time TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  close_time TIMESTAMP WITH TIME ZONE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_positions_user_id ON positions(user_id);
CREATE INDEX IF NOT EXISTS idx_positions_symbol ON positions(symbol);
CREATE INDEX IF NOT EXISTS idx_positions_side ON positions(side);
CREATE INDEX IF NOT EXISTS idx_positions_open_time ON positions(open_time DESC);
CREATE INDEX IF NOT EXISTS idx_positions_close_time ON positions(close_time);

-- ============================================
-- 5. Applications 表（申请表）
-- ============================================
CREATE TABLE IF NOT EXISTS applications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('deposit', 'withdraw', 'verification')),
  status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  amount DECIMAL(20, 2),
  bank_name VARCHAR(100),
  bank_account VARCHAR(100),
  real_name VARCHAR(100),
  id_card VARCHAR(50),
  id_card_front_url TEXT,
  id_card_back_url TEXT,
  reject_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  reviewed_by VARCHAR(100),
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_type ON applications(type);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at DESC);

-- ============================================
-- 6. Credit Adjustments 表（信用调整记录表）
-- ============================================
CREATE TABLE IF NOT EXISTS credit_adjustments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  before_score INTEGER NOT NULL,
  after_score INTEGER NOT NULL,
  change_value INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_by VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_credit_adjustments_user_id ON credit_adjustments(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_adjustments_created_at ON credit_adjustments(created_at DESC);

-- ============================================
-- 7. Market Adjustments 表（市场调控记录表）
-- ============================================
CREATE TABLE IF NOT EXISTS market_adjustments (
  id SERIAL PRIMARY KEY,
  action VARCHAR(20) NOT NULL CHECK (action IN ('rise', 'fall', 'flat')),
  symbol VARCHAR(20) NOT NULL,
  before_price DECIMAL(20, 2) NOT NULL,
  after_price DECIMAL(20, 2) NOT NULL,
  change_percent DECIMAL(10, 2),
  created_by VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_market_adjustments_symbol ON market_adjustments(symbol);
CREATE INDEX IF NOT EXISTS idx_market_adjustments_created_at ON market_adjustments(created_at DESC);

-- ============================================
-- 8. Trading Pairs 表（交易对表）
-- ============================================
CREATE TABLE IF NOT EXISTS trading_pairs (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(20) UNIQUE NOT NULL,
  currency_id INTEGER NOT NULL,
  is_visible BOOLEAN DEFAULT true,
  min_order_size DECIMAL(20, 8) DEFAULT 0.001,
  max_order_size DECIMAL(20, 8) DEFAULT 999999,
  contract_fee DECIMAL(5, 2) DEFAULT 0.1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_trading_pairs_symbol ON trading_pairs(symbol);
CREATE INDEX IF NOT EXISTS idx_trading_pairs_visible ON trading_pairs(is_visible);

-- ============================================
-- 9. Trading Bots 表（调控机器人表）
-- ============================================
CREATE TABLE IF NOT EXISTS trading_bots (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  pair_id INTEGER NOT NULL REFERENCES trading_pairs(id) ON DELETE CASCADE,
  float_value DECIMAL(20, 8) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(pair_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_trading_bots_pair_id ON trading_bots(pair_id);
CREATE INDEX IF NOT EXISTS idx_trading_bots_active ON trading_bots(is_active);

-- ============================================
-- 创建更新时间触发器函数
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================
-- 为需要的表添加更新时间触发器
-- ============================================
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_applications_updated_at ON applications;
CREATE TRIGGER update_applications_updated_at
    BEFORE UPDATE ON applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_trading_pairs_updated_at ON trading_pairs;
CREATE TRIGGER update_trading_pairs_updated_at
    BEFORE UPDATE ON trading_pairs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_trading_bots_updated_at ON trading_bots;
CREATE TRIGGER update_trading_bots_updated_at
    BEFORE UPDATE ON trading_bots
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 插入示例数据（可选）
-- ============================================

-- 插入示例用户
INSERT INTO users (email, password_hash, username, account_type, balance, is_demo)
VALUES
  ('demo@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhW', 'demo_user', 'demo', 100000.00, true),
  ('real@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhW', 'real_user', 'real', 0.00, false)
ON CONFLICT (email) DO NOTHING;

-- 插入默认交易对
INSERT INTO trading_pairs (symbol, currency_id, is_visible, min_order_size, max_order_size, contract_fee)
VALUES
  ('BTC/USDT', 1, true, 0.001, 100, 0.1),
  ('ETH/USDT', 2, true, 0.01, 1000, 0.1),
  ('XAU/USD', 3, true, 0.01, 100, 0.1),
  ('XAU/USDT', 4, true, 0.01, 100, 0.1)
ON CONFLICT (symbol) DO NOTHING;

-- 插入示例合约订单（管理端）
INSERT INTO contract_orders (
  account, symbol, trade_type, status, 
  original_price, open_price, current_price, take_profit, stop_loss,
  lots, leverage, initial_margin, available_margin, fee, profit,
  created_at, closed_at, completed_at
) VALUES
  (
    'ko270839@gmail.com', 'XAUUSD', '卖出', '已平仓',
    5196.500000000, 5196.500000000, 5194.590000000, 0.000000000, 0.000000000,
    0, 500, 259.825000000, 259.825000000, 1.000000000, 47.750000000,
    '2026-02-27 14:25:43', '2026-02-27 14:44:36', '2026-02-27 14:44:36'
  ),
  (
    'lzhibo21900@gmail.com', 'XAUUSD', '买入', '已平仓',
    5169.630000000, 5169.630000000, 5172.190000000, 0.000000000, 0.000000000,
    120, 100, 622474.800000000, 622474.800000000, 120.000000000, 45000.000000000,
    '2026-02-27 12:16:54', '2026-02-27 12:24:25', '2026-02-27 12:24:25'
  ),
  (
    'ko270839@gmail.com', 'XAUUSD', '买入', '已平仓',
    5148.690000000, 5148.690000000, 5151.690000000, 0.000000000, 0.000000000,
    120, 100, 622291.200000000, 622291.200000000, 120.000000000, 1680.000000000,
    '2026-02-27 12:15:05', '2026-02-27 12:15:14', '2026-02-27 12:15:14'
  ),
  (
    'user001@email.com', 'BTC', '卖出', '已平仓',
    95000.000000000, 95000.000000000, 94800.000000000, 94000.000000000, 96000.000000000,
    1, 200, 475.000000000, 475.000000000, 10.000000000, 200.000000000,
    '2026-02-27 10:00:00', '2026-02-27 10:05:00', '2026-02-27 10:05:00'
  ),
  (
    'user002@email.com', 'ETH', '买入', '持仓中',
    3500.000000000, 3500.000000000, 3550.000000000, 3600.000000000, 3400.000000000,
    5, 100, 175.000000000, 175.000000000, 5.000000000, 250.000000000,
    '2026-02-27 09:30:00', NULL, NULL
  )
ON CONFLICT DO NOTHING;

-- ============================================
-- 完成
-- ============================================
SELECT '✅ Complete database initialized successfully!' as status;
