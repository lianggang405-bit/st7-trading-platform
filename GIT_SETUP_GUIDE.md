# Git 初始化和推送指南

## 仓库信息
- 仓库地址: https://github.com/lianggang405-bit/st7-trading-platform.git
- SSH 地址: git@github.com:lianggang405-bit/st7-trading-platform.git
- 状态: 空仓库，需要推送代码

## 步骤一：配置 .gitignore（重要）

在项目根目录创建 `.gitignore` 文件，避免推送不必要的文件。

已创建 `.gitignore` 文件，包含：
- node_modules/
- .next/
- .env.local
- 日志文件
- 临时文件

## 步骤二：初始化 Git

在项目根目录执行以下命令：

```bash
# 进入项目目录
cd /workspace/projects

# 初始化 Git
git init

# 添加远程仓库
git remote add origin https://github.com/lianggang405-bit/st7-trading-platform.git
```

## 步骤三：添加所有文件并提交

```bash
# 添加所有文件
git add .

# 提交代码
git commit -m "Initial commit: ST7全球交易平台

- 完整的交易平台功能
- 用户认证和权限管理
- 市价交易和挂单交易
- 持仓管理和风控系统
- 资产管理和订单管理
- 多语言支持
- 响应式设计
- PWA 支持
- 完整的部署文档"
```

## 步骤四：推送到 GitHub

### 选项 A：使用 HTTPS（推荐）

```bash
# 设置分支名
git branch -M main

# 推送到 GitHub（需要输入 GitHub 账号和密码/token）
git push -u origin main
```

**注意**：GitHub 已经不再支持密码登录，需要使用 Personal Access Token。

### 选项 B：使用 SSH（推荐，更安全）

如果已配置 SSH 密钥：

```bash
# 修改远程仓库地址为 SSH
git remote set-url origin git@github.com:lianggang405-bit/st7-trading-platform.git

# 推送
git branch -M main
git push -u origin main
```

## 步骤五：验证推送

访问 https://github.com/lianggang405-bit/st7-trading-platform 查看代码是否已上传。

---

## 常见问题

### Q: 推送时提示 "Authentication failed"

A: 需要使用 Personal Access Token

1. 访问 https://github.com/settings/tokens
2. 点击 "Generate new token (classic)"
3. 选择权限：repo（全选）
4. 生成 token
5. 推送时，用户名输入 GitHub 账号，密码输入 token

### Q: 提示 "remote: Invalid username or password"

A: 确保使用 Personal Access Token 而不是密码

### Q: 文件太大，推送失败

A: 
```bash
# 安装 Git LFS（如果需要）
# 但本项目应该不需要，因为我们已经配置了 .gitignore
```

---

## 服务器部署命令（系统安装好后使用）

### 连接到服务器
```bash
ssh root@72.62.252.206
```

### 克隆项目
```bash
# 创建项目目录
sudo mkdir -p /var/www
cd /var/www

# 克隆项目（使用 HTTPS）
sudo git clone https://github.com/lianggang405-bit/st7-trading-platform.git

# 进入项目目录
cd st7-trading-platform

# 查看文件
ls -la
```

### 安装依赖
```bash
# 安装 pnpm（如果还没安装）
sudo npm install -g pnpm

# 安装项目依赖
pnpm install
```

### 配置环境变量
```bash
# 复制环境变量模板
cp .env.example .env.local

# 编辑环境变量
nano .env.local
```

填写以下内容：
```bash
# Supabase 配置
COZE_SUPABASE_URL=https://brfzboxaxknlypapwajy.supabase.co
COZE_SUPABASE_ANON_KEY=your-anon-key
COZE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 管理员账号
ADMIN_EMAIL=admin@forexpl.shop
ADMIN_PASSWORD=your-secure-password
```

### 构建项目
```bash
pnpm run build
```

### 启动服务
```bash
# 启动 PM2
pm2 start npm --name "st7-trading-platform" -- start

# 设置开机自启
pm2 startup
pm2 save

# 查看状态
pm2 status
pm2 logs st7-trading-platform
```

### 配置 Nginx
```bash
# 创建 Nginx 配置
sudo nano /etc/nginx/sites-available/st7-trading-platform
```

配置内容：
```nginx
server {
    listen 80;
    server_name forexpl.shop www.forexpl.shop;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

启用配置：
```bash
sudo ln -s /etc/nginx/sites-available/st7-trading-platform /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 配置 SSL
```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d forexpl.shop -d www.forexpl.shop

# 自动续期
sudo certbot renew --dry-run
```

---

## 更新项目

### 本地更新
```bash
# 修改代码后
git add .
git commit -m "Update: 描述修改内容"
git push
```

### 服务器更新
```bash
ssh root@72.62.252.206
cd /var/www/st7-trading-platform
sudo git pull
pnpm install
pnpm run build
pm2 restart st7-trading-platform
```

---

## 一键更新脚本

创建 `/var/www/st7-trading-platform/update.sh`:

```bash
#!/bin/bash

echo "🚀 开始更新 ST7全球交易平台..."

# 拉取最新代码
echo "📥 拉取最新代码..."
git pull

# 安装依赖
echo "📦 安装依赖..."
pnpm install

# 构建项目
echo "🔨 构建项目..."
pnpm run build

# 重启服务
echo "🔄 重启服务..."
pm2 restart st7-trading-platform

echo "✅ 更新完成！"
echo "📊 服务状态："
pm2 status
```

使用：
```bash
chmod +x update.sh
./update.sh
```

---

## 快速参考

### 本地命令
```bash
git init
git add .
git commit -m "commit message"
git push
```

### 服务器命令
```bash
git pull
pnpm install
pnpm run build
pm2 restart st7-trading-platform
```

---

**准备好后，先在本地执行步骤一到四，推送到 GitHub！**
