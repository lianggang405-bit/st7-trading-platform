#!/bin/bash

# ==============================================================================
# ST7 全球交易平台 - 服务器部署脚本
# ==============================================================================
# 适用于 Hostinger VPS 或 Ubuntu 24.04 LTS
# 使用方法: bash deploy-server.sh
# ==============================================================================

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

# 检查是否为 root 用户
check_root() {
    if [ "$EUID" -ne 0 ]; then
        log_error "请使用 root 用户运行此脚本"
        exit 1
    fi
}

# 检查操作系统
check_os() {
    if [ ! -f /etc/os-release ]; then
        log_error "无法检测操作系统"
        exit 1
    fi

    source /etc/os-release

    if [[ "$ID" != "ubuntu" ]]; then
        log_warn "此脚本针对 Ubuntu 系统优化，当前系统: $ID"
        read -p "是否继续？(y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi

    log_info "检测到操作系统: $PRETTY_NAME"
}

# 更新系统
update_system() {
    log_step "步骤 1: 更新系统"

    log_info "更新软件包列表..."
    apt-get update -y

    log_info "升级已安装的软件包..."
    apt-get upgrade -y

    log_info "清理不必要的软件包..."
    apt-get autoremove -y

    log_info "系统更新完成"
}

# 安装基础依赖
install_dependencies() {
    log_step "步骤 2: 安装基础依赖"

    log_info "安装 curl, wget, git, vim..."
    apt-get install -y curl wget git vim unzip

    log_info "安装 Node.js 24.x..."
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
    apt-get install -y nodejs

    log_info "安装 pnpm..."
    npm install -g pnpm

    log_info "验证安装..."
    node --version
    npm --version
    pnpm --version

    log_info "基础依赖安装完成"
}

# 安装 Nginx
install_nginx() {
    log_step "步骤 3: 安装和配置 Nginx"

    log_info "安装 Nginx..."
    apt-get install -y nginx

    log_info "启动 Nginx 服务..."
    systemctl start nginx
    systemctl enable nginx

    log_info "Nginx 安装完成"
}

# 安装 PM2
install_pm2() {
    log_step "步骤 4: 安装 PM2"

    log_info "安装 PM2..."
    npm install -g pm2

    log_info "PM2 安装完成"
}

# 创建部署目录
setup_project_dir() {
    log_step "步骤 5: 设置项目目录"

    PROJECT_DIR="/var/www/st7-trading-platform"

    log_info "创建项目目录: $PROJECT_DIR"
    mkdir -p $PROJECT_DIR

    log_info "设置目录权限..."
    chown -R $SUDO_USER:$SUDO_USER $PROJECT_DIR

    log_info "项目目录设置完成"
}

# 配置防火墙
configure_firewall() {
    log_step "步骤 6: 配置防火墙"

    log_info "安装 UFW（如果未安装）..."
    apt-get install -y ufw

    log_info "配置防火墙规则..."
    ufw allow 22/tcp    # SSH
    ufw allow 80/tcp    # HTTP
    ufw allow 443/tcp   # HTTPS
    ufw allow 5000/tcp  # 应用端口（如果需要直接访问）

    log_info "启用防火墙..."
    ufw --force enable

    log_info "防火墙配置完成"
}

# 安装 SSL（使用 Let's Encrypt）
install_ssl() {
    log_step "步骤 7: 配置 SSL 证书"

    read -p "是否配置 SSL 证书？(y/n) " -n 1 -r
    echo

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "请输入域名（例如: forexpl.shop）: " DOMAIN

        if [ -z "$DOMAIN" ]; then
            log_error "域名不能为空"
            exit 1
        fi

        log_info "安装 Certbot..."
        apt-get install -y certbot python3-certbot-nginx

        log_info "申请 SSL 证书..."
        certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN

        log_info "配置自动续期..."
        certbot renew --dry-run

        log_info "SSL 证书配置完成"
    else
        log_warn "跳过 SSL 配置"
    fi
}

# 创建环境变量模板
create_env_template() {
    log_step "步骤 8: 创建环境变量模板"

    PROJECT_DIR="/var/www/st7-trading-platform"
    ENV_FILE="$PROJECT_DIR/.env.production"

    log_info "创建环境变量文件: $ENV_FILE"
    cat > $ENV_FILE << EOF
# Supabase 配置
COZE_SUPABASE_URL=https://your-project.supabase.co
COZE_SUPABASE_ANON_KEY=your-anon-key
COZE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 应用配置
NODE_ENV=production
PORT=5000

# 时区
TZ=UTC

# 日志级别
LOG_LEVEL=info
EOF

    log_info "环境变量模板创建完成"
    log_warn "请编辑 $ENV_FILE 填写实际的配置值"
}

