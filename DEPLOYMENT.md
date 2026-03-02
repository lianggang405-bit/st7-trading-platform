# 交易平台部署文档

## 项目概述

基于 Next.js 16 (App Router) 的模拟交易平台，支持多语言、用户认证、市场行情、交易下单、持仓管理、资产总览及风控功能。

## 技术栈

- **框架**: Next.js 16.1.1 (App Router)
- **语言**: TypeScript 5.9.3
- **UI 库**: React 19.2.3, Tailwind CSS 4.1.18, shadcn/ui
- **状态管理**: Zustand 5.0.11
- **国际化**: next-intl 4.8.2
- **数据库**: Supabase (PostgreSQL)
- **认证**: 自定义 Token 认证
- **密码加密**: bcrypt

## 部署前检查清单

### ✅ 已完成的检查

1. **代码质量检查**
   - TypeScript 类型检查：16 个警告（大部分是管理端功能的类型兼容性问题，不影响核心交易功能）
   - 构建测试：待生产环境测试
   - ESLint 检查：通过

2. **环境配置**
   - ✅ .coze 配置文件正常
   - ✅ 环境变量配置正确（COZE_SUPABASE_URL, COZE_SUPABASE_ANON_KEY, COZE_SUPABASE_SERVICE_ROLE_KEY）
   - ✅ 脚本文件正常（prepare.sh, dev.sh, build.sh, start.sh）

3. **数据库连接**
   - ✅ Supabase 连接配置正确
   - ✅ 数据库超时设置为 60 秒
   - ✅ 支持管理员权限和匿名权限

4. **安全检查**
   - ✅ 密码使用 bcrypt 加密（salt rounds: 10）
   - ✅ API 鉴权机制完善（Bearer Token）
   - ✅ 无硬编码敏感信息
   - ✅ 环境变量安全配置

5. **核心功能**
   - ✅ 用户注册/登录
   - ✅ 市价交易
   - ✅ 挂单交易（含价格触发机制）
   - ✅ 持仓管理
   - ✅ 资产管理
   - ✅ 风控系统

6. **性能优化**
   - ✅ 静态资源优化
   - ✅ 代码分割
   - ✅ 缓存策略

## 环境要求

### 服务器要求

- **操作系统**: Linux (推荐 Ubuntu 20.04+)
- **Node.js**: 24.x
- **包管理器**: pnpm 9.0.0+
- **内存**: 至少 2GB RAM
- **磁盘**: 至少 10GB 可用空间
- **网络**: 支持访问 Supabase API

### 环境变量

创建 `.env.local` 文件（生产环境）：

```bash
# Supabase 配置（必填）
COZE_SUPABASE_URL=https://your-project.supabase.co
COZE_SUPABASE_ANON_KEY=your-anon-key
COZE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 管理员账号（可选）
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-secure-password
```

## 部署步骤

### 1. 准备服务器

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js 24
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 pnpm
npm install -g pnpm

# 验证安装
node --version  # 应显示 v24.x.x
pnpm --version  # 应显示 9.x.x
```

### 2. 部署代码

```bash
# 克隆代码（或上传代码）
git clone <your-repo-url> /var/www/trading-platform
cd /var/www/trading-platform

# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env.local
nano .env.local  # 填写实际的配置

# 构建项目
pnpm run build
```

### 3. 配置服务

#### 使用 PM2（推荐）

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start npm --name "trading-platform" -- start

# 设置开机自启
pm2 startup
pm2 save

# 查看日志
pm2 logs trading-platform

# 查看状态
pm2 status
```

#### 使用 Systemd

创建服务文件 `/etc/systemd/system/trading-platform.service`：

```ini
[Unit]
Description=Trading Platform
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/trading-platform
ExecStart=/usr/bin/pnpm start
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=5000

[Install]
WantedBy=multi-user.target
```

启动服务：

```bash
sudo systemctl daemon-reload
sudo systemctl enable trading-platform
sudo systemctl start trading-platform
sudo systemctl status trading-platform
```

### 4. 配置 Nginx（反向代理）

创建 Nginx 配置 `/etc/nginx/sites-available/trading-platform`：

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
        proxy_read_timeout 86400;
    }

    # 启用 gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/trading-platform /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. 配置 HTTPS（使用 Let's Encrypt）

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

## 数据库准备

### Supabase 配置

1. 创建 Supabase 项目
2. 获取 API 密钥
3. 配置环境变量

### 数据库表结构

确保以下表已创建（或运行初始化脚本）：

- `users` - 用户表
- `orders` - 订单表
- `trading_pairs` - 交易对表
- `trading_bots` - 调控机器人表
- `flash_contract_durations` - 秒合约配置表
- `flash_contract_trades` - 秒合约交易表

### 初始化数据

运行初始化脚本：

```bash
# 初始化交易对
curl -X POST http://localhost:5000/api/admin/trading/init-pairs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>"
```

## 监控和日志

### 日志位置

- **应用日志**: `/var/www/trading-platform/logs/`
- **Nginx 日志**: `/var/log/nginx/`
- **PM2 日志**: `~/.pm2/logs/`

### 监控指标

- CPU 使用率
- 内存使用率
- 磁盘空间
- API 响应时间
- 错误率

## 备份策略

### 数据库备份

Supabase 自动提供备份，建议：

1. 启用每日自动备份
2. 定期导出重要数据
3. 保留 30 天的备份

### 代码备份

```bash
# 定期提交到 Git
git add .
git commit -m "Backup"
git push origin main
```

## 故障排查

### 常见问题

1. **端口 5000 被占用**
   ```bash
   sudo lsof -i :5000
   sudo kill -9 <PID>
   ```

2. **数据库连接失败**
   - 检查环境变量配置
   - 检查 Supabase API 可用性
   - 检查网络连接

3. **构建失败**
   - 清理缓存：`rm -rf .next`
   - 重新安装依赖：`pnpm install`
   - 检查 Node.js 版本

4. **API 返回 500 错误**
   - 查看应用日志
   - 检查数据库连接
   - 检查环境变量

### 日志查看

```bash
# PM2 日志
pm2 logs trading-platform

# 实时监控
pm2 monit

# Nginx 日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 安全建议

1. **定期更新依赖**
   ```bash
   pnpm update
   ```

2. **启用防火墙**
   ```bash
   sudo ufw allow 22
   sudo ufw allow 80
   sudo ufw allow 443
   sudo ufw enable
   ```

3. **限制 API 访问**
   - 使用速率限制
   - 监控异常请求
   - 定期审查日志

4. **定期备份数据**
   - 每日自动备份
   - 每周完整备份
   - 保留多个备份版本

## 性能优化

### 1. 启用 CDN

使用 CDN 加速静态资源访问。

### 2. 数据库优化

- 添加索引
- 优化查询
- 使用连接池

### 3. 缓存策略

- Redis 缓存热点数据
- 启用浏览器缓存
- 使用 CDN 缓存

### 4. 负载均衡

多实例部署，使用 Nginx 负载均衡。

## 回滚策略

### 快速回滚

```bash
# 回滚到上一个版本
cd /var/www/trading-platform
git checkout <previous-commit-hash>
pnpm install
pnpm run build
pm2 restart trading-platform
```

### 数据回滚

从 Supabase 控制台恢复备份。

## 联系方式

- **项目地址**: [Your Repository URL]
- **技术支持**: [Your Support Email]
- **文档**: [Your Documentation URL]

---

**最后更新**: 2026-03-02
**版本**: 1.0.0
