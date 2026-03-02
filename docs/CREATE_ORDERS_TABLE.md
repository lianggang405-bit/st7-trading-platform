# Orders 表创建指南

## 概述

本文档说明如何在 Supabase 数据库中创建 `orders` 表，以支持交易功能。

## 方法一：通过 Supabase 控制台（推荐）

### 步骤

1. **登录 Supabase 控制台**
   - 访问：https://app.supabase.com
   - 登录你的账户
   - 选择项目：brfzboxaxknlypapwajy

2. **打开 SQL Editor**
   - 在左侧菜单中，找到并点击 "SQL Editor"
   - 点击 "New query" 创建新查询

3. **执行 SQL 脚本**
   - 复制以下 SQL 脚本
   - 粘贴到 SQL Editor 中
   - 点击 "Run" 执行

### SQL 脚本

```sql
-- =================================================================
-- Orders 表初始化 SQL 脚本
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

-- 3. 创建外键约束
ALTER TABLE orders ADD CONSTRAINT IF NOT EXISTS fk_orders_user_id 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

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
```

4. **验证表创建成功**
   - 在左侧菜单中，找到 "Table Editor"
   - 检查是否可以看到 `orders` 表
   - 点击 `orders` 表，查看表结构

## 方法二：使用脚本文件

项目中已提供 SQL 脚本文件：

**文件位置**: `/workspace/projects/scripts/create_orders_table.sql`

你可以：
1. 打开该文件
2. 复制其中的 SQL 内容
3. 在 Supabase 控制台的 SQL Editor 中粘贴并执行

## 表结构说明

### orders 表字段

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | SERIAL | 主键 | PRIMARY KEY |
| user_id | INTEGER | 用户ID | NOT NULL, FOREIGN KEY |
| email | VARCHAR(255) | 用户邮箱 | - |
| symbol | VARCHAR(20) | 交易对符号 | NOT NULL |
| side | VARCHAR(4) | 买卖方向 | NOT NULL, CHECK ('buy', 'sell') |
| order_type | VARCHAR(10) | 订单类型 | NOT NULL, DEFAULT 'market', CHECK ('market', 'limit', 'stop') |
| quantity | DECIMAL(20, 8) | 数量/手数 | NOT NULL |
| price | DECIMAL(20, 8) | 价格 | NOT NULL |
| leverage | INTEGER | 杠杆倍数 | DEFAULT 1 |
| status | VARCHAR(10) | 订单状态 | NOT NULL, DEFAULT 'open', CHECK ('open', 'closed', 'cancelled', 'filled') |
| profit | DECIMAL(20, 8) | 盈亏 | DEFAULT 0 |
| margin | DECIMAL(20, 8) | 保证金 | NOT NULL |
| stop_loss_price | DECIMAL(20, 8) | 止损价 | - |
| take_profit_price | DECIMAL(20, 8) | 止盈价 | - |
| close_price | DECIMAL(20, 8) | 平仓价格 | - |
| closed_at | TIMESTAMP WITH TIME ZONE | 平仓时间 | - |
| created_at | TIMESTAMP WITH TIME ZONE | 创建时间 | DEFAULT NOW() |
| updated_at | TIMESTAMP WITH TIME ZONE | 更新时间 | DEFAULT NOW() |

### 索引

| 索引名 | 字段 | 说明 |
|--------|------|------|
| idx_orders_user_id | user_id | 加速用户查询 |
| idx_orders_symbol | symbol | 加速交易对查询 |
| idx_orders_status | status | 加速状态查询 |
| idx_orders_created_at | created_at DESC | 加速按创建时间排序 |
| idx_orders_user_status | user_id, status | 加速复合查询 |

### 约束

| 约束名 | 类型 | 说明 |
|--------|------|------|
| fk_orders_user_id | FOREIGN KEY | 关联 users 表，删除用户时级联删除订单 |

### 触发器

| 触发器名 | 类型 | 说明 |
|----------|------|------|
| update_orders_updated_at | BEFORE UPDATE | 自动更新 updated_at 字段 |

## 验证表创建

执行以下 SQL 查询来验证表是否创建成功：

```sql
-- 查看表结构
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;
```

你应该看到 18 个字段的输出。

## 故障排除

### 问题：执行 SQL 时报错

**错误**: `relation "users" does not exist`

**原因**: 外键约束引用的 `users` 表不存在

**解决**: 先确保 `users` 表已存在，或者暂时注释掉外键约束部分

**错误**: `syntax error at or near "NOT" LINE 36: ALTER TABLE orders ADD CONSTRAINT IF NOT EXISTS fk_orders_user_id`

**原因**: PostgreSQL 的 `ALTER TABLE ADD CONSTRAINT` 不支持 `IF NOT EXISTS` 语法

**解决**: 使用条件判断替代

修复后的外键约束代码：
```sql
-- 创建外键约束（使用条件判断避免重复创建）
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
```

**错误**: `permission denied for schema public`

**原因**: 没有足够的权限创建表

**解决**: 确保你使用的是具有管理员权限的账户登录 Supabase

### 问题：表创建成功但无法访问

**原因**: Supabase 的 RLS (Row Level Security) 策略可能阻止访问

**解决**: 执行以下 SQL 禁用 RLS（仅用于开发环境）：

```sql
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
```

## 后续步骤

1. **测试交易功能**
   - 执行 API 测试
   - 验证订单创建
   - 验证持仓管理

2. **配置 RLS 策略**（生产环境）
   - 设置用户只能访问自己的订单
   - 配置管理员的访问权限

3. **添加数据验证**
   - 添加触发器验证保证金
   - 添加触发器验证余额

## 相关文档

- [测试计划](./DEPLOYMENT_TEST_PLAN.md)
- [测试报告](./DEPLOYMENT_TEST_REPORT.md)
- [数据架构](./DATA_ARCHITECTURE.md)
