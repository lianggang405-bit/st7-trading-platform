# 🚀 快速部署指南（5分钟上线）

## 前置条件

- ✅ 已购买服务器（推荐 Ubuntu 24.04 LTS）
- ✅ 已配置域名（可选）
- ✅ 已获取 Supabase 配置信息

---

## 方式一：一键部署（推荐）⚡

### 1. 连接到服务器

```bash
ssh root@your-server-ip
```

### 2. 运行一键部署脚本

```bash
# 下载脚本
wget https://raw.githubusercontent.com/lianggang405-bit/st7-trading-platform/main/scripts/deploy-server.sh

# 添加执行权限
chmod +x deploy-server.sh

# 运行部署
bash deploy-server.sh
```

### 3. 配置环境变量

```bash
vim /var/www/st7-trading-platform/.env.production
```

填写以下内容：

```bash
COZE_SUPABASE_URL=https://your-project.supabase.co
COZE_SUPABASE_ANON_KEY=your-anon-key
COZE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. 重启应用

```bash
pm2 restart st7-trading-platform
```

### 5. 访问应用

打开浏览器访问：`http://your-server-ip`

**完成！** 🎉

---

## 方式二：手动部署（5步）

### 1. 安装依赖

```bash
# 更新系统
apt-get update -y

# 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt-get install -y nodejs

# 安装 pnpm 和 PM2
npm install -g pnpm pm2

# 安装 Nginx
apt-get install -y nginx
systemctl start nginx
```

### 2. 克隆项目

```bash
cd /var/www
git clone https://github.com/lianggang405-bit/st7-trading-platform.git
cd st7-trading-platform
```

### 3. 配置环境变量

```bash
cp .env.production.example .env.production
vim .env.production
```

填写 Supabase 配置信息。

### 4. 构建并启动

```bash
# 安装依赖
pnpm install

# 构建项目
pnpm run build

# 启动应用
pm2 start npm --name "st7-trading-platform" -- start
pm2 save
pm2 startup
```

### 5. 配置 Nginx

```bash
# 创建配置文件
cat > /etc/nginx/sites-available/st7-trading-platform << 'EOF'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# 启用配置
ln -s /etc/nginx/sites-available/st7-trading-platform /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

**完成！** 🎉

---

## 配置 SSL 证书（可选）

### 使用 Let's Encrypt

```bash
# 安装 Certbot
apt-get install -y certbot python3-certbot-nginx

# 申请证书（替换 your-domain.com 为你的域名）
certbot --nginx -d your-domain.com
```

---

## 常用命令

```bash
# 查看应用状态
pm2 status

# 查看日志
pm2 logs st7-trading-platform

# 重启应用
pm2 restart st7-trading-platform

# 重启 Nginx
systemctl restart nginx
```

---

## 故障排查

### 应用无法启动

```bash
# 查看详细日志
pm2 logs st7-trading-platform --lines 200

# 检查端口占用
netstat -tlnp | grep 5000
```

### Nginx 502 错误

```bash
# 检查应用是否运行
pm2 status

# 检查 Nginx 配置
nginx -t
```

---

## 下一步

1. ✅ 配置域名解析
2. ✅ 申请 SSL 证书
3. ✅ 配置监控和告警
4. ✅ 定期备份数据

---

**需要帮助？** 查看 [详细部署指南](./PRODUCTION_DEPLOYMENT_GUIDE.md)
