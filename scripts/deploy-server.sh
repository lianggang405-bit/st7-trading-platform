#!/bin/bash

# ==============================================================================
# ST7 鍏ㄧ悆浜ゆ槗骞冲彴 - 鏈嶅姟鍣ㄩ儴缃茶剼鏈?# ==============================================================================
# 閫傜敤浜?Hostinger VPS 鎴?Ubuntu 24.04 LTS
# 浣跨敤鏂规硶: bash deploy-server.sh
# ==============================================================================

set -e  # 閬囧埌閿欒绔嬪嵆閫€鍑?
# 棰滆壊瀹氫箟
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 鏃ュ織鍑芥暟
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

# 妫€鏌ユ槸鍚︿负 root 鐢ㄦ埛
check_root() {
    if [ "$EUID" -ne 0 ]; then
        log_error "璇蜂娇鐢?root 鐢ㄦ埛杩愯姝よ剼鏈?
        exit 1
    fi
}

# 妫€鏌ユ搷浣滅郴缁?check_os() {
    if [ ! -f /etc/os-release ]; then
        log_error "鏃犳硶妫€娴嬫搷浣滅郴缁?
        exit 1
    fi

    source /etc/os-release

    if [[ "$ID" != "ubuntu" ]]; then
        log_warn "姝よ剼鏈拡瀵?Ubuntu 绯荤粺浼樺寲锛屽綋鍓嶇郴缁? $ID"
        read -p "鏄惁缁х画锛?y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi

    log_info "妫€娴嬪埌鎿嶄綔绯荤粺: $PRETTY_NAME"
}

# 鏇存柊绯荤粺
update_system() {
    log_step "姝ラ 1: 鏇存柊绯荤粺"

    log_info "鏇存柊杞欢鍖呭垪琛?.."
    apt-get update -y

    log_info "鍗囩骇宸插畨瑁呯殑杞欢鍖?.."
    apt-get upgrade -y

    log_info "娓呯悊涓嶅繀瑕佺殑杞欢鍖?.."
    apt-get autoremove -y

    log_info "绯荤粺鏇存柊瀹屾垚"
}

# 瀹夎鍩虹渚濊禆
install_dependencies() {
    log_step "姝ラ 2: 瀹夎鍩虹渚濊禆"

    log_info "瀹夎 curl, wget, git, vim..."
    apt-get install -y curl wget git vim unzip

    log_info "瀹夎 Node.js 24.x..."
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
    apt-get install -y nodejs

    log_info "瀹夎 pnpm..."
    npm install -g pnpm

    log_info "楠岃瘉瀹夎..."
    node --version
    npm --version
    pnpm --version

    log_info "鍩虹渚濊禆瀹夎瀹屾垚"
}

# 瀹夎 Nginx
install_nginx() {
    log_step "姝ラ 3: 瀹夎鍜岄厤缃?Nginx"

    log_info "瀹夎 Nginx..."
    apt-get install -y nginx

    log_info "鍚姩 Nginx 鏈嶅姟..."
    systemctl start nginx
    systemctl enable nginx

    log_info "Nginx 瀹夎瀹屾垚"
}

# 瀹夎 PM2
install_pm2() {
    log_step "姝ラ 4: 瀹夎 PM2"

    log_info "瀹夎 PM2..."
    npm install -g pm2

    log_info "PM2 瀹夎瀹屾垚"
}

# 鍒涘缓閮ㄧ讲鐩綍
setup_project_dir() {
    log_step "姝ラ 5: 璁剧疆椤圭洰鐩綍"

    PROJECT_DIR="/var/www/st7-trading-platform"

    log_info "鍒涘缓椤圭洰鐩綍: $PROJECT_DIR"
    mkdir -p $PROJECT_DIR

    log_info "璁剧疆鐩綍鏉冮檺..."
    chown -R $SUDO_USER:$SUDO_USER $PROJECT_DIR

    log_info "椤圭洰鐩綍璁剧疆瀹屾垚"
}

