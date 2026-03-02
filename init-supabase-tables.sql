-- ============================================
-- Supabase 表结构初始化脚本
-- 与 database-service.ts 接口保持一致
-- ============================================

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Users 表
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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_account_type ON users(account_type);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- ============================================
-- Applications 表
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
-- Market Adjustments 表
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
-- Credit Adjustments 表
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
-- Positions 表
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

-- ============================================
-- 插入默认数据（可选）
-- ============================================

-- 插入测试用户（仅用于开发环境）
-- 注意：密码需要使用 bcrypt 哈希后的值
-- INSERT INTO users (email, password_hash, username, account_type, balance)
-- VALUES
--   ('demo@example.com', '$2a$10$...', 'demo_user', 'demo', 100000.00),
--   ('real@example.com', '$2a$10$...', 'real_user', 'real', 0.00);

-- 完成
SELECT 'Supabase tables initialized successfully!' as status;
