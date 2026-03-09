# Metals-API 集成指南

## 概述

Metals-API 是一个专门提供贵金属（黄金、白银、铂金、钯金）行情的 API，具有高精度和高更新频率的优势。

本系统已集成 Metals-API，用于获取真实的黄金（XAUUSD）和白银（XAGUSD）价格。

---

## API 文档

官网：https://metals-api.com

---

## 请求示例

### 获取所有贵金属价格

```bash
curl "https://api.metals-api.com/v1/latest?access_key=YOUR_API_KEY&base=USD&symbols=XAU,XAG,XPT,XPD"
```

### 获取单个贵金属价格

```bash
curl "https://api.metals-api.com/v1/latest?access_key=YOUR_API_KEY&base=USD&symbols=XAU"
```

---

## 返回格式

```json
{
  "success": true,
  "timestamp": 1234567890,
  "base": "USD",
  "date": "2024-01-01",
  "rates": {
    "XAU": 0.000364,
    "XAG": 0.029412,
    "XPT": 0.000912,
    "XPD": 0.001234
  }
}
```

### 汇率换算

Metals-API 返回的汇率格式：`XAU: 0.000364`

表示：**0.000364 盎司黄金 = 1 美元**

换算公式：
```
黄金价格（美元/盎司）= 1 / XAU 汇率
```

示例：
```
如果返回 0.000364
那么：1 / 0.000364 ≈ 2747.25 美元/盎司
```

---

## 系统集成

### 1. 配置 API Key

在 `market-service/.env` 文件中添加：

```bash
METALS_API_KEY=your-metals-api-key-here
```

### 2. 自动获取价格

系统启动后，会自动：

1. 从 Metals-API 获取黄金白银的实时价格
2. 每 60 秒自动刷新一次
3. 使用真实价格更新 K 线和行情

### 3. 降级机制

如果 Metals-API 不可用（API Key 未配置或请求失败），系统会自动降级为模拟价格模式。

---

## 支持的交易对

| Metals-API 符号 | 系统符号 | 说明 |
|-----------------|----------|------|
| XAU | XAUUSD | 黄金 |
| XAG | XAGUSD | 白银 |
| XPT | XPTUSD | 铂金 |
| XPD | XPDUSD | 钯金 |

---

## 使用示例

### 1. 手动获取贵金属价格

```typescript
import { metalsCollector } from './src/collectors/metals-collector';

// 获取所有贵金属价格
const rates = await metalsCollector.getAllMetalsRates();
rates.forEach((rate) => {
  console.log(`${rate.symbol}: $${rate.price.toFixed(2)}`);
});

// 获取单个贵金属价格
const goldRate = await metalsCollector.getMetalsRate('XAUUSD');
if (goldRate) {
  console.log(`黄金价格: $${goldRate.price.toFixed(2)}`);
}

// 从缓存获取
const cachedGold = metalsCollector.getCachedRate('XAUUSD');
if (cachedGold) {
  console.log(`黄金价格（缓存）: $${cachedGold.price.toFixed(2)}`);
}
```

### 2. 启动自动刷新

```typescript
import { metalsCollector } from './src/collectors/metals-collector';

// 启动自动刷新（每 60 秒）
metalsCollector.startAutoRefresh(60000);

// 停止自动刷新
metalsCollector.stopAutoRefresh();
```

---

## 配置说明

### Metals-API 配置（`src/config/metals-api.ts`）

```typescript
export const METALS_API_CONFIG = {
  // API 端点
  baseUrl: 'https://api.metals-api.com/v1',

  // 默认基准货币
  base: 'USD',

  // 支持的贵金属符号
  symbols: ['XAU', 'XAG', 'XPT', 'XPD'],

  // 超时时间（毫秒）
  timeout: 10000,

  // 缓存时间（毫秒）
  cacheTTL: 30000, // 30秒
};
```

---

## 日志示例

### 启动时

```
[MetalsCollector] ✅ Enabled with API key
[MockDataGenerator] 🔄 Fetching real metals prices from Metals-API...
[MetalsCollector] 📡 Fetching metals rates...
[MetalsCollector] ✅ Fetched 2 metals rates:
  XAUUSD: $2747.25 (rate: 0.000364)
  XAGUSD: 33.50 (rate: 0.029412)
[MockDataGenerator] ✅ Loaded real price for XAUUSD: $2747.25
[MockDataGenerator] ✅ Loaded real price for XAGUSD: $33.50
[MetalsCollector] 🔄 Starting auto-refresh (interval: 60s)
```