# 閰嶇疆闃茬伀澧?configure_firewall() {
    log_step "姝ラ 6: 閰嶇疆闃茬伀澧?

    log_info "瀹夎 UFW锛堝鏋滄湭瀹夎锛?.."
    apt-get install -y ufw

    log_info "閰嶇疆闃茬伀澧欒鍒?.."
    ufw allow 22/tcp    # SSH
    ufw allow 80/tcp    # HTTP
    ufw allow 443/tcp   # HTTPS
    ufw allow 5000/tcp  # 搴旂敤绔彛锛堝鏋滈渶瑕佺洿鎺ヨ闂級

    log_info "鍚敤闃茬伀澧?.."
    ufw --force enable

    log_info "闃茬伀澧欓厤缃畬鎴?
}

# 瀹夎 SSL锛堜娇鐢?Let's Encrypt锛?install_ssl() {
    log_step "姝ラ 7: 閰嶇疆 SSL 璇佷功"

    read -p "鏄惁閰嶇疆 SSL 璇佷功锛?y/n) " -n 1 -r
    echo

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "璇疯緭鍏ュ煙鍚嶏紙渚嬪: forexpl.shop锛? " DOMAIN

        if [ -z "$DOMAIN" ]; then
            log_error "鍩熷悕涓嶈兘涓虹┖"
            exit 1
        fi

        log_info "瀹夎 Certbot..."
        apt-get install -y certbot python3-certbot-nginx

        log_info "鐢宠 SSL 璇佷功..."
        certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN

        log_info "閰嶇疆鑷姩缁湡..."
        certbot renew --dry-run

        log_info "SSL 璇佷功閰嶇疆瀹屾垚"
    else
        log_warn "璺宠繃 SSL 閰嶇疆"
    fi
}

# 鍒涘缓鐜鍙橀噺妯℃澘
create_env_template() {
    log_step "姝ラ 8: 鍒涘缓鐜鍙橀噺妯℃澘"

    PROJECT_DIR="/var/www/st7-trading-platform"
    ENV_FILE="$PROJECT_DIR/.env.production"

    log_info "鍒涘缓鐜鍙橀噺鏂囦欢: $ENV_FILE"
    cat > $ENV_FILE << EOF
# Supabase 閰嶇疆
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 搴旂敤閰嶇疆
NODE_ENV=production
PORT=5000

# 鏃跺尯
TZ=UTC

# 鏃ュ織绾у埆
LOG_LEVEL=info
EOF

    log_info "鐜鍙橀噺妯℃澘鍒涘缓瀹屾垚"
    log_warn "璇风紪杈?$ENV_FILE 濉啓瀹為檯鐨勯厤缃€?
}

# 閮ㄧ讲搴旂敤
deploy_app() {
    log_step "姝ラ 9: 閮ㄧ讲搴旂敤"

    PROJECT_DIR="/var/www/st7-trading-platform"

    log_info "鍒囨崲鍒伴」鐩洰褰?.."
    cd $PROJECT_DIR

    log_info "鍏嬮殕椤圭洰浠ｇ爜..."
    if [ -d ".git" ]; then
        log_info "椤圭洰宸插瓨鍦紝鎷夊彇鏈€鏂颁唬鐮?.."
        git pull origin main
    else
        log_info "鍏嬮殕椤圭洰..."
        git clone https://github.com/lianggang405-bit/st7-trading-platform.git .
    fi

    log_info "瀹夎渚濊禆..."
    pnpm install --frozen-lockfile

    log_info "鏋勫缓椤圭洰..."
    pnpm run build

    log_info "搴旂敤閮ㄧ讲瀹屾垚"
}

