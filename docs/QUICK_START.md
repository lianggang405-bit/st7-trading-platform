# 快速启动指南 - Orders 表创建

## 🚀 5分钟快速指南

### 第一步：访问 Supabase 控制台

1. 打开浏览器，访问：https://app.supabase.com
2. 登录你的账户
3. 点击选择项目：`brfzboxaxknlypapwajy`

### 第二步：打开 SQL Editor

1. 在左侧菜单中找到 "SQL Editor"
2. 点击 "SQL Editor"
3. 点击 "New query" 创建新查询

### 第三步：执行 SQL 脚本

1. 打开文件：`/workspace/projects/scripts/create_orders_table.sql`
2. 复制文件中的所有 SQL 代码
3. 粘贴到 SQL Editor 中
4. 点击右上角的 "Run" 按钮

### 第四步：验证创建成功

在浏览器中执行：

```bash
curl http://localhost:5000/api/admin/trading/orders-status
```

如果看到 `"exists": true`，说明表创建成功！

### 第五步：测试交易功能

在浏览器中执行：

```bash
curl -X POST http://localhost:5000/api/user/positions \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer token_12_'$(date +%s) \
  -d '{
    "symbol": "BTCUSD",
    "side": "buy",
    "volume": 0.01,
    "price": 43750,
    "orderType": "market",
    "leverage": 10
  }'
```

如果看到订单创建成功的响应，说明一切正常！

---

## 📋 完整 SQL 脚本

你也可以直接复制以下 SQL 到 Supabase 控制台：

```sql
-- 创建 orders 表
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
```

---

## ✅ 成功标志

### 1. 表结构验证

执行成功后，你应该看到：
- 18个字段
- 5个索引
- 1个外键约束
- 1个触发器

### 2. API 响应验证

`GET /api/admin/trading/orders-status` 应该返回：
```json
{
  "success": true,
  "exists": true,
  "message": "orders 表已存在",
  "tableInfo": {
    "name": "orders",
    "columnCount": 18,
    "columns": [...]
  }
}
```

### 3. 交易功能验证

`POST /api/user/positions` 应该返回：
```json
{
  "success": true,
  "data": {
    "id": "...",
    "symbol": "BTCUSD",
    "side": "buy",
    ...
  }
}
```

---

## 🔧 故障排除

### 问题：外键约束错误

**错误**: `relation "users" does not exist`

**解决**：暂时注释掉外键约束部分：
```sql
-- ALTER TABLE orders ADD CONSTRAINT IF NOT EXISTS fk_orders_user_id ...
```

### 问题：权限错误

**错误**: `permission denied for schema public`

**解决**：确保你使用管理员账户登录 Supabase

### 问题：RLS 阻止访问

**错误**: 无法查询 orders 表

**解决**：执行以下 SQL：
```sql
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
```

---

## 📚 更多文档

- [详细创建指南](./CREATE_ORDERS_TABLE.md)
- [状态报告](./ORDERS_TABLE_STATUS.md)
- [最终测试报告](./FINAL_TEST_REPORT.md)

---

**快速完成！整个过程只需5分钟！**
