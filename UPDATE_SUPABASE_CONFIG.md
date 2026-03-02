# 🔄 更新 Supabase 项目配置

## 问题说明

应用的 Supabase 配置指向了错误的项目，需要更新为正确的项目。

### ❌ 错误的配置
```
https://br-pious-loon-13e14bb5.supabase2.aidap-global.supabase.co
```

### ✅ 正确的配置
```
https://brfzboxaxknlypapwajy.supabase.co
```

---

## 🔧 更新步骤

### 第一步：获取正确的项目信息

在您当前的 Supabase 项目页面（brfzboxaxknlypapwajy）中：

1. 点击左侧菜单的 **Settings**
2. 点击 **API**
3. 复制以下信息：
   - **Project URL**: `https://brfzboxaxknlypapwajy.supabase.co`
   - **anon** key (public): 以 `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9` 开头的长字符串

### 第二步：更新环境变量

在 Coze 项目设置中更新以下环境变量：

**方法1：通过 Coze 控制台**
1. 打开 Coze 项目设置
2. 找到环境变量配置
3. 更新：
   ```
   COZE_SUPABASE_URL=https://brfzboxaxknlypapwajy.supabase.co
   COZE_SUPABASE_ANON_KEY=your_anon_key_here
   ```

**方法2：通过 .env.local 文件**
编辑项目根目录的 `.env.local` 文件：
```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/trading_platform

# Supabase (更新为正确的项目)
COZE_SUPABASE_URL=https://brfzboxaxknlypapwajy.supabase.co
COZE_SUPABASE_ANON_KEY=your_anon_key_here

# Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
```

### 第三步：重启应用

更新配置后需要重启应用：

```bash
# 停止当前运行的服务（如果在后台）
pkill -f "node.*next"

# 重新启动
coze dev
```

或者在 Coze 环境中，配置会自动加载。

### 第四步：验证配置

访问：`http://localhost:5000/api/admin/trading/check-db`

应该返回：
```json
{
  "success": true,
  "tables": {
    "trading_pairs": {
      "exists": false,
      "hasData": null,
      "error": "Could not find the table..."
    },
    "trading_bots": {
      "exists": false,
      "hasData": null,
      "error": "Could not find the table..."
    }
  },
  "ready": false
}
```

如果返回这个，说明配置已成功更新到正确的项目（只是表还不存在）。

---

## 📝 在正确的项目中创建表

配置更新后，在正确的 Supabase 项目（brfzboxaxknlypapwajy）中创建表：

### 在当前项目页面的 SQL Editor 中执行：

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

## ✅ 完成验证

### 验证表创建成功

在 Supabase SQL Editor 中执行：
```sql
SELECT * FROM trading_pairs;
```

应该看到4条数据。

### 验证应用能访问

1. 访问：`http://localhost:5000/admin/trading/setup`
2. 点击"刷新状态"
3. 应该看到：
   ```
   ✅ trading_pairs 表 - 已创建
   ✅ trading_bots 表 - 已创建
   ✅ 整体状态 - 数据库已就绪
   ```

---

## 🎯 完整操作流程

```
1. 复制正确项目的 URL 和 anon key
   ↓
2. 更新 Coze 环境变量
   ↓
3. 重启应用（或等待自动加载）
   ↓
4. 在正确项目的 SQL Editor 中执行 SQL
   ↓
5. 等待 1-2 分钟让 schema 缓存更新
   ↓
6. 在应用中点击"刷新状态"
   ↓
7. 开始使用调控机器人功能
```

---

## 🔍 如果遇到问题

### 问题1: 配置更新后应用还是连接到旧项目

**解决：**
- 重启应用
- 清除应用缓存
- 确认环境变量已正确更新

### 问题2: SQL 执行失败

**解决：**
- 确认在正确的项目中
- 检查 SQL 是否完整复制
- 查看错误提示

### 问题3: 应用还是显示"表不存在"

**解决：**
- 等待 1-2 分钟让 schema 缓存更新
- 点击"刷新状态"
- 刷新浏览器页面

---

## 📋 配置对比

| 项目 | 配置状态 |
|------|---------|
| br-pious-loon-13e14bb5 | ❌ 错误（之前配置的）|
| brfzboxaxknlypapwajy | ✅ 正确（当前项目）|

---

## 🚀 现在就操作！

### 第一步：获取项目信息

在当前 Supabase 项目页面，点击 **Settings → API**，复制：
- Project URL
- anon key

### 第二步：更新配置

将正确的 URL 和 key 更新到 Coze 环境变量中。

### 第三步：创建表

在当前项目的 SQL Editor 中执行 SQL 脚本。

### 第四步：验证

在应用设置页面刷新状态，确认一切正常。

---

完成后告诉我，我会帮您验证！🚀
