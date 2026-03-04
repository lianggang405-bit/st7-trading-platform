-- ============================================
-- Contract Orders 表（合约订单）
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
-- 插入一些示例数据
-- ============================================
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
SELECT '✅ Contract Orders table created successfully!' as status;
