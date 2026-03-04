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

-- ============================================
-- 10. Crypto Addresses 表（数字货币地址表）
-- ============================================
CREATE TABLE IF NOT EXISTS crypto_addresses (
  id SERIAL PRIMARY KEY,
  currency VARCHAR(50) NOT NULL,
  protocol VARCHAR(50),
  network VARCHAR(50),
  address TEXT NOT NULL,
  usd_price DECIMAL(30, 8) DEFAULT 0 NOT NULL,
  status VARCHAR(20) DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'inactive', 'maintenance')),
  created_by VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_crypto_addresses_currency ON crypto_addresses(currency);
CREATE INDEX IF NOT EXISTS idx_crypto_addresses_protocol ON crypto_addresses(protocol);
CREATE INDEX IF NOT EXISTS idx_crypto_addresses_status ON crypto_addresses(status);
CREATE INDEX IF NOT EXISTS idx_crypto_addresses_created_at ON crypto_addresses(created_at DESC);

-- ============================================
-- 11. Financial Records 表（财务记录表）
-- ============================================
CREATE TABLE IF NOT EXISTS financial_records (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_id INTEGER,
  account_type VARCHAR(20) DEFAULT 'demo' NOT NULL CHECK (account_type IN ('demo', 'real')),
  operation_type VARCHAR(50) NOT NULL,
  amount DECIMAL(20, 2) NOT NULL,
  balance_before DECIMAL(20, 2) NOT NULL,
  balance_after DECIMAL(20, 2) NOT NULL,
  description TEXT,
  reference_id VARCHAR(100),
  reference_type VARCHAR(50),
  status VARCHAR(20) DEFAULT 'completed' NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  created_by VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_financial_records_user_id ON financial_records(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_records_account_type ON financial_records(account_type);
CREATE INDEX IF NOT EXISTS idx_financial_records_operation_type ON financial_records(operation_type);
CREATE INDEX IF NOT EXISTS idx_financial_records_status ON financial_records(status);
CREATE INDEX IF NOT EXISTS idx_financial_records_created_at ON financial_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_financial_records_reference ON financial_records(reference_id, reference_type);

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

DROP TRIGGER IF EXISTS update_financial_records_updated_at ON financial_records;
CREATE TRIGGER update_financial_records_updated_at
    BEFORE UPDATE ON financial_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_crypto_addresses_updated_at ON crypto_addresses;
CREATE TRIGGER update_crypto_addresses_updated_at
    BEFORE UPDATE ON crypto_addresses
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
-- 插入示例数字货币地址
-- ============================================
INSERT INTO crypto_addresses (
  currency, protocol, network, address, usd_price, status, created_by, created_at
) VALUES
  ('BTC', 'ERC20', 'Ethereum', '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0', 95000.00, 'active', 'admin', NOW()),
  ('ETH', 'ERC20', 'Ethereum', '0x7f8e9d0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e', 3400.00, 'active', 'admin', NOW()),
  ('USDT', 'TRC20', 'TRON', 'T9zXqYvW5uT4sR3qP2oN1mK0jL9kI8jH7gF6e', 1.00, 'active', 'admin', NOW()),
  ('USDT', 'ERC20', 'Ethereum', '0xd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e', 1.00, 'active', 'admin', NOW())
ON CONFLICT DO NOTHING;

-- ============================================
-- 插入示例财务记录
-- ============================================
INSERT INTO financial_records (
  user_id, wallet_id, account_type, operation_type,
  amount, balance_before, balance_after,
  description, reference_id, reference_type,
  status, created_by, created_at
) VALUES
  (1, 1, 'demo', 'deposit', 100000.00, 0.00, 100000.00,
   '初始资金充值', NULL, 'initial', 'completed', 'system', '2026-02-27 09:00:00'),
  (1, 1, 'demo', 'trade_profit', 200.00, 100000.00, 100200.00,
   'BTC交易盈利', 'order_1', 'trade', 'completed', 'system', '2026-02-27 10:05:00'),
  (1, 1, 'demo', 'trade_fee', -10.00, 100200.00, 100190.00,
   'BTC交易手续费', 'order_1', 'fee', 'completed', 'system', '2026-02-27 10:05:00'),
  (1, 1, 'demo', 'withdraw', -5000.00, 100190.00, 95190.00,
   '提现申请', 'withdraw_1', 'withdrawal', 'completed', 'admin', '2026-02-27 11:00:00'),
  (1, 1, 'demo', 'deposit', 20000.00, 95190.00, 115190.00,
   '银行转账充值', 'deposit_1', 'deposit', 'completed', 'admin', '2026-02-27 12:00:00'),
  (1, 1, 'demo', 'trade_profit', 1680.00, 115190.00, 116870.00,
   'XAUUSD交易盈利', 'order_2', 'trade', 'completed', 'system', '2026-02-27 12:15:14'),
  (1, 1, 'demo', 'trade_fee', -120.00, 116870.00, 116750.00,
   'XAUUSD交易手续费', 'order_2', 'fee', 'completed', 'system', '2026-02-27 12:15:14'),
  (1, 1, 'demo', 'trade_profit', 45000.00, 116750.00, 161750.00,
   'XAUUSD交易盈利', 'order_3', 'trade', 'completed', 'system', '2026-02-27 12:24:25'),
  (1, 1, 'demo', 'trade_fee', -120.00, 161750.00, 161630.00,
   'XAUUSD交易手续费', 'order_3', 'fee', 'completed', 'system', '2026-02-27 12:24:25'),
  (1, 1, 'demo', 'trade_profit', 47.75, 161630.00, 161677.75,
   'XAUUSD交易盈利', 'order_4', 'trade', 'completed', 'system', '2026-02-27 14:44:36')
ON CONFLICT DO NOTHING;

-- ============================================
-- 完成
-- ============================================
SELECT '✅ Complete database initialized successfully!' as status;
