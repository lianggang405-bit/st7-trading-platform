# 行情数据报告

**生成时间**: 2026-04-08 21:55 (UTC+8)

---

## 1. 行情系统架构

### 1.1 两层价格系统

```
真实行情层（每6-12小时更新一次）
        ↓
模拟行情层（每秒更新）
        ↓
Tick Stream（实时价格流）
        ↓
Kline Aggregator（K线聚合器）
```

### 1.2 核心组件

| 组件 | 文件 | 说明 |
|------|------|------|
| 行情引擎 | `src/lib/marketEngine.ts` | 负责价格生成和更新 |
| 行情存储 | `src/store/marketStore.ts` | Zustand 全局状态管理 |
| 市场数据 API | `src/app/api/market/data/route.ts` | 提供 REST API 接口 |
| K线数据 API | `src/app/api/market/klines/route.ts` | 提供 K线数据 |
| K线聚合器 | `src/lib/kline-aggregator.ts` | 基于 Tick 聚合 K线 |

---

## 2. 支持的交易对

### 2.1 加密货币 (Crypto) - 波动率: 0.2%-0.4%

| 交易对 | 基准价 | 波动率 | 更新间隔 |
|--------|--------|--------|----------|
| BTCUSDT | 62,000 | 0.2% | 3小时 |
| ETHUSDT | 3,200 | 0.2% | 3小时 |
| LTCUSDT | 150 | 0.25% | 3小时 |
| SOLUSDT | 200 | 0.3% | 3小时 |
| XRPUSDT | 0.6 | 0.3% | 3小时 |
| DOGEUSDT | 0.2 | 0.4% | 3小时 |
| ADAUSDT | 1.2 | 0.3% | 3小时 |
| DOTUSDT | 8 | 0.3% | 3小时 |

### 2.2 贵金属 (Metal) - 波动率: 0.08%-0.15%

| 交易对 | 基准价 | 波动率 | 更新间隔 |
|--------|--------|--------|----------|
| XAUUSD | 5,200 | 0.08% | 6小时 |
| XAGUSD | 29.5 | 0.15% | 6小时 |

### 2.3 外汇 (Forex) - 波动率: 0.02%-0.03%

| 交易对 | 基准价 | 波动率 | 更新间隔 |
|--------|--------|--------|----------|
| EURUSD | 1.085 | 0.02% | 12小时 |
| GBPUSD | 1.265 | 0.03% | 12小时 |
| USDJPY | 149.8 | 0.03% | 12小时 |
| USDCHF | 0.884 | 0.025% | 12小时 |
| AUDUSD | 0.655 | 0.025% | 12小时 |
| NZDUSD | 0.609 | 0.025% | 12小时 |
| USDCAD | 1.366 | 0.025% | 12小时 |
| EURGBP | 0.859 | 0.02% | 12小时 |
| EURJPY | 162.5 | 0.025% | 12小时 |
| GBPJPY | 189.5 | 0.03% | 12小时 |
| AUDJPY | 98.2 | 0.03% | 12小时 |
| CADJPY | 110.5 | 0.03% | 12小时 |
| CHFJPY | 169.5 | 0.03% | 12小时 |

### 2.4 能源 (Energy) - 波动率: 0.1%-0.2%

| 交易对 | 基准价 | 波动率 | 更新间隔 |
|--------|--------|--------|----------|
| USOIL | 85 | 0.1% | 6小时 |
| UKOIL | 87.8 | 0.1% | 6小时 |
| NGAS | 2.8 | 0.2% | 6小时 |

### 2.5 指数/差价合约 (CFD) - 波动率: 0.03%-0.05%

| 交易对 | 基准价 | 波动率 | 更新间隔 |
|--------|--------|--------|----------|
| US500 | 5,200 | 0.03% | 12小时 |
| ND100 | 18,500 | 0.04% | 12小时 |
| AUS200 | 7,807 | 0.04% | 12小时 |
| UK100 | 8,098 | 0.04% | 12小时 |
| GER40 | 17,814 | 0.04% | 12小时 |
| JPN225 | 40,034 | 0.05% | 12小时 |

**总计**: 32 个交易对

