# 🚀 本地/沙箱配置 + Hostinger 部署指南

## 📊 当前情况

- ✅ 您在沙箱中运行应用
- ✅ Supabase 项目已创建（brfzboxaxknlypapwajy）
- 🎯 目标：配置沙箱 → 部署到 Hostinger
- ❌ 不使用 Coze 部署功能

---

## 🔧 第一部分：在沙箱中配置 Supabase

### 步骤1：获取 Supabase 凭证

在您的 Supabase 项目（brfzboxaxknlypapwajy）中：

1. 点击 **Settings** → **API**
2. 复制以下信息：
   - **Project URL**: `https://brfzboxaxknlypapwajy.supabase.co`
   - **anon** key: 复制完整的 key

### 步骤2：更新本地 .env.local 文件

在项目根目录下编辑 `.env.local` 文件：

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/trading_platform

# Supabase (更新为正确的项目)
COZE_SUPABASE_URL=https://brfzboxaxknlypapwajy.supabase.co
COZE_SUPABASE_ANON_KEY=粘贴_anon_key_here

# Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
```

**重要：** 将 `粘贴_anon_key_here` 替换为您刚才复制的 anon key。

### 步骤3：重启沙箱中的服务

```bash
# 在沙箱终端中执行
coze dev
```

### 步骤4：在 Supabase 中创建表

回到 Supabase 项目页面（brfzboxaxknlypapwajy）：

1. 点击 **SQL Editor**
2. 执行以下 SQL：

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

### 步骤5：等待并验证

1. 等待 1-2 分钟（让 schema 缓存更新）
2. 访问：`http://localhost:5000/admin/trading/setup`
3. 点击"刷新状态"
4. 应该看到所有 ✅

---

## 🌐 第二部分：准备部署到 Hostinger

### 步骤1：准备部署文件

需要将以下文件上传到 Hostinger：

**必需文件：**
```
your-project/
├── .env.local              (需要修改环境变量)
├── package.json
├── pnpm-lock.yaml
├── next.config.js
├── tsconfig.json
├── tailwind.config.js
├── .coze                   (配置文件)
├── src/
├── public/
└── node_modules/           (通过 npm/pnpm 安装)
```

### 步骤2：构建生产版本

在沙箱中执行：

```bash
# 安装依赖
pnpm install

# 构建生产版本
pnpm run build
```

构建完成后，会在项目根目录生成 `.next` 文件夹。

### 步骤3：准备 Hostinger 环境变量

在 Hostinger 中，您需要配置以下环境变量：

**方法 A：通过 .env.local 文件**
```bash
COZE_SUPABASE_URL=https://brfzboxaxknlypapwajy.supabase.co
COZE_SUPABASE_ANON_KEY=your_anon_key_here
DATABASE_URL=postgresql://postgres:password@host:port/database
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
```

**方法 B：通过 Hostinger 控制面板**
在 Hostinger 的环境变量设置中添加上述变量。

---

## 🚀 第三部分：Hostinger 部署步骤

### 方案A：使用 Hostinger 的 Node.js 托管

#### 1. 创建新的 Node.js 项目

在 Hostinger 控制面板中：
1. 登录 Hostinger
2. 进入 **Hosting** → **Manage**
3. 点击 **File Manager**
4. 上传项目文件

#### 2. 配置环境变量

在 Hostinger 控制面板中：
1. 找到 **Environment Variables** 设置
2. 添加以下变量：
   ```
   COZE_SUPABASE_URL=https://brfzboxaxknlypapwajy.supabase.co
   COZE_SUPABASE_ANON_KEY=your_anon_key_here
   NODE_ENV=production
   ```

#### 3. 安装依赖并启动

在 Hostinger 的终端或 SSH 中：

```bash
# 进入项目目录
cd your-project

# 安装依赖
npm install

# 安装 pnpm
npm install -g pnpm

# 使用 pnpm 安装依赖
pnpm install

# 构建项目
pnpm run build

# 启动生产环境
pnpm run start
```

#### 4. 配置域名和端口

在 Hostinger 中：
1. 配置域名指向您的应用
2. 设置端口转发（如果需要）

