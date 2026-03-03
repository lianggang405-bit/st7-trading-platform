-- ============================================
-- 数据库表初始化脚本
-- ============================================
-- 此脚本用于创建缺失的表并插入初始数据
-- 在 Supabase SQL Editor 中执行此脚本
-- ============================================

-- 1. 创建 symbols 表（品种表）
CREATE TABLE IF NOT EXISTS public.symbols (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  alias VARCHAR(100),
  icon VARCHAR(255),
  type VARCHAR(50) DEFAULT 'forex',
  sort INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  flash_contract_fee NUMERIC(10, 2) DEFAULT 1.0,
  contract_size INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 插入 symbols 初始数据
INSERT INTO public.symbols (name, alias, icon, type, sort, is_visible, flash_contract_fee, contract_size)
VALUES
  ('BTC', 'Bitcoin', '/icons/btc.png', 'crypto', 1, true, 1.0, 100),
  ('ETH', 'Ethereum', '/icons/eth.png', 'crypto', 2, true, 1.0, 100),
  ('SOL', 'Solana', '/icons/sol.png', 'crypto', 3, true, 1.0, 100),
  ('XAUUSD', 'Gold', '/icons/gold.png', 'metal', 4, true, 1.0, 100),
  ('EURUSD', 'Euro/US Dollar', '/icons/eur.png', 'forex', 5, true, 0.1, 1000)
ON CONFLICT (name) DO NOTHING;

-- 2. 创建 symbol_types 表（品种类型表）
CREATE TABLE IF NOT EXISTS public.symbol_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  sort INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'normal',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 插入 symbol_types 初始数据
INSERT INTO public.symbol_types (name, sort, status)
VALUES
  ('加密货币', 1, 'normal'),
  ('外汇', 2, 'normal'),
  ('贵金属', 3, 'normal'),
  ('能源', 4, 'normal'),
  ('股指', 5, 'normal')
ON CONFLICT (name) DO NOTHING;

-- 3. 创建 trading_hours 表（交易时间表）
CREATE TABLE IF NOT EXISTS public.trading_hours (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(20) NOT NULL UNIQUE,
  monday_open TIME DEFAULT '00:00:00',
  monday_close TIME DEFAULT '23:59:59',
  tuesday_open TIME DEFAULT '00:00:00',
  tuesday_close TIME DEFAULT '23:59:59',
  wednesday_open TIME DEFAULT '00:00:00',
  wednesday_close TIME DEFAULT '23:59:59',
  thursday_open TIME DEFAULT '00:00:00',
  thursday_close TIME DEFAULT '23:59:59',
  friday_open TIME DEFAULT '00:00:00',
  friday_close TIME DEFAULT '23:59:59',
  saturday_open TIME DEFAULT '00:00:00',
  saturday_close TIME DEFAULT '00:00:00',
  sunday_open TIME DEFAULT '00:00:00',
  sunday_close TIME DEFAULT '00:00:00',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 插入 trading_hours 初始数据
INSERT INTO public.trading_hours (symbol)
VALUES
  ('BTCUSD'), ('ETHUSD'), ('XAUUSD'), ('EURUSD'), ('GBPUSD'), ('SOLUSD'), ('XRPUSD')
ON CONFLICT (symbol) DO NOTHING;

-- 4. 创建 crypto_addresses 表（加密货币地址表）
CREATE TABLE IF NOT EXISTS public.crypto_addresses (
  id SERIAL PRIMARY KEY,
  currency VARCHAR(20) NOT NULL,
  network VARCHAR(50),
  protocol VARCHAR(50) NOT NULL,
  address TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  usd_price NUMERIC(20, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 插入 crypto_addresses 初始数据
INSERT INTO public.crypto_addresses (currency, network, protocol, address, status, usd_price)
VALUES
  ('BTC', 'ERC20', 'ERC20', '0x1a2b3c4d5e6f...', 'active', 95000),
  ('ETH', 'ERC20', 'ERC20', '0x7f8e9d0a1b2c...', 'active', 3400),
  ('USDT', 'TRON', 'TRC20', 'T9zXq...8yV', 'active', 1),
  ('USDT', 'ERC20', 'ERC20', '0xd4e5f6a7b8c9...', 'active', 1);

-- 5. 创建 deposit_requests 表（充值申请表）
CREATE TABLE IF NOT EXISTS public.deposit_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  type VARCHAR(20) DEFAULT 'crypto',
  currency VARCHAR(20) NOT NULL,
  amount NUMERIC(20, 2) NOT NULL,
  tx_hash TEXT,
  proof_image TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  remark TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 插入 deposit_requests 初始数据
INSERT INTO public.deposit_requests (user_id, type, currency, amount, tx_hash, status)
VALUES
  (1, 'crypto', 'USDT', 1000, '0x1a2b3c...', 'approved'),
  (2, 'crypto', 'BTC', 0.05, 'abc123...', 'pending');

-- 6. 创建 withdrawal_requests 表（提现申请表）
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id SERIAL PRIMARY KEY,
  account VARCHAR(255) NOT NULL,
  currency VARCHAR(20) NOT NULL,
  withdrawal_address TEXT NOT NULL,
  withdrawal_amount NUMERIC(20, 2) NOT NULL,
  fee NUMERIC(20, 2) DEFAULT 0,
  actual_amount NUMERIC(20, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'PENDING',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 插入 withdrawal_requests 初始数据
INSERT INTO public.withdrawal_requests (account, currency, withdrawal_address, withdrawal_amount, fee, actual_amount, status)
VALUES
  ('user1@example.com', 'USDT', '0x7f8e9d...', 500, 5, 495, 'SUCCESS'),
  ('user2@example.com', 'BTC', 'bc1q...', 0.01, 0.001, 0.009, 'PENDING'),
  ('user3@example.com', 'ETH', '0xd4e5f6...', 0.5, 0.01, 0.49, 'FAIL');

-- 7. 创建 flash_contract_orders 表（闪合约订单表）
CREATE TABLE IF NOT EXISTS public.flash_contract_orders (
  id SERIAL PRIMARY KEY,
  account VARCHAR(255) NOT NULL,
  symbol VARCHAR(50) NOT NULL,
  type VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT '进行中',
  quantity NUMERIC(20, 2) NOT NULL,
  fee NUMERIC(20, 2) DEFAULT 0,
  result VARCHAR(50) DEFAULT '无',
  profit NUMERIC(20, 2) DEFAULT 0,
  open_price NUMERIC(20, 2),
  close_price NUMERIC(20, 2),
  duration INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 插入 flash_contract_orders 初始数据
INSERT INTO public.flash_contract_orders (account, symbol, type, status, quantity, fee, result, profit, open_price, close_price, duration)
VALUES
  ('user1@example.com', 'BTCUSD', '买入', '进行中', 1000, 10, '无', 0, 95000, NULL, 60),
  ('user2@example.com', 'ETHUSD', '卖出', '已完成', 500, 5, '盈利', 25, 3400, 3350, 30);

-- 8. 创建 quick_contract_durations 表（秒合约配置表）
CREATE TABLE IF NOT EXISTS public.quick_contract_durations (
  id SERIAL PRIMARY KEY,
  duration INTEGER NOT NULL UNIQUE,
  payout_rate NUMERIC(10, 2) NOT NULL,
  min_amount NUMERIC(20, 2) DEFAULT 10,
  max_amount NUMERIC(20, 2) DEFAULT 10000,
  status VARCHAR(20) DEFAULT 'active',
  sort INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 插入 quick_contract_durations 初始数据
INSERT INTO public.quick_contract_durations (duration, payout_rate, min_amount, max_amount, status, sort)
VALUES
  (30, 1.95, 10, 10000, 'active', 1),
  (60, 1.9, 10, 10000, 'active', 2),
  (120, 1.85, 10, 10000, 'active', 3),
  (300, 1.8, 10, 10000, 'active', 4),
  (600, 1.75, 10, 10000, 'active', 5)
ON CONFLICT (duration) DO NOTHING;

-- 9. 创建 wire_currency_settings 表（电汇币种设置表）
CREATE TABLE IF NOT EXISTS public.wire_currency_settings (
  id SERIAL PRIMARY KEY,
  currency_name VARCHAR(10) NOT NULL UNIQUE,
  usd_price NUMERIC(20, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 插入 wire_currency_settings 初始数据
INSERT INTO public.wire_currency_settings (currency_name, usd_price)
VALUES
  ('USD', 1),
  ('EUR', 1.0856),
  ('GBP', 1.2654)
ON CONFLICT (currency_name) DO NOTHING;

-- 10. 创建 demo_flash_contract_orders 表（演示闪合约订单表）
CREATE TABLE IF NOT EXISTS public.demo_flash_contract_orders (
  id SERIAL PRIMARY KEY,
  account VARCHAR(255) NOT NULL,
  symbol VARCHAR(50) NOT NULL,
  type VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT '进行中',
  quantity NUMERIC(20, 2) NOT NULL,
  fee NUMERIC(20, 2) DEFAULT 0,
  result VARCHAR(50) DEFAULT '无',
  profit NUMERIC(20, 2) DEFAULT 0,
  open_price NUMERIC(20, 2),
  close_price NUMERIC(20, 2),
  duration INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 插入 demo_flash_contract_orders 初始数据
INSERT INTO public.demo_flash_contract_orders (account, symbol, type, status, quantity, fee, result, profit, open_price, close_price, duration)
VALUES
  ('demo1@example.com', 'BTCUSD', '买入', '进行中', 1000, 10, '无', 0, 95000, NULL, 60),
  ('demo2@example.com', 'ETHUSD', '卖出', '已完成', 500, 5, '盈利', 25, 3400, 3350, 30);

-- 11. 创建 demo_contract_orders 表（演示合约订单表）
CREATE TABLE IF NOT EXISTS public.demo_contract_orders (
  id SERIAL PRIMARY KEY,
  account VARCHAR(255) NOT NULL,
  symbol VARCHAR(50) NOT NULL,
  type VARCHAR(20) NOT NULL,
  direction VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'open',
  quantity NUMERIC(20, 2) NOT NULL,
  open_price NUMERIC(20, 2),
  close_price NUMERIC(20, 2),
  leverage INTEGER DEFAULT 1,
  margin NUMERIC(20, 2) DEFAULT 0,
  profit NUMERIC(20, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 插入 demo_contract_orders 初始数据
INSERT INTO public.demo_contract_orders (account, symbol, type, direction, status, quantity, open_price, close_price, leverage, margin, profit)
VALUES
  ('demo1@example.com', 'BTCUSD', '买入', 'long', 'open', 1, 95000, NULL, 10, 10000, 0),
  ('demo2@example.com', 'ETHUSD', '卖出', 'short', 'closed', 2, 3400, 3300, 5, 1360, 200);

-- 12. 创建 project_orders 表（项目订单表）
CREATE TABLE IF NOT EXISTS public.project_orders (
  id SERIAL PRIMARY KEY,
  account VARCHAR(255) NOT NULL,
  symbol VARCHAR(50) NOT NULL,
  type VARCHAR(20) NOT NULL,
  side VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'open',
  quantity NUMERIC(20, 2) NOT NULL,
  price NUMERIC(20, 2),
  filled_quantity NUMERIC(20, 2) DEFAULT 0,
  filled_price NUMERIC(20, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 插入 project_orders 初始数据
INSERT INTO public.project_orders (account, symbol, type, side, status, quantity, price, filled_quantity, filled_price)
VALUES
  ('user1@example.com', 'BTCUSD', '市价单', 'buy', 'filled', 0.5, 95000, 0.5, 95000),
  ('user2@example.com', 'ETHUSD', '限价单', 'sell', 'pending', 1, 3500, 0, NULL);

-- ============================================
-- 验证表是否创建成功
-- ============================================

-- 查看所有创建的表
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN (
    'symbols',
    'symbol_types',
    'trading_hours',
    'crypto_addresses',
    'deposit_requests',
    'withdrawal_requests',
    'flash_contract_orders',
    'quick_contract_durations',
    'wire_currency_settings',
    'demo_flash_contract_orders',
    'demo_contract_orders',
    'project_orders'
  )
ORDER BY table_name;

-- ============================================
-- 完成！
-- ============================================