---

## 3. 价格生成算法

### 3.1 核心算法

```typescript
// 1. 基础波动（随机）
const randomChange = (Math.random() - 0.5) * basePrice * volatility

// 2. 趋势影响（上涨/下跌/横盘）
let trendChange = 0
if (trend === 'up') trendChange = basePrice * volatility * 0.2
if (trend === 'down') trendChange = -basePrice * volatility * 0.2

// 3. 计算新价格
newPrice = currentPrice + randomChange + trendChange

// 4. 最大跳动限制（防止断崖式跳变）
maxStep = basePrice * volatility * 0.25
newPrice = clamp(newPrice, currentPrice - maxStep, currentPrice + maxStep)

// 5. 价格范围限制
newPrice = clamp(newPrice, basePrice * 0.97, basePrice * 1.03)
```

### 3.2 趋势系统

- 每小时有 10% 概率改变趋势
- 三种趋势状态: `up` (33%) / `down` (33%) / `neutral` (34%)
- 趋势强度: 0.1 - 0.6

---

## 4. 真实价格数据源

### 4.1 黄金/白银
- **API**: `https://api.gold-api.com`
- **状态**: ✅ 可用
- **示例响应**:
```json
{"currency":"USD","price":4779.40,"symbol":"XAU"}
```

### 4.2 加密货币
- **API**: `https://api.binance.com/api/v3/ticker/price`
- **状态**: ❌ 沙箱环境无法访问
- **替代方案**: 使用模拟价格

### 4.3 其他品种
- **状态**: ❌ 无外部 API
- **替代方案**: 使用模拟价格

---

## 5. 网络连通性测试

| 服务 | URL | 状态 |
|------|-----|------|
| Binance API | api.binance.com | ❌ 无法访问 |
| Gold API | api.gold-api.com | ✅ 可用 |
| Supabase | brfzboxaxknlypapwajy.supabase.co | ❌ 无法访问 |

---

## 6. API 接口

### 6.1 市场数据 API
```
GET /api/market/data?symbols=BTCUSDT,ETHUSDT
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "BTCUSDT": { "price": 62000 },
    "ETHUSDT": { "price": 3200 }
  },
  "timestamp": 1775655706568
}
```

### 6.2 K线数据 API
```
GET /api/market/klines?symbol=BTCUSDT&interval=1m&limit=100
```

### 6.3 实时流 API
```
GET /api/market/stream
```

---

## 7. 调控机器人 (Trading Bot)

### 7.1 机制
- 从 `trading_bots` 表读取 `float_value`
- 将 `float_value` 加到模拟价格上
- 缓存时间: 60秒

### 7.2 配置
- 交易对 ID 从 `trading_pairs` 表获取
- 调控值从 `trading_bots` 表获取

---

## 8. 当前问题与建议

### 8.1 问题

| 问题 | 影响 | 严重程度 |
|------|------|----------|
| Binance API 无法访问 | 加密货币无法获取真实价格 | 🔴 高 |
| Supabase 无法访问 | 无法使用调控机器人 | 🟡 中 |
| 黄金价格 API 可用 | 黄金可获取真实价格 | ✅ 正常 |

### 8.2 建议

1. **加密货币真实价格**:
   - 考虑使用其他可访问的加密货币 API
   - 或继续使用模拟价格（当前默认行为）

2. **调控机器人**:
   - 需要 Supabase 恢复后配置 `trading_pairs` 和 `trading_bots` 表

3. **黄金价格**:
   - 当前 `gold-api.com` 可用，XAUUSD 可以获取真实价格

---

## 9. 当前行情数据状态

```json
{
  "BTCUSDT": { "price": 62000, "basePrice": 62000 },
  "ETHUSDT": { "price": 3200, "basePrice": 3200 },
  "XAUUSD": { "price": 5200, "basePrice": 5200 },
  "EURUSD": { "price": 1.085, "basePrice": 1.085 }
}
```

**注意**: 当前所有价格都是模拟价格（初始基准价），因为:
- Binance API 无法访问（加密货币）
- Supabase 无法访问（无法读取调控机器人）

---

*报告生成完成*
