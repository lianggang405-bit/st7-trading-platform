# 🚀 数据库设置 - 3步完成！

## 步骤1️⃣：打开 Supabase SQL Editor

1. 访问：https://app.supabase.com
2. 选择您的项目
3. 点击左侧菜单的 **SQL Editor**
4. 点击 **New Query**

## 步骤2️⃣：复制并执行SQL

点击下面的按钮，SQL代码会自动复制到剪贴板：

```sql
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

CREATE INDEX IF NOT EXISTS idx_trading_pairs_symbol ON trading_pairs(symbol);
CREATE INDEX IF NOT EXISTS idx_trading_pairs_visible ON trading_pairs(is_visible);

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

CREATE INDEX IF NOT EXISTS idx_trading_bots_pair_id ON trading_bots(pair_id);
CREATE INDEX IF NOT EXISTS idx_trading_bots_active ON trading_bots(is_active);

INSERT INTO trading_pairs (symbol, currency_id, is_visible, min_order_size, max_order_size, contract_fee)
VALUES
  ('BTC/USDT', 1, true, 0.001, 100, 0.1),
  ('ETH/USDT', 2, true, 0.01, 1000, 0.1),
  ('XAU/USD', 3, true, 0.01, 100, 0.1),
  ('XAU/USDT', 4, true, 0.01, 100, 0.1)
ON CONFLICT (symbol) DO NOTHING;
```

然后：
1. 粘贴到 SQL Editor
2. 点击 **Run** 按钮
3. 看到 **Success** 提示

## 步骤3️⃣：返回应用刷新

1. 回到应用设置页面
2. 点击 **"刷新状态"** 按钮
3. 点击 **"访问调控机器人页面"**

---

## ✨ 完成！

现在您可以看到交易对列表并开始使用调控机器人功能了。

---

## 📸 视觉说明

### SQL Editor 界面

```
┌────────────────────────────────────────┐
│ SQL Editor                [Run]  [▶]  │
├────────────────────────────────────────┤
│                                        │
│  CREATE TABLE IF NOT EXISTS ...      │
│                                        │
│  INSERT INTO trading_pairs ...       │
│                                        │
├────────────────────────────────────────┤
│ Success 3 queries                     │
│ ✓ table trading_pairs                 │
│ ✓ table trading_bots                  │
│ ✓ INSERT ...                          │
└────────────────────────────────────────┘
```

### 验证查询

在SQL Editor中执行：
```sql
SELECT * FROM trading_pairs;
```

您应该看到：
```
┌────┬──────────┬─────────────┬────────────┐
│ id │ symbol   │ currency_id │ is_visible │
├────┼──────────┼─────────────┼────────────┤
│ 1  │ BTC/USDT │ 1           │ true       │
│ 2  │ ETH/USDT │ 2           │ true       │
│ 3  │ XAU/USD  │ 3           │ true       │
│ 4  │ XAU/USDT │ 4           │ true       │
└────┴──────────┴─────────────┴────────────┘
```

---

## 🔥 快速链接

- [打开 Supabase](https://app.supabase.com)
- [详细设置指南](./DATABASE_SETUP_DETAILED.md)
- [访问调控机器人页面](http://localhost:5000/admin/trading/bots)

---

## ❓ 遇到问题？

### 问题1: 找不到 Supabase 项目？
检查您的 `.env.local` 文件中的 `COZE_SUPABASE_URL`，获取项目ID。

### 问题2: SQL执行失败？
如果显示 "relation already exists"，说明表已经存在，直接跳到步骤3。

### 问题3: 看不到 "Success" 提示？
刷新页面重新执行SQL，或者检查网络连接。

---

## 💡 提示

- 整个过程只需 **2-3分钟**
- 不需要任何编程知识
- 只需要 **复制-粘贴-点击** 三步操作

---

现在就开始设置吧！🎉
