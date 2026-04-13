# ST7全球交易平台 - 快速開始

## 🚀 部署狀態

✅ **項目準備完成**
- ✅ Git 已初始化
- ✅ 遠程倉庫已配置
- ✅ 代碼已提交到本地
- ✅ .gitignore 已配置
- ⚠️ **等待推送到 GitHub**

## 📋 當前需要做的事情

### 1️⃣ 推送代碼到 GitHub

**選項 A：使用 Personal Access Token（快速）**
1. 訪問：https://github.com/settings/tokens
2. 創建 Token（權限：repo）
3. 執行：`git push -u origin main`
4. 用戶名：`lianggang405-bit`
5. 密碼：粘貼 Token

**選項 B：配置 SSH 密鑰（推薦）**
1. 生成 SSH 密鑰：`ssh-keygen -t ed25519`
2. 復制公鑰到 GitHub：https://github.com/settings/keys
3. 修改遠程倉庫：`git remote set-url origin git@github.com:lianggang405-bit/st7-trading-platform.git`
4. 推送：`git push -u origin main`

詳細說明：查看 `GIT_AUTH_GUIDE.md`

### 2️⃣ 等待系統安裝完成

- VPS IP: 72.62.252.206
- 操作系統: Ubuntu 24.04 LTS
- 域名: forexpl.shop

### 3️⃣ 服務器部署

系統安裝好後，按照以下步驟部署：

```bash
# 連接到服務器
ssh root@72.62.252.206

# 安裝 Node.js 和 pnpm
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs
npm install -g pnpm

# 克隆項目
cd /var/www
sudo git clone https://github.com/lianggang405-bit/st7-trading-platform.git
cd st7-trading-platform

# 配置環境變量
cp .env.example .env.local
nano .env.local

# 填寫 Supabase 配置

# 安裝依賴
pnpm install

# 構建項目
pnpm run build

# 啟動服務
pm2 start npm --name "st7-trading-platform" -- start

# 配置 Nginx 和 SSL
#（詳見 DEPLOYMENT.md）
```

詳細說明：查看 `DEPLOYMENT.md`

---

## 📚 文檔索引

- `GIT_SETUP_GUIDE.md` - Git 設置和推送指南
- `GIT_AUTH_GUIDE.md` - Git 認證配置指南
- `DEPLOYMENT.md` - 完整部署指南
- `DEPLOYMENT_CHECKLIST.md` - 部署檢查清單
- `WEBSITE_CONFIG_SUMMARY.md` - 網站配置總結

---

## ✨ 項目特性

- 🎯 完整的交易平台功能
- 🔐 用戶認證和權限管理
- 📊 市價交易和掛單交易（含價格自動觸發）
- 💰 持倉管理和風控系統
- 📈 資產管理和訂單管理
- 🌍 多語言支持（6種語言）
- 📱 響應式設計（移動端優化）
- 🚀 PWA 支持
- 🔥 網站元數據配置（ST7品牌）
- 📊 實時價格數據（2026年3月）
- 🥇 **貴金屬實時價格**（黃金 XAUUSD ~$2700-2800，白銀 XAGUSD ~$31-34）
- 🔄 **智能錨定價格機制**（防止模擬價格長期偏離）
- 📡 **WebSocket 實時推送**（價格、訂單、K 線）
- 🛡️ **自動降級機制**（Yahoo Finance 失敗時使用數據庫價格）
- 📉 **偏差檢測和重置**（偏差>10%時自動重置錨定價格）

---

## 🌐 訪問地址



---

## 💡 下一步

1. ✅ **立即推送代碼到 GitHub**（查看 `GIT_AUTH_GUIDE.md`）
2. ⏳ **等待系統安裝完成**
3. 🚀 **部署到服務器**（查看 `DEPLOYMENT.md`）

---

**項目已準備就緒，等待部署！** 🎉