# 閰嶇疆 PM2
configure_pm2() {
    log_step "姝ラ 10: 閰嶇疆 PM2"

    PROJECT_DIR="/var/www/st7-trading-platform"

    log_info "鍒涘缓 PM2 閰嶇疆鏂囦欢..."
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

    log_info "鍒涘缓鏃ュ織鐩綍..."
    mkdir -p /var/log/st7-trading-platform
    chown -R $SUDO_USER:$SUDO_USER /var/log/st7-trading-platform

    log_info "鍚姩搴旂敤..."
    pm2 start $PROJECT_DIR/ecosystem.config.js

    log_info "閰嶇疆 PM2 寮€鏈鸿嚜鍚?.."
    pm2 startup
    pm2 save

    log_info "PM2 閰嶇疆瀹屾垚"
}

# 閰嶇疆 Nginx 鍙嶅悜浠ｇ悊
configure_nginx() {
    log_step "姝ラ 11: 閰嶇疆 Nginx 鍙嶅悜浠ｇ悊"

    read -p "鏄惁閰嶇疆 Nginx 鍙嶅悜浠ｇ悊锛?y/n) " -n 1 -r
    echo

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "璇疯緭鍏ュ煙鍚嶏紙渚嬪: forexpl.shop锛? " DOMAIN

        if [ -z "$DOMAIN" ]; then
            log_error "鍩熷悕涓嶈兘涓虹┖"
            exit 1
        fi

        NGINX_CONF="/etc/nginx/sites-available/st7-trading-platform"

        log_info "鍒涘缓 Nginx 閰嶇疆鏂囦欢: $NGINX_CONF"
        cat > $NGINX_CONF << EOF
server {
    listen 80;
    server_name $DOMAIN;

    # 鏃ュ織
    access_log /var/log/nginx/st7-trading-platform-access.log;
    error_log /var/log/nginx/st7-trading-platform-error.log;

    # 鍙嶅悜浠ｇ悊
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

        # 瓒呮椂璁剧疆
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 闈欐€佹枃浠剁紦瀛?    location /_next/static {
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

        log_info "鍚敤绔欑偣閰嶇疆..."
        ln -sf $NGINX_CONF /etc/nginx/sites-enabled/

        log_info "娴嬭瘯 Nginx 閰嶇疆..."
        nginx -t

        log_info "閲嶅惎 Nginx..."
        systemctl restart nginx

        log_info "Nginx 閰嶇疆瀹屾垚"
    else
        log_warn "璺宠繃 Nginx 閰嶇疆"
    fi
}

# 鏄剧ず閮ㄧ讲淇℃伅
show_deployment_info() {
    log_step "閮ㄧ讲瀹屾垚"

    echo ""
    echo "========================================"
    echo "  閮ㄧ讲淇℃伅"
    echo "========================================"
    echo ""
    echo "椤圭洰鐩綍: /var/www/st7-trading-platform"
    echo "搴旂敤绔彛: 5000"
    echo "PM2 鐘舵€? pm2 status"
    echo "Nginx 鐘舵€? systemctl status nginx"
    echo ""
    echo "甯哥敤鍛戒护:"
    echo "  鏌ョ湅搴旂敤鏃ュ織: pm2 logs st7-trading-platform"
    echo "  閲嶅惎搴旂敤: pm2 restart st7-trading-platform"
    echo "  鍋滄搴旂敤: pm2 stop st7-trading-platform"
    echo "  閲嶅惎 Nginx: systemctl restart nginx"
    echo ""
    echo "========================================"
    echo ""
}

# 涓诲嚱鏁?main() {
    clear
    echo ""
    echo "========================================"
    echo "  ST7 鍏ㄧ悆浜ゆ槗骞冲彴 - 鏈嶅姟鍣ㄩ儴缃?
    echo "========================================"
    echo ""
    echo "姝よ剼鏈皢鍦?Ubuntu 24.04 LTS 涓婇儴缃?ST7 鍏ㄧ悆浜ゆ槗骞冲彴"
    echo ""

    read -p "鏄惁缁х画锛?y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi

    # 鎵ц閮ㄧ讲姝ラ
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

# 杩愯涓诲嚱鏁?main

