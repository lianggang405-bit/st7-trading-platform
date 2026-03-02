# Supabase 数据库初始化指南

## 手动创建交易对和调控机器人表

### 步骤 1: 登录 Supabase 管理界面

1. 访问 https://app.supabase.com
2. 选择你的项目
3. 进入 SQL Editor

### 步骤 2: 执行以下SQL脚本

```sql
-- 创建交易对表
CREATE TABLE IF NOT EXISTS trading_pairs (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(20) UNIQUE NOT NULL,
  currency_id INTEGER NOT NULL,
  is_visible BOOLEAN DEFAULT true,
  min_order_size DECIMAL(20, 8) DEFAULT 0.001,
  max_order_size DECIMAL(20, 8) DEFAULT 999999,
  contract_fee DECIMAL(5, 2) DEFAULT 0.1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_trading_pairs_symbol ON trading_pairs(symbol);
CREATE INDEX IF NOT EXISTS idx_trading_pairs_visible ON trading_pairs(is_visible);

-- 创建调控机器人表
CREATE TABLE IF NOT EXISTS trading_bots (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  pair_id INTEGER NOT NULL REFERENCES trading_pairs(id) ON DELETE CASCADE,
  float_value DECIMAL(20, 8) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(pair_id) -- 每个交易对只能有一个调控机器人
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_trading_bots_pair_id ON trading_bots(pair_id);
CREATE INDEX IF NOT EXISTS idx_trading_bots_active ON trading_bots(is_active);

-- 插入默认交易对
INSERT INTO trading_pairs (symbol, currency_id, is_visible, min_order_size, max_order_size, contract_fee)
VALUES
  ('BTC/USDT', 1, true, 0.001, 100, 0.1),
  ('ETH/USDT', 2, true, 0.01, 1000, 0.1),
  ('XAU/USD', 3, true, 0.01, 100, 0.1),
  ('XAU/USDT', 4, true, 0.01, 100, 0.1)
ON CONFLICT (symbol) DO NOTHING;
```

### 步骤 3: 验证表创建

执行以下SQL查询，确认表已创建成功：

```sql
SELECT * FROM trading_pairs;
SELECT * FROM trading_bots;
```

### 步骤 4: 重启应用

表创建完成后，重启应用以刷新schema缓存：

```bash
# 停止当前运行的服务（如果在运行）
# 然后重新启动
coze dev
```

## 功能说明

### 交易对表 (trading_pairs)

- `id`: 主键
- `symbol`: 交易对符号（如 BTC/USDT）
- `currency_id`: 货币ID
- `is_visible`: 是否可见
- `min_order_size`: 最小订单大小
- `max_order_size`: 最大订单大小
- `contract_fee`: 合约手续费

### 调控机器人表 (trading_bots)

- `id`: 主键
- `name`: 机器人名称
- `pair_id`: 关联交易对ID（外键）
- `float_value`: 浮点值（用于价格偏移）
- `is_active`: 是否激活

### 约束说明

- 每个交易对只能有一个调控机器人（UNIQUE约束）
- 删除交易对时会级联删除对应的调控机器人（ON DELETE CASCADE）
- 交易对符号必须唯一（UNIQUE约束）

## API端点

创建表后，以下API将可用：

- `GET /api/admin/trading/adjust` - 获取所有交易对及其调控状态
- `POST /api/admin/trading/adjust` - 创建或更新调控机器人
- `PUT /api/admin/trading/adjust` - 切换调控机器人开关

## 前端页面

访问管理端页面：`/admin/trading/bots`

功能包括：
- 显示所有交易对
- 切换调控开关
- 设置浮点值
- 查看调控状态
