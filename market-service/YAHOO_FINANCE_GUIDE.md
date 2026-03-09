# Yahoo Finance 集成指南（免费方案）

## 概述

Yahoo Finance 是一个完全免费的金融数据来源，提供股票、期货、外汇、贵金属等实时行情。

本系统已集成 Yahoo Finance，用于获取免费的黄金（XAUUSD）和白银（XAGUSD）价格。

---

## 为什么选择 Yahoo Finance？

### vs Metals-API（付费）

| 对比项 | Yahoo Finance | Metals-API |
|--------|---------------|------------|
| **费用** | ✅ 完全免费 | ❌ $149.99/月（Business 计划） |
| **请求次数** | ✅ 无限制 | ❌ Free: 100 次/月 |
| **更新频率** | ✅ 实时 | ✅ 实时 |
| **数据精度** | ✅ 高 | ✅ 高 |
| **API Key** | ✅ 不需要 | ❌ 需要 |

### 成本对比

假设需求：
- 黄金（XAUUSD）+ 白银（XAGUSD）
- 每 60 秒刷新一次

**每月请求次数**：
- 2 个交易对 × 60 分钟 × 24 小时 × 30 天 = **86,400 次/月**

**成本对比**：
| 方案 | 成本/月 |
|------|---------|
| **Yahoo Finance** | **$0** ✅ |
| Metals-API Free | 不可用（100次/月不够）
| Metals-API Business | **$149.99** ❌ |

**节省**：**$149.99/月** ≈ **¥1000/月**

---

## Yahoo Finance 集成

### 支持的交易对

| Yahoo Finance 符号 | 系统符号 | 说明 |
|-------------------|----------|------|
| GC=F | XAUUSD | 黄金期货 |
| SI=F | XAGUSD | 白银期货 |
| PL=F | XPTUSD | 铂金期货 |
| PA=F | XPDUSD | 钯金期货 |

### API 示例

#### 获取黄金价格
```bash
curl "https://query1.finance.yahoo.com/v8/finance/chart/GC=F"
```

#### 获取白银价格
```bash
curl "https://query1.finance.yahoo.com/v8/finance/chart/SI=F"
```

### 返回格式

```json
{
  "chart": {
    "result": [
      {
        "meta": {
          "currency": "USD",
          "symbol": "GC=F",
          "exchangeName": "COMEX",
          "instrumentType": "FUTURE",
          "firstTradeDate": 1538334000,
          "regularMarketTime": 1704079200,
          "gmtoffset": -18000,
          "timezone": "EST",
          "exchangeTimezoneName": "America/New_York",
          "regularMarketPrice": 2747.25,
          "chartPreviousClose": 2735.50,
          "priceHint": 2,
          "currentTradingPeriod": {
            "pre": {
              "timezone": "EST",
              "start": 1704082800,
              "end": 1704088200
            },
            "regular": {
              "timezone": "EST",
              "start": 1704088200,
              "end": 1704111600
            },
            "post": {
              "timezone": "EST",
              "start": 1704111600,
              "end": 1704126000
            }
          }
        }
      }
    ]
  }
}
```

**价格提取**：
```javascript
const price = data.chart.result[0].meta.regularMarketPrice;
// 黄金价格: $2747.25
```

---

## 系统集成

### 1. 自动获取价格

系统启动后，会自动：

1. 从 Yahoo Finance 获取黄金白银的实时价格
2. 每 60 秒自动刷新一次
3. 使用真实价格更新 K 线和行情

### 2. 降级机制

如果 Yahoo Finance 请求失败，系统会自动降级为模拟价格模式。

---

## 使用示例

### 手动获取贵金属价格

```typescript
import { getYahooFinancePrice, getAllMetalsPrices } from './src/collectors/yahoo-finance';

// 获取单个贵金属价格
const goldPrice = await getYahooFinancePrice('XAUUSD');
if (goldPrice !== null) {
  console.log(`黄金价格: $${goldPrice.toFixed(2)}`);
}

// 获取所有贵金属价格
const metalsPrices = await getAllMetalsPrices();
metalsPrices.forEach((price, symbol) => {
  console.log(`${symbol}: $${price.toFixed(2)}`);
});
```

---

## 日志示例

### 启动时

```
[MockDataGenerator] Starting mock data generator
[MockDataGenerator] 🔄 Fetching real metals prices from Yahoo Finance...
[YahooFinance] ✅ XAUUSD (GC=F): $2747.25
[YahooFinance] ✅ XAGUSD (SI=F): $33.50
[MockDataGenerator] ✅ Loaded real price for XAUUSD: $2747.25
[MockDataGenerator] ✅ Loaded real price for XAGUSD: $33.50
```

### 定时刷新时

