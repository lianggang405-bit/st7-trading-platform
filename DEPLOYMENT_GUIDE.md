# 部署指南 - 更新服务器代码

## 问题说明

服务器上的 `src/app/api/user/positions/route.ts` 文件出现了 TypeScript 编译错误：
```
Type error: Block-scoped variable 'orderId' used before its declaration.
```

## 根本原因

服务器上的代码版本过旧，缺少以下修复：
- `orderId` 变量声明顺序修复
- 交易对分类逻辑修复
- K 线数据获取错误修复

## 工作区状态

✅ 工作区代码已通过 TypeScript 编译检查
✅ 所有修复已完成并提交
✅ 代码已推送到远程仓库

## 部署步骤

### 1. SSH 连接到服务器

```bash
ssh root@your-server-ip
```

### 2. 切换到项目目录

```bash
cd /var/www/st7-trading-platform
```

### 3. 拉取最新代码

```bash
git pull origin main
```

### 4. 验证代码更新

```bash
# 查看最新的提交历史
git log --oneline -5

# 应该能看到以下提交：
# - fix: 修复 K 线数据获取错误，空数据时返回空数组而非抛出异常
# - fix: 修复 positions API 中 orderId 变量声明顺序错误
# - fix: 修复交易对分类逻辑错误，优化前端过滤
```

### 5. 重新构建项目

```bash
# 安装依赖（如果需要）
pnpm install

# 构建项目
pnpm build
```

### 6. 重启服务

PM2 会自动重启，或者手动重启：

```bash
pm2 restart st7-trading-platform
```

### 7. 验证服务状态

```bash
# 查看服务状态
pm2 status

# 查看日志
pm2 logs st7-trading-platform --lines 50
```

## 修复内容

### 1. orderId 变量声明顺序修复

**文件**：`src/app/api/user/positions/route.ts`

- ✅ 模拟账户开仓逻辑：将 `orderId` 声明移到使用之前
- ✅ 真实账户开仓逻辑：将 `orderId` 声明移到使用之前
- ✅ 确保所有 `orderId` 声明在不同的作用域中

### 2. 交易对分类逻辑修复

**文件**：
- `src/app/api/trading/symbols/route.ts`
- `src/app/[locale]/market/page.tsx`
- `src/stores/marketStore.ts`
- `src/lib/market-mock-data.ts`

- ✅ Energy 类交易对正确分类为 "energy"
- ✅ CFD 类交易对正确分类为 "cfd"
- ✅ Metal 分类包含黄金和白银

### 3. K 线数据获取错误修复

**文件**：`src/lib/binance-klines.ts`

- ✅ API 返回空数据时返回空数组而非抛出错误
- ✅ 新增模拟数据生成功能

## 验证修复

部署后，请验证以下功能：

### 1. 模拟账户开仓

```bash
# 在浏览器控制台测试
fetch('/api/user/positions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer token_demo_test@example.com_123456'
  },
  body: JSON.stringify({
    symbol: 'XAUUSD',
    side: 'buy',
    volume: 0.1,
    price: 5000,
    orderType: 'market',
    leverage: 1
  })
})
```

### 2. 真实账户开仓

```bash
# 在浏览器控制台测试
fetch('/api/user/positions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer token_real_123456'
  },
  body: JSON.stringify({
    symbol: 'BTCUSD',
    side: 'buy',
    volume: 0.01,
    price: 65000,
    orderType: 'market',
    leverage: 1
  })
})
```

### 3. K 线数据获取

```bash
# 在浏览器访问
http://your-domain.com/api/klines?symbol=ETHUSD&interval=5M&limit=80
```

应该返回数据或空数组，而不是报错。

### 4. 交易对分类

访问市场页面，检查：
- Metal 分类包含黄金（XAUUSD）和白银（XAGUSD）
- Energy 分类包含 NGAS、UKOIL、USOIL
- CFD 分类包含 US500、ND25、AUS200

## 回滚方案

如果部署后出现问题，可以回滚到上一个版本：

```bash
# 查看提交历史
git log --oneline

# 回滚到指定版本
git reset --hard <commit-hash>

# 重新构建
pnpm build
pm2 restart st7-trading-platform
```

## 技术支持

如果部署过程中遇到问题，请提供：
1. Git 错误信息
2. 构建日志
3. PM2 日志

```bash
# 获取完整日志
pm2 logs st7-trading-platform --lines 100 --nostream
```

---

**更新时间**：2026-03-10
**版本**：v1.2.0
**提交范围**：a95e4b9..54d58ec
