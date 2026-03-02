# ST7全球交易平台 - 快速开始

## 🚀 部署状态

✅ **项目准备完成**
- ✅ Git 已初始化
- ✅ 远程仓库已配置
- ✅ 代码已提交到本地
- ✅ .gitignore 已配置
- ⚠️ **等待推送到 GitHub**

## 📋 当前需要做的事情

### 1️⃣ 推送代码到 GitHub

**选项 A：使用 Personal Access Token（快速）**
1. 访问：https://github.com/settings/tokens
2. 创建 Token（权限：repo）
3. 执行：`git push -u origin main`
4. 用户名：`lianggang405-bit`
5. 密码：粘贴 Token

**选项 B：配置 SSH 密钥（推荐）**
1. 生成 SSH 密钥：`ssh-keygen -t ed25519`
2. 复制公钥到 GitHub：https://github.com/settings/keys
3. 修改远程仓库：`git remote set-url origin git@github.com:lianggang405-bit/st7-trading-platform.git`
4. 推送：`git push -u origin main`

详细说明：查看 `GIT_AUTH_GUIDE.md`

### 2️⃣ 等待系统安装完成

- VPS IP: 72.62.252.206
- 操作系统: Ubuntu 24.04 LTS
- 域名: forexpl.shop

### 3️⃣ 服务器部署

系统安装好后，按照以下步骤部署：

```bash
# 连接到服务器
ssh root@72.62.252.206

# 安装 Node.js 和 pnpm
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs
npm install -g pnpm

# 克隆项目
cd /var/www
sudo git clone https://github.com/lianggang405-bit/st7-trading-platform.git
cd st7-trading-platform

# 配置环境变量
cp .env.example .env.local
nano .env.local

# 填写 Supabase 配置

# 安装依赖
pnpm install

# 构建项目
pnpm run build

# 启动服务
pm2 start npm --name "st7-trading-platform" -- start

# 配置 Nginx 和 SSL
#（详见 DEPLOYMENT.md）
```

详细说明：查看 `DEPLOYMENT.md`

---

## 📚 文档索引

- `GIT_SETUP_GUIDE.md` - Git 设置和推送指南
- `GIT_AUTH_GUIDE.md` - Git 认证配置指南
- `DEPLOYMENT.md` - 完整部署指南
- `DEPLOYMENT_CHECKLIST.md` - 部署检查清单
- `WEBSITE_CONFIG_SUMMARY.md` - 网站配置总结

---

## ✨ 项目特性

- 🎯 完整的交易平台功能
- 🔐 用户认证和权限管理
- 📊 市价交易和挂单交易（含价格自动触发）
- 💰 持仓管理和风控系统
- 📈 资产管理和订单管理
- 🌍 多语言支持（6种语言）
- 📱 响应式设计（移动端优化）
- 🚀 PWA 支持
- 🔥 网站元数据配置（ST7品牌）
- 📊 实时价格数据（2026年3月）

---

## 🌐 访问地址

- **本地开发**: http://localhost:5000
- **生产环境**: https://forexpl.shop（部署后）

---

## 💡 下一步

1. ✅ **立即推送代码到 GitHub**（查看 `GIT_AUTH_GUIDE.md`）
2. ⏳ **等待系统安装完成**
3. 🚀 **部署到服务器**（查看 `DEPLOYMENT.md`）

---

**项目已准备就绪，等待部署！** 🎉
