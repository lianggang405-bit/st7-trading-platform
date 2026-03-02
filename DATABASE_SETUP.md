# 调控机器人数据库设置指南

## 问题说明

如果您看到 "Unexpected token '<', \"<!DOCTYPE \"... is not valid JSON" 错误，这是因为数据库表还没有创建。

## 快速解决方案（推荐）

### 访问数据库设置引导页面

打开浏览器访问：
```
http://localhost:5000/admin/trading/setup
```

这个页面会：
1. 自动检查数据库状态
2. 显示哪些表需要创建
3. 提供详细的设置步骤说明
4. 提供直接跳转到 Supabase 的链接

---

## 手动设置步骤

### 步骤 1: 访问数据库检查页面

打开浏览器访问：
```
http://localhost:5000/api/admin/trading/check-db
```

如果返回 `{"ready": false}`，说明需要创建数据库表。

### 步骤 2: 创建数据库表

#### 方法 A: 使用 Supabase 管理界面（推荐）

1. 访问 https://app.supabase.com
2. 选择你的项目
3. 点击左侧菜单的 **SQL Editor**
4. 点击 **New Query**
5. 复制下面的SQL代码并粘贴到编辑器中
6. 点击 **Run** 执行SQL

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
  UNIQUE(pair_id)
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

7. 执行成功后，你会看到 "Success" 消息

### 步骤 3: 验证表创建成功

1. 在 Supabase SQL Editor 中执行：
```sql
SELECT * FROM trading_pairs;
```

2. 如果看到4条交易对数据，说明创建成功

3. 再次访问检查页面：
```
http://localhost:5000/api/admin/trading/check-db
```

应该返回 `{"ready": true}`

### 步骤 4: 访问调控机器人页面

打开浏览器访问：
```
http://localhost:5000/admin/trading/bots
```

现在应该能看到交易对列表了！

---

## 故障排查

### 问题: SQL执行失败

**错误**: "relation does not exist"

**解决**: 确保你选择的是正确的项目和数据库。

### 问题: 页面仍然显示错误

**解决**: 等待1-2分钟，Supabase的schema缓存需要时间更新。然后刷新页面。

### 问题: 找不到 Supabase 项目

**解决**:
1. 检查项目的环境变量是否正确配置
2. 查看 `.env.local` 文件中的 `COZE_SUPABASE_URL` 和 `COZE_SUPABASE_ANON_KEY`

---

## 需要帮助？

如果按照上述步骤仍然无法解决问题，请检查：

1. Supabase 项目是否正常运行
2. 数据库连接是否正常
3. 是否有足够的权限创建表

---

## 技术说明

### 表结构

**trading_pairs 表:**
- 存储所有交易对信息
- 每个交易对只能有一个调控机器人

**trading_bots 表:**
- 存储调控机器人配置
- 通过 `pair_id` 与交易对关联
- `is_active` 控制是否启用调控
- `float_value` 设置价格偏移量

### API端点

- `GET /api/admin/trading/check-db` - 检查数据库状态
- `GET /api/admin/trading/adjust` - 获取交易对列表
- `POST /api/admin/trading/adjust` - 创建/更新调控机器人
- `PUT /api/admin/trading/adjust` - 切换调控开关