```
[MockDataGenerator] 🔄 Refreshing metals prices from Yahoo Finance...
[YahooFinance] ✅ XAUUSD (GC=F): $2748.50
[YahooFinance] ✅ XAGUSD (SI=F): $33.52
[MockDataGenerator] ✅ Updated price for XAUUSD: $2748.50
[MockDataGenerator] ✅ Updated price for XAGUSD: $33.52
```

### 生成行情时

```
[MockDataGenerator] 📊 XAUUSD: $2747.25 (from Yahoo Finance)
[MockDataGenerator] 📊 XAGUSD: $33.50 (from Yahoo Finance)
```

---

## 错误处理

### 1. 网络问题

```
[YahooFinance] ❌ Error fetching XAUUSD price: fetch failed
[MockDataGenerator] ⚠️ No Yahoo Finance data, using simulated price
```

**解决方案**：
- 检查网络连接
- 系统会自动降级为模拟价格

### 2. Yahoo Finance 维护

```
[YahooFinance] ❌ Error fetching XAUUSD price: HTTP error! status: 500
```

**解决方案**：
- 系统会自动降级为模拟价格
- 等待 Yahoo Finance 恢复

---

## 性能优化

### 1. 定时刷新

- 默认间隔：60 秒
- 减少网络请求：每分钟只请求一次
- 自动更新价格到内存缓存

### 2. 降级机制

- API 失败：自动使用模拟价格
- 网络问题：不影响系统运行
- 超时处理：使用 fetch 的默认超时

### 3. 并发请求

- 并发获取所有贵金属价格
- 减少等待时间
- 提升效率

---

## 其他免费替代方案

除了 Yahoo Finance，还有以下免费方案：

### 1. Alpha Vantage

**优点**：
- ✅ 免费计划（25 次/天）
- ✅ 数据质量高

**缺点**：
- ❌ 请求次数少（25 次/天）
- ❌ 不适合实时更新

**适用场景**：每日更新一次基准价格

### 2. TradingView

**优点**：
- ✅ 免费获取图表数据
- ✅ 数据来源可靠

**缺点**：
- ❌ 需要爬虫
- ❌ 可能违反 ToS

### 3. Investing.com

**优点**：
- ✅ 免费查看行情

**缺点**：
- ❌ 需要 API Key（付费）
- ❌ 爬虫可能违反 ToS

### 4. 固定基准价格 + 模拟波动

**优点**：
- ✅ 完全免费
- ✅ 无需 API

**缺点**：
- ❌ 不是真实市场价格

**实现方式**：
```typescript
// 每天手动更新一次基准价格
const goldBasePrice = 2747.25; // 2025-01-01 实际价格

// 基于基准价格进行 ±0.05% 的随机波动
const changePercent = (Math.random() - 0.5) * 0.001;
const goldPrice = goldBasePrice * (1 + changePercent);
```

---

## 常见问题

### Q1: Yahoo Finance API 真的免费吗？

**A**: ✅ 是的，Yahoo Finance 提供免费的公开 API，无需注册，无需 API Key，无请求次数限制。

### Q2: 数据质量如何？

**A**: ✅ Yahoo Finance 的数据质量很高，被广泛应用于金融应用中。数据来源于全球各大交易所，更新频率高。

### Q3: 是否需要注册？

**A**: ❌ 不需要。Yahoo Finance 的公开 API 可以直接使用，无需注册或获取 API Key。

### Q4: 会违反 Yahoo Finance 的 ToS 吗？

**A**: ⚠️ Yahoo Finance 的公开 API 被广泛使用，用于非商业目的通常是允许的。商业用途请查看 Yahoo Finance 的 ToS。

### Q5: 价格更新频率是多少？

**A**:
- Yahoo Finance：实时更新
- 系统刷新：默认 60 秒
- 可配置：修改 `metalsRefreshTimer` 间隔

---

## 技术支持

- Yahoo Finance：https://finance.yahoo.com/
- Yahoo Finance API 文档：https://finance.yahoo.com/quote/XXX

---

## 总结

Yahoo Finance 集成已完成，系统现在可以：

✅ 获取真实的黄金白银价格（免费）
✅ 自动刷新（每 60 秒）
✅ 降级机制（API 失败时使用模拟价格）
✅ 无需 API Key
✅ 无请求次数限制
✅ 数据质量高

**成本对比**：
| 方案 | 成本/月 |
|------|---------|
| **Yahoo Finance** | **$0** ✅ |
| Metals-API Business | **$149.99** ❌ |

**节省**：**$149.99/月** ≈ **¥1000/月**

**下一步**：
1. 重启服务
2. 验证价格是否与实际市场同步
3. 享受免费的黄金白银行情数据！
