#!/bin/bash

# 服务器部署脚本 - 适用于 Ubuntu 24.04 LTS (Hostinger)
# 域名: forexpl.shop
# IP: 72.62.252.206

# 1. 更新系统
echo "Updating system..."
sudo apt update && sudo apt upgrade -y

# 2. 安装 Node.js (v20)
echo "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 3. 安装 pnpm
echo "Installing pnpm..."
sudo npm install -g pnpm

# 4. 安装 PM2
echo "Installing PM2..."
sudo npm install -g pm2

# 5. 安装 Nginx
echo "Installing Nginx..."
sudo apt install -y nginx

# 6. 安装 Git
echo "Installing Git..."
sudo apt install -y git

# 7. 克隆代码
echo "Cloning repository..."
mkdir -p /var/www
cd /var/www
# 如果目录已存在，先备份
if [ -d "st7-trading-platform" ]; then
    mv st7-trading-platform st7-trading-platform_backup_$(date +%Y%m%d%H%M%S)
fi

# 注意：这里假设你已经将代码推送到了 GitHub
# 如果是私有仓库，需要先配置 SSH Key
git clone https://github.com/lianggang405-bit/st7-trading-platform.git
cd st7-trading-platform

# 8. 安装依赖
echo "Installing dependencies..."
pnpm install

# 9. 构建项目
echo "Building project..."
pnpm run build

# 10. 启动服务 (使用 PM2)
echo "Starting application with PM2..."
pm2 start npm --name "st7-trading-platform" -- start
pm2 save
pm2 startup

# 11. 配置 Nginx
echo "Configuring Nginx..."
sudo rm /etc/nginx/sites-enabled/default

# 创建 Nginx 配置文件
sudo tee /etc/nginx/sites-available/forexpl.shop > /dev/null <<EOF
server {
    listen 80;
    server_name forexpl.shop www.forexpl.shop;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# 启用站点
sudo ln -s /etc/nginx/sites-available/forexpl.shop /etc/nginx/sites-enabled/

# 测试 Nginx 配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx

# 12. 配置 SSL (使用 Certbot)
echo "Installing Certbot and configuring SSL..."
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d forexpl.shop -d www.forexpl.shop --non-interactive --agree-tos -m admin@forexpl.shop

echo "Deployment complete! Visit https://forexpl.shop"
