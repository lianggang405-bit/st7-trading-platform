# ST7 全球交易平台 - 生产环境部署指南

## 📋 目录

1. [准备工作](#准备工作)
2. [方案一：一键部署脚本（推荐）](#方案一一键部署脚本推荐)
3. [方案二：手动部署](#方案二手动部署)
4. [方案三：Docker 部署](#方案三docker-部署)
5. [域名和 SSL 配置](#域名和-ssl-配置)
6. [监控和维护](#监控和维护)
7. [故障排查](#故障排查)

---

## 准备工作

### 1. 服务器要求

- **操作系统**：Ubuntu 24.04 LTS（推荐）
- **CPU**：2 核心或更多
- **内存**：4 GB 或更多
- **存储**：40 GB 或更多
- **网络**：公网 IP，开放 22、80、443 端口

### 2. 获取服务器信息

- SSH 连接信息（IP、端口、用户名、密码或 SSH 密钥）
- 域名（可选，用于 SSL 证书）

### 3. 准备 Supabase 配置

从 [Supabase 控制台](https://supabase.com/dashboard) 获取以下信息：

```
COZE_SUPABASE_URL=https://your-project.supabase.co
COZE_SUPABASE_ANON_KEY=your-anon-key
COZE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## 方案一：一键部署脚本（推荐）

### 特点

✅ 自动化完成所有配置
✅ 最简单快捷
✅ 适合新手

### 步骤

#### 1. 连接到服务器

```bash
# 使用 SSH 密钥连接
ssh -i /path/to/your/key.pem root@your-server-ip

# 或使用密码连接
ssh root@your-server-ip
```

#### 2. 下载部署脚本

```bash
# 创建临时目录
mkdir -p ~/tmp
cd ~/tmp

# 下载脚本（从 GitHub）
wget https://raw.githubusercontent.com/lianggang405-bit/st7-trading-platform/main/scripts/deploy-server.sh

# 或手动上传脚本
# scp scripts/deploy-server.sh root@your-server-ip:~/tmp/
```

#### 3. 添加执行权限

```bash
chmod +x deploy-server.sh
```

#### 4. 运行部署脚本

```bash
bash deploy-server.sh
```

脚本将自动完成以下步骤：

1. ✅ 更新系统
2. ✅ 安装 Node.js 24.x、pnpm、PM2
3. ✅ 安装和配置 Nginx
4. ✅ 配置防火墙（UFW）
5. ✅ 克隆项目代码
6. ✅ 构建应用
7. ✅ 使用 PM2 启动应用
8. ✅ 配置 Nginx 反向代理
9. ✅ 配置 SSL 证书（Let's Encrypt）

#### 5. 配置环境变量

```bash
# 编辑环境变量文件
vim /var/www/st7-trading-platform/.env.production
```

填写实际的 Supabase 配置：

```bash
COZE_SUPABASE_URL=https://your-project.supabase.co
COZE_SUPABASE_ANON_KEY=your-anon-key
COZE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

#### 6. 重启应用

```bash
pm2 restart st7-trading-platform
```

#### 7. 验证部署

```bash
# 检查应用状态
pm2 status

# 查看应用日志
pm2 logs st7-trading-platform

# 检查 Nginx 状态
systemctl status nginx
```

访问 `http://your-server-ip` 或 `https://your-domain` 验证应用是否正常运行。

---

## 方案二：手动部署

### 特点

✅ 更灵活的配置
✅ 适合有经验的用户
✅ 可以精细控制每个步骤

### 步骤

#### 1. 更新系统

```bash
apt-get update -y
apt-get upgrade -y
```

#### 2. 安装基础依赖

```bash
# 安装基础工具
apt-get install -y curl wget git vim unzip

# 安装 Node.js 24.x
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt-get install -y nodejs

# 安装 pnpm
npm install -g pnpm

# 验证安装
node --version  # 应该是 v24.x
pnpm --version
```

#### 3. 安装 PM2

```bash
npm install -g pm2
```

#### 4. 安装和配置 Nginx

```bash
# 安装 Nginx
apt-get install -y nginx

# 启动 Nginx
systemctl start nginx
systemctl enable nginx
```

#### 5. 创建项目目录

```bash
mkdir -p /var/www/st7-trading-platform
cd /var/www/st7-trading-platform
```

#### 6. 克隆项目

```bash
git clone https://github.com/lianggang405-bit/st7-trading-platform.git .
```

#### 7. 配置环境变量

```bash
# 创建环境变量文件
cp .env.production.example .env.production

# 编辑环境变量
vim .env.production
```

填写实际的配置：

```bash
COZE_SUPABASE_URL=https://your-project.supabase.co
COZE_SUPABASE_ANON_KEY=your-anon-key
COZE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NODE_ENV=production
PORT=5000
```

#### 8. 安装依赖并构建

```bash
# 安装依赖
pnpm install --frozen-lockfile

# 构建项目
pnpm run build
```

#### 9. 使用 PM2 启动应用

```bash
# 启动应用
pm2 start npm --name "st7-trading-platform" -- start

# 保存 PM2 配置
pm2 save

# 配置开机自启
pm2 startup
```

#### 10. 配置 Nginx 反向代理

```bash
# 创建 Nginx 配置文件
vim /etc/nginx/sites-available/st7-trading-platform
```

添加以下内容：

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
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /_next/static {
        proxy_pass http://localhost:5000;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# 启用站点
ln -s /etc/nginx/sites-available/st7-trading-platform /etc/nginx/sites-enabled/

# 测试配置
nginx -t

# 重启 Nginx
systemctl restart nginx
```

---

## 方案三：Docker 部署

### 特点

✅ 环境一致性
✅ 易于迁移和扩展
✅ 适合容器化环境

### 前置要求

服务器已安装 Docker 和 Docker Compose。

### 步骤

#### 1. 安装 Docker

```bash
# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 启动 Docker
systemctl start docker
systemctl enable docker

# 安装 Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version
```

#### 2. 创建项目目录

```bash
mkdir -p /var/www/st7-trading-platform
cd /var/www/st7-trading-platform
```

#### 3. 克隆项目

```bash
git clone https://github.com/lianggang405-bit/st7-trading-platform.git .
```

#### 4. 配置环境变量

```bash
cp .env.production.example .env.production
vim .env.production
```

#### 5. 配置 Nginx

```bash
cp nginx.conf.example nginx.conf
vim nginx.conf
```

修改 `server_name` 为你的域名。

#### 6. 构建并启动容器

```bash
# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f

# 查看运行状态
docker-compose ps
```

#### 7. 配置 SSL 证书

```bash
# 安装 Certbot
apt-get install -y certbot

# 申请证书
certbot certonly --standalone -d your-domain.com

# 复制证书
mkdir ssl
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ssl/
cp /etc/letsencrypt/live/your-domain.com/privkey.pem ssl/

# 重启容器
docker-compose restart nginx
```

---

## 域名和 SSL 配置

### 1. 配置 DNS 解析

在你的域名提供商（如 Hostinger、Namecheap）配置 DNS 记录：

```
类型: A
主机: @
值: your-server-ip
TTL: 600
```

### 2. 申请 SSL 证书

```bash
# 安装 Certbot
apt-get install -y certbot python3-certbot-nginx

# 申请证书
certbot --nginx -d your-domain.com

# 配置自动续期
certbot renew --dry-run
```

### 3. 验证 SSL

访问 `https://your-domain.com`，检查浏览器地址栏是否显示锁图标。

---

## 监控和维护

### 1. 查看应用状态

```bash
# PM2 状态
pm2 status

# 查看日志
pm2 logs st7-trading-platform

# 实时日志
pm2 logs st7-trading-platform --lines 100
```

### 2. 重启应用

```bash
# 重启应用
pm2 restart st7-trading-platform

# 重启 Nginx
systemctl restart nginx
```

### 3. 更新应用

```bash
cd /var/www/st7-trading-platform

# 拉取最新代码
git pull origin main

# 安装依赖
pnpm install

# 构建项目
pnpm run build

# 重启应用
pm2 restart st7-trading-platform
```

### 4. 备份数据

```bash
# 备份数据库（如果有）
# 备份环境变量
cp .env.production .env.production.backup.$(date +%Y%m%d)
```

---

## 故障排查

### 应用无法启动

```bash
# 查看详细日志
pm2 logs st7-trading-platform --lines 200

# 检查端口占用
netstat -tlnp | grep 5000

# 检查环境变量
cat /var/www/st7-trading-platform/.env.production
```

### Nginx 502 错误

```bash
# 检查应用是否运行
pm2 status

# 检查 Nginx 配置
nginx -t

# 查看 Nginx 错误日志
tail -f /var/log/nginx/st7-trading-platform-error.log
```

### 数据库连接失败

```bash
# 检查 Supabase 配置
cat .env.production | grep COZE_SUPABASE

# 测试连接
curl -I https://brfzboxaxknlypapwajy.supabase.co
```

### 内存不足

```bash
# 查看内存使用
free -h

# 重启应用
pm2 restart st7-trading-platform

# 增加服务器内存
```

---

## 常用命令

### PM2 命令

```bash
pm2 list                    # 列出所有应用
pm2 status                  # 查看状态
pm2 logs st7-trading-platform          # 查看日志
pm2 restart st7-trading-platform       # 重启应用
pm2 stop st7-trading-platform          # 停止应用
pm2 delete st7-trading-platform        # 删除应用
pm2 monit                   # 监控面板
```

### Nginx 命令

```bash
systemctl status nginx      # 查看状态
systemctl restart nginx     # 重启
systemctl reload nginx      # 重新加载配置
nginx -t                    # 测试配置
```

### 系统命令

```bash
free -h                     # 查看内存
df -h                       # 查看磁盘
top                         # 查看进程
htop                        # 进程监控（需安装）
```

---

## 安全建议

1. **定期更新系统**：
   ```bash
   apt-get update && apt-get upgrade -y
   ```

2. **配置防火墙**：
   ```bash
   ufw allow 22/tcp
   ufw allow 80/tcp
   ufw allow 443/tcp
   ufw enable
   ```

3. **禁用 root 登录**：
   ```bash
   vim /etc/ssh/sshd_config
   # 设置 PermitRootLogin no
   systemctl restart sshd
   ```

4. **定期备份数据**

5. **监控日志**：定期检查应用和系统日志

---

## 支持

如有问题，请联系：

- GitHub: https://github.com/lianggang405-bit/st7-trading-platform
- 邮箱: support@forexpl.shop

---

**最后更新**: 2026-03-02
