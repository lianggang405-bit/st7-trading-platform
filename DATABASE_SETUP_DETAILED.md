# 调控机器人数据库设置 - 超详细指南

## 📋 您需要完成以下步骤

### 第一步：登录 Supabase

1. 打开浏览器，访问：https://app.supabase.com
2. 使用您的账号登录（如果还没有账号，先注册一个）
3. 登录后，您会看到项目列表

### 第二步：选择项目

1. 找到您当前使用的项目
2. 点击项目卡片进入项目仪表板

### 第三步：打开 SQL Editor

1. 在左侧菜单栏中，找到并点击 **SQL Editor**（图标是一个数据库和查询符号）
2. 点击 **New Query** 按钮（通常在右上角）
3. 此时您会看到一个空白的SQL编辑器

### 第四步：执行 SQL 脚本

#### 方法A：从项目文件复制（推荐）

1. 在您的项目目录中，找到文件：`init-trading-tables.sql`
2. 用文本编辑器打开这个文件
3. 复制全部内容（Ctrl+A 全选，Ctrl+C 复制）

#### 方法B：直接复制下面的代码

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

### 第五步：粘贴并执行

1. 回到 Supabase SQL Editor
2. 将复制的SQL代码粘贴到编辑器中（Ctrl+V 粘贴）
3. 点击右下角的 **Run** 按钮（或者按 `Ctrl + Enter`）
4. 等待几秒钟，看到 **Success** 提示

### 第六步：验证创建成功

1. 在 SQL Editor 中执行以下查询：
```sql
SELECT * FROM trading_pairs;
```

2. 您应该能看到4条数据：
```
id | symbol   | currency_id | is_visible | ...
----|----------|-------------|------------|----
1  | BTC/USDT | 1           | true       | ...
2  | ETH/USDT | 2           | true       | ...
3  | XAU/USD  | 3           | true       | ...
4  | XAU/USDT | 4           | true       | ...
```

### 第七步：返回应用

1. 回到您的浏览器（调控机器人设置页面）
2. 点击页面上的 **"刷新状态"** 按钮
3. 您应该看到：
   - ✅ trading_pairs 表 - 已创建
   - ✅ trading_bots 表 - 已创建
   - ✅ 整体状态 - 数据库已就绪

4. 点击 **"访问调控机器人页面"** 按钮

---

## 🎯 完成！

现在您可以正常使用调控机器人功能了！

---

## ❓ 常见问题

### Q1: 我找不到 Supabase 项目怎么办？

**A:** 检查项目的环境变量配置：
1. 查看项目根目录下的 `.env.local` 文件
2. 找到 `COZE_SUPABASE_URL` 这个变量
3. 复制URL中的项目ID（例如：`https://abcxyz.supabase.co` 中的 `abcxyz`）
4. 访问 `https://app.supabase.com/project/abcxyz`

### Q2: SQL执行失败了怎么办？

**A:** 检查错误信息：
- 如果显示 "relation already exists" - 说明表已存在，直接跳到第七步
- 如果显示其他错误 - 复制错误信息，提供给我帮助解决

### Q3: 如何确认数据库连接是否正常？

**A:** 在SQL Editor中执行：
```sql
SELECT current_database(), current_user;
```
如果能正常显示数据库名称和用户名，说明连接正常。

### Q4: 可以使用其他数据库工具吗？

**A:** 可以！如果您习惯使用：
- pgAdmin
- DBeaver
- TablePlus
- 任何其他PostgreSQL客户端

您也可以使用这些工具执行SQL脚本。

---

## 📞 需要帮助？

如果在任何步骤遇到问题，请告诉我：
1. 您卡在了哪一步
2. 看到的错误信息是什么
3. 您的Supabase URL（可以隐藏部分）

我会帮您解决！

---

## 📝 SQL脚本说明

### 创建了什么？

1. **trading_pairs 表** - 存储交易对信息
   - id: 主键
   - symbol: 交易对符号（如 BTC/USDT）
   - currency_id: 货币ID
   - is_visible: 是否可见
   - min_order_size: 最小订单大小
   - max_order_size: 最大订单大小
   - contract_fee: 合约手续费

2. **trading_bots 表** - 存储调控机器人配置
   - id: 主键
   - name: 机器人名称
   - pair_id: 关联交易对ID
   - float_value: 浮点值（价格偏移）
   - is_active: 是否激活

3. **默认数据** - 4个交易对
   - BTC/USDT
   - ETH/USDT
   - XAU/USD
   - XAU/USDT

---

祝您设置顺利！有任何问题随时问我。🚀