### 定时刷新时

```
[MetalsCollector] 🔄 Auto-refreshing metals rates...
[MetalsCollector] 📡 Fetching metals rates...
[MetalsCollector] ✅ Fetched 2 metals rates:
  XAUUSD: $2748.50 (rate: 0.000364)
  XAGUSD: 33.52 (rate: 0.029411)
```

### 生成行情时

```
[MockDataGenerator] 📊 XAUUSD: $2747.25 (from Metals-API)
[MockDataGenerator] 📊 XAGUSD: $33.50 (from Metals-API)
```

---

## 错误处理

### 1. API Key 未配置

```
[MetalsCollector] ⚠️ Disabled (no API key configured)
[MetalsCollector] ℹ️ To enable, set METALS_API_KEY in .env file
[MockDataGenerator] ⚠️ Metals-API not available, using simulated prices for metals
```

**解决方案**：在 `.env` 文件中添加 `METALS_API_KEY`

### 2. API 请求失败

```
[MetalsCollector] 📡 Fetching metals rates...
[MetalsCollector] ❌ Error fetching metals rates: HTTP error! status: 401
```

**解决方案**：
- 检查 API Key 是否正确
- 检查 API Key 是否有效（是否过期）
- 检查网络连接

---

## 性能优化

### 1. 缓存机制

- 缓存时间：30 秒
- 自动过期：超过 30 秒的缓存会被自动清理
- 优先使用缓存：减少 API 请求次数

### 2. 自动刷新

- 默认间隔：60 秒
- 可配置：`metalsCollector.startAutoRefresh(interval)`
- 后台运行：不阻塞主流程

### 3. 降级机制

- API 失败：自动使用模拟价格
- 网络问题：自动重试（最多 3 次）
- 超时处理：10 秒超时，避免长时间阻塞

---

## 获取 API Key

1. 访问：https://metals-api.com
2. 注册账号
3. 获取 API Key
4. 在 `.env` 文件中配置

---

## 定价（参考）

| 计划 | 请求次数 | 价格 |
|------|----------|------|
| Free | 100 次/月 | 免费 |
| Basic | 1,000 次/月 | $9.99/月 |
| Professional | 10,000 次/月 | $49.99/月 |
| Business | 无限制 | $149.99/月 |

**注意**：价格仅供参考，请以官网为准。

---

## 常见问题

### Q1: Metals-API 免费吗？

**A**: Metals-API 提供免费计划（100 次/月），适合测试和小规模使用。生产环境建议使用付费计划。

### Q2: 如何切换回模拟价格模式？

**A**: 在 `.env` 文件中删除或注释掉 `METALS_API_KEY`，重启服务即可。

### Q3: 价格更新频率是多少？

**A**:
- Metals-API：实时更新
- 系统刷新：默认 60 秒
- 可配置：`metalsCollector.startAutoRefresh(interval)`

### Q4: 支持哪些货币？

**A**: 当前仅支持 USD 基准货币（`base=USD`），后续可扩展支持其他货币。

### Q5: 如何验证 API Key 是否有效？

**A**:
```bash
curl "https://api.metals-api.com/v1/latest?access_key=YOUR_API_KEY&base=USD&symbols=XAU"
```

如果返回 `{ "success": true, ... }`，则 API Key 有效。

---

## 技术支持

- Metals-API 官网：https://metals-api.com
- Metals-API 文档：https://metals-api.com/documentation
- GitHub Issues：提交问题反馈

---

## 总结

Metals-API 集成已完成，系统现在可以：

✅ 获取真实的黄金白银价格
✅ 自动刷新（每 60 秒）
✅ 缓存机制（30 秒）
✅ 降级机制（API 失败时使用模拟价格）
✅ 高精度和高更新频率

**下一步**：
1. 获取 Metals-API Key
2. 在 `.env` 文件中配置
3. 重启服务
4. 验证价格是否与实际市场同步

**参考价格（2025年1月）**：
- 黄金（XAUUSD）：~$2700-2800
- 白银（XAGUSD）：~$31-34
