# 🎯 调控机器人数据库设置 - 完整指南

## 📌 快速开始

### 您需要做什么？

只需3步，2-3分钟完成！

1️⃣ 打开 [Supabase SQL Editor](https://app.supabase.com)
2️⃣ 复制并执行SQL代码（见下方）
3️⃣ 返回应用点击"刷新状态"

就这么简单！

---

## 📝 SQL 代码（复制这个）

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

---

## 📚 详细文档

| 文档 | 说明 |
|------|------|
| **[QUICK_START.md](./QUICK_START.md)** | 🚀 3步快速开始（推荐新手） |
| **[DATABASE_SETUP_DETAILED.md](./DATABASE_SETUP_DETAILED.md)** | 📖 超详细设置指南（每一步都有说明） |
| **[FAQ.md](./FAQ.md)** | ❓ 常见问题解答（遇到问题看这里） |
| **[DATABASE_SETUP.md](./DATABASE_SETUP.md)** | 📋 官方设置文档 |
| **[ACCESS_GUIDE.md](./ACCESS_GUIDE.md)** | 🔗 访问指南 |

---

## 🎨 界面指引

### 设置页面

访问：`http://localhost:5000/admin/trading/setup`

您会看到：
- ✅ 数据库状态检查
- ✅ 详细的设置步骤
- ✅ SQL代码（可以直接复制）
- ✅ "打开 Supabase SQL Editor" 按钮
- ✅ "刷新状态" 按钮

### 调控机器人页面

访问：`http://localhost:5000/admin/trading/bots`

设置成功后，您会看到：
```
┌─────────────────────────────────────────────┐
│ 资源 / 调控机器人                            │
├─────────────────────────────────────────────┤
│ 交易对    │ 调控状态  │ 浮点值     │ 操作  │
├─────────────────────────────────────────────┤
│ BTC/USDT  │ [ON]     │ 0.00000123 │ [调控] │
│ ETH/USDT  │ [OFF]    │ —          │ [调控] │
│ XAU/USD   │ [ON]     │ 0.00000500 │ [调控] │
│ XAU/USDT  │ [OFF]    │ —          │ [调控] │
└─────────────────────────────────────────────┘
```

---

## 🔍 验证步骤

设置完成后，验证是否成功：

### 方法1：在应用中验证
1. 访问设置页面
2. 点击"刷新状态"
3. 看到所有状态显示 ✅ 已创建

### 方法2：在 Supabase 中验证
```sql
SELECT * FROM trading_pairs;
```

应该返回4条数据：
```
id | symbol   | currency_id
----|----------|-------------
1  | BTC/USDT | 1
2  | ETH/USDT | 2
3  | XAU/USD  | 3
4  | XAU/USDT | 4
```

---

## ⚠️ 重要提示

### 设置失败？

1. **检查错误信息**：复制错误提示，查看 [FAQ.md](./FAQ.md)
2. **重新执行SQL**：刷新页面，重新复制粘贴SQL
3. **等待缓存**：Supabase schema缓存需要1-2分钟

### 无法访问 Supabase？

1. 检查 `.env.local` 文件中的 `COZE_SUPABASE_URL`
2. 确认网络连接正常
3. 尝试更换浏览器

### 执行后看不到变化？

1. 等待1-2分钟让 Supabase 更新缓存
2. 在应用中点击"刷新状态"
3. 按 `Ctrl + Shift + R` 强制刷新浏览器

---

## 🎯 功能说明

### 调控机器人能做什么？

- ✅ **控制价格偏移**：通过浮点值调整显示价格
- ✅ **开关控制**：随时启用/禁用某个交易对的调控
- ✅ **实时生效**：所有设置立即生效
- ✅ **独立配置**：每个交易对可以有不同的浮点值

### 浮点值如何工作？

**公式：**
```
显示价格 = 原始价格 + 浮点值
```

**示例：**
- 原始价格：50000 USDT
- 浮点值：0.00123
- 显示价格：50000.00123 USDT

---

## 🆘 需要帮助？

### 按步骤查看文档：

1. **快速开始** → 阅读 [QUICK_START.md](./QUICK_START.md)
2. **详细步骤** → 阅读 [DATABASE_SETUP_DETAILED.md](./DATABASE_SETUP_DETAILED.md)
3. **遇到问题** → 查看 [FAQ.md](./FAQ.md)

### 仍然无法解决？

请提供以下信息：
1. 您卡在了哪一步？
2. 看到了什么错误？
3. 使用的是什么浏览器？

---

## 📞 快速链接

- 🌐 [Supabase 官网](https://supabase.com)
- 🚀 [打开 Supabase SQL Editor](https://app.supabase.com)
- 📖 [Supabase SQL Editor 文档](https://supabase.com/docs/guides/database/sql-editor)

---

## ✅ 检查清单

在开始设置前，请确认：

- [ ] 您有 Supabase 账号
- [ ] 您知道您的 Supabase 项目名称
- [ ] 您可以访问项目根目录
- [ ] 您的浏览器支持复制粘贴功能

---

## 🎉 完成！

设置完成后：

1. ✅ 您可以访问 `/admin/trading/bots` 页面
2. ✅ 看到4个默认交易对
3. ✅ 可以控制每个交易对的调控状态
4. ✅ 可以设置每个交易对的浮点值

---

**开始设置吧！** 🚀

如有任何问题，请查看相关文档或联系我们。