# 部署应用
deploy_app() {
    log_step "步骤 9: 部署应用"

    PROJECT_DIR="/var/www/st7-trading-platform"

    log_info "切换到项目目录..."
    cd $PROJECT_DIR

    log_info "克隆项目代码..."
    if [ -d ".git" ]; then
        log_info "项目已存在，拉取最新代码..."
        git pull origin main
    else
        log_info "克隆项目..."
        git clone https://github.com/lianggang405-bit/st7-trading-platform.git .
    fi

    log_info "安装依赖..."
    pnpm install --frozen-lockfile

    log_info "构建项目..."
    pnpm run build

    log_info "应用部署完成"
}

# 配置 PM2
configure_pm2() {
    log_step "步骤 10: 配置 PM2"

    PROJECT_DIR="/var/www/st7-trading-platform"

    log_info "创建 PM2 配置文件..."
    cat > $PROJECT_DIR/ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'st7-trading-platform',
    script: 'npm',
    args: 'run start',
    cwd: '/var/www/st7-trading-platform',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/var/log/st7-trading-platform/error.log',
    out_file: '/var/log/st7-trading-platform/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss'
  }]
};
EOF

    log_info "创建日志目录..."
    mkdir -p /var/log/st7-trading-platform
    chown -R $SUDO_USER:$SUDO_USER /var/log/st7-trading-platform

    log_info "启动应用..."
    pm2 start $PROJECT_DIR/ecosystem.config.js

    log_info "配置 PM2 开机自启..."
    pm2 startup
    pm2 save

    log_info "PM2 配置完成"
}

# 配置 Nginx 反向代理
configure_nginx() {
    log_step "步骤 11: 配置 Nginx 反向代理"

    read -p "是否配置 Nginx 反向代理？(y/n) " -n 1 -r
    echo

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "请输入域名（例如: forexpl.shop）: " DOMAIN

        if [ -z "$DOMAIN" ]; then
            log_error "域名不能为空"
            exit 1
        fi

        NGINX_CONF="/etc/nginx/sites-available/st7-trading-platform"

        log_info "创建 Nginx 配置文件: $NGINX_CONF"
        cat > $NGINX_CONF << EOF
server {
    listen 80;
    server_name $DOMAIN;

    # 日志
    access_log /var/log/nginx/st7-trading-platform-access.log;
    error_log /var/log/nginx/st7-trading-platform-error.log;

    # 反向代理
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 静态文件缓存
    location /_next/static {
        proxy_pass http://localhost:5000;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, immutable";
    }

    location /static {
        proxy_pass http://localhost:5000;
        proxy_cache_valid 200 30d;
        add_header Cache-Control "public";
    }
}
EOF

        log_info "启用站点配置..."
        ln -sf $NGINX_CONF /etc/nginx/sites-enabled/

        log_info "测试 Nginx 配置..."
        nginx -t

        log_info "重启 Nginx..."
        systemctl restart nginx

        log_info "Nginx 配置完成"
    else
        log_warn "跳过 Nginx 配置"
    fi
}

# 显示部署信息
show_deployment_info() {
    log_step "部署完成"

    echo ""
    echo "========================================"
    echo "  部署信息"
    echo "========================================"
    echo ""
    echo "项目目录: /var/www/st7-trading-platform"
    echo "应用端口: 5000"
    echo "PM2 状态: pm2 status"
    echo "Nginx 状态: systemctl status nginx"
    echo ""
    echo "常用命令:"
    echo "  查看应用日志: pm2 logs st7-trading-platform"
    echo "  重启应用: pm2 restart st7-trading-platform"
    echo "  停止应用: pm2 stop st7-trading-platform"
    echo "  重启 Nginx: systemctl restart nginx"
    echo ""
    echo "========================================"
    echo ""
}

# 主函数
main() {
    clear
    echo ""
    echo "========================================"
    echo "  ST7 全球交易平台 - 服务器部署"
    echo "========================================"
    echo ""
    echo "此脚本将在 Ubuntu 24.04 LTS 上部署 ST7 全球交易平台"
    echo ""

    read -p "是否继续？(y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi

    # 执行部署步骤
    check_root
    check_os
    update_system
    install_dependencies
    install_nginx
    install_pm2
    setup_project_dir
    configure_firewall
    create_env_template
    deploy_app
    configure_pm2
    install_ssl
    configure_nginx

    show_deployment_info
}

# 运行主函数
main