---

### 方案B：使用 Hostinger 的 VPS

如果您有 VPS 访问权限：

#### 1. 安装 Node.js 和 pnpm

```bash
# SSH 连接到 VPS
ssh user@your-vps-ip

# 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 pnpm
npm install -g pnpm
```

#### 2. 上传项目文件

使用 SCP 或 Git：

```bash
# 方法1: 使用 SCP
scp -r your-project user@your-vps-ip:/var/www/

# 方法2: 使用 Git
git clone your-repo-url /var/www/your-project
cd /var/www/your-project
```

#### 3. 安装依赖并运行

```bash
cd /var/www/your-project

# 安装依赖
pnpm install

# 构建项目
pnpm run build

# 使用 PM2 保持进程运行
npm install -g pm2
pm2 start npm --name "trading-app" -- start
pm2 save
pm2 startup
```

#### 4. 配置 Nginx 反向代理

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

### 方案C：使用 Docker（推荐）

#### 1. 创建 Dockerfile

在项目根目录创建 `Dockerfile`：

```dockerfile
FROM node:20-alpine

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制 package.json 和 pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制项目文件
COPY . .

# 构建应用
RUN pnpm run build

# 暴露端口
EXPOSE 5000

# 启动应用
CMD ["pnpm", "start"]
```

#### 2. 创建 .dockerignore

```
node_modules
.next
.git
.env.local
*.log
```

#### 3. 构建和运行 Docker 镜像

```bash
# 构建镜像
docker build -t trading-app .

# 运行容器
docker run -d \
  --name trading-app \
  -p 5000:5000 \
  -e COZE_SUPABASE_URL=https://brfzboxaxknlypapwajy.supabase.co \
  -e COZE_SUPABASE_ANON_KEY=your_anon_key_here \
  -e NODE_ENV=production \
  trading-app
```

#### 4. 在 Hostinger 中运行 Docker

如果 Hostinger 支持 Docker：
```bash
# 上传 Dockerfile
# 构建并运行
docker build -t trading-app .
docker run -d -p 5000:5000 --name trading-app trading-app
```

---

## 📋 第四部分：部署检查清单

### 在部署前：

- [ ] ✅ Supabase 项目已创建
- [ ] ✅ 数据库表已创建
- [ ] ✅ 沙箱中应用正常运行
- [ ] ✅ 环境变量已配置
- [ ] ✅ 应用已测试

### 部署到 Hostinger：

- [ ] 上传项目文件
- [ ] 配置环境变量
- [ ] 安装依赖
- [ ] 构建项目
- [ ] 启动应用
- [ ] 配置域名
- [ ] 测试访问

### 部署后验证：

- [ ] 访问网站首页
- [ ] 测试登录功能
- [ ] 测试调控机器人功能
- [ ] 检查控制台错误
- [ ] 监控应用日志

---

## 🔍 故障排查

### 问题1: 环境变量未加载

**解决：**
```bash
# 检查环境变量
echo $COZE_SUPABASE_URL

# 或在应用中打印
console.log(process.env.COZE_SUPABASE_URL);
```

### 问题2: 数据库连接失败

**解决：**
- 检查 Supabase URL 是否正确
- 检查 anon key 是否有效
- 检查网络连接

### 问题3: 端口被占用

**解决：**
```bash
# 查找占用端口的进程
lsof -i :5000

# 杀死进程
kill -9 PID
```

---

## 📞 Hostinger 支持

如果遇到 Hostinger 特定的问题：
1. 查看 Hostinger 文档：https://support.hostinger.com
2. 联系 Hostinger 客服
3. 查看 Hostinger 控制面板的帮助中心

---

## 🎉 总结

**当前任务：**
1. 在沙箱中配置正确的 Supabase 项目
2. 测试应用功能
3. 准备部署文件
4. 部署到 Hostinger

**现在就做：**
1. 更新 `.env.local` 文件
2. 在 Supabase 中创建表
3. 重启沙箱服务
4. 验证功能正常

完成后告诉我，我会帮您准备 Hostinger 部署！🚀
