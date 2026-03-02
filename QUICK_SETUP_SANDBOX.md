# 🚀 快速配置指南 - 沙箱 + Hostinger 部署

## ✅ 第一步：获取 Supabase 凭证

**现在立即操作：**

1. 访问您的 Supabase 项目：
   ```
   https://app.supabase.com/project/brfzboxaxknlypapwajy
   ```

2. 点击左侧菜单的 **Settings** → **API**

3. 复制以下信息：
   - **Project URL**: `https://brfzboxaxknlypapwajy.supabase.co` (已经知道)
   - **anon key**: 长字符串，以 `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9` 开头

---

## 🔧 第二步：配置沙箱环境变量

### 方法A：使用 .env.local 文件（推荐）

我已经更新了 `.env.local` 文件，现在您只需要：

1. 在沙箱中打开 `.env.local` 文件：
   ```bash
   nano .env.local
   ```

2. 找到这一行：
   ```
   COZE_SUPABASE_ANON_KEY=请在这里粘贴您的anon_key
   ```

3. 将 `请在这里粘贴您的anon_key` 替换为您刚才复制的 anon key

4. 保存并退出：
   - 按 `Ctrl + X`
   - 按 `Y`
   - 按 `Enter`

### 方法B：使用命令行

```bash
# 设置环境变量
echo "COZE_SUPABASE_URL=https://brfzboxaxknlypapwajy.supabase.co" >> .env.local
echo "COZE_SUPABASE_ANON_KEY=您的anon_key" >> .env.local
```

---

## 🚀 第三步：在 Supabase 中创建表

回到 Supabase 项目页面（brfzboxaxknlypapwajy）：

1. 点击左侧菜单的 **SQL Editor**
2. 点击 **New Query**
3. 复制并执行下面的 SQL：

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

4. 点击 **Run** 执行

---

## 🔄 第四步：重启沙箱服务

```bash
# 在沙箱终端中执行
coze dev
```

或者如果已经在运行，重启：
```bash
# 停止服务
pkill -f "node.*next"

# 重新启动
coze dev
```

---

## ⏳ 第五步：等待并验证

1. **等待 1-2 分钟**（让 Supabase schema 缓存更新）

2. 访问应用设置页面：
   ```
   http://localhost:5000/admin/trading/setup
   ```

3. 点击 **"刷新状态"** 按钮

4. 应该看到：
   ```
   ✅ trading_pairs 表 - 已创建
   ✅ trading_bots 表 - 已创建
   ✅ 整体状态 - 数据库已就绪
   ```

5. 点击 **"访问调控机器人页面"**

---

## 🌐 第六步：准备部署到 Hostinger

### 构建生产版本

```bash
# 在沙箱中执行
pnpm install
pnpm run build
```

### 准备部署文件

需要上传到 Hostinger 的文件：
```
your-project/
├── .env.local              ✅ 已配置
├── package.json
├── pnpm-lock.yaml
├── .next/                  ✅ 构建后生成
├── src/
└── public/
```

### Hostinger 环境变量

在 Hostinger 中添加以下环境变量：

```bash
COZE_SUPABASE_URL=https://brfzboxaxknlypapwajy.supabase.co
COZE_SUPABASE_ANON_KEY=您的anon_key
NODE_ENV=production
```

---

## 📋 快速检查清单

### 现在立即完成：

- [ ] 复制 Supabase anon key
- [ ] 更新 `.env.local` 文件中的 `COZE_SUPABASE_ANON_KEY`
- [ ] 在 Supabase SQL Editor 中执行 SQL 创建表
- [ ] 重启沙箱服务 (`coze dev`)
- [ ] 等待 1-2 分钟
- [ ] 访问设置页面并点击"刷新状态"
- [ ] 确认所有状态显示 ✅

### 部署到 Hostinger 时：

- [ ] 在 Hostinger 中添加环境变量
- [ ] 上传项目文件
- [ ] 安装依赖 (`pnpm install`)
- [ ] 构建项目 (`pnpm run build`)
- [ ] 启动应用 (`pnpm run start`)
- [ ] 配置域名

---

## 🔍 验证步骤

### 验证1：环境变量已加载

```bash
# 在沙箱中执行
cat .env.local | grep SUPABASE
```

应该显示：
```
COZE_SUPABASE_URL=https://brfzboxaxknlypapwajy.supabase.co
COZE_SUPABASE_ANON_KEY=your_anon_key
```

### 验证2：Supabase 连接正常

```bash
# 访问应用检查API
curl http://localhost:5000/api/admin/trading/check-db
```

应该返回 JSON 数据。

### 验证3：表已创建

在 Supabase SQL Editor 中：
```sql
SELECT * FROM trading_pairs;
```

应该看到 4 条数据。

---

## 🎯 现在就操作！

### 第一步：获取 anon key（30秒）

1. 访问：`https://app.supabase.com/project/brfzboxaxknlypapwajy`
2. 点击 **Settings** → **API**
3. 复制 **anon** key

### 第二步：配置环境变量（1分钟）

```bash
nano .env.local
```

粘贴 anon key，保存退出。

### 第三步：创建表（2分钟）

在 Supabase SQL Editor 中执行 SQL。

### 第四步：重启服务（30秒）

```bash
coze dev
```

### 第五步：验证（1分钟）

访问设置页面，点击"刷新状态"。

---

## 📚 完整文档

- [DEPLOY_TO_HOSTINGER.md](./DEPLOY_TO_HOSTINGER.md) - 完整的 Hostinger 部署指南
- [UPDATE_SUPABASE_CONFIG.md](./UPDATE_SUPABASE_CONFIG.md) - Supabase 配置更新指南
- [SCHEMA_CACHE_FIX.md](./SCHEMA_CACHE_FIX.md) - Schema 缓存说明

---

**总时间：5分钟！** 🚀

现在就开始吧！完成后告诉我，我会帮您验证一切正常，然后准备 Hostinger 部署！
