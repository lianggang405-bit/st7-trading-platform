# K 线引擎架构说明

## 概述

新的 K 线引擎采用交易所级架构，支持同时生成多个时间间隔的 K 线数据（1m、5m、15m），并自动生成平盘K线以防止数据断层。

## 核心特性

### 1. 多时间间隔支持
- 支持同时生成 1m、5m、15m 三个时间间隔的 K 线
- 不再需要单独的聚合引擎（kline-aggregator.ts）

### 2. 平盘K线自动生成
- 为所有交易对生成当前周期的平盘K线
- 解决无交易分钟导致的数据断层问题

### 3. 内存缓存优化
- 使用精确的缓存 Key：`${symbol}_${interval}_${openTime}`
- 避免同一 interval 的多个 K 线混淆

### 4. 批量写入数据库
- 使用 Supabase 的 upsert API
- 支持 ON CONFLICT DO NOTHING（通过 `onConflict: 'symbol,interval,open_time'`）

## 数据流

```
行情 Tick
    │
    ▼
updateCandle(symbol, price, volume)
    │
    ├───> 1m K线
    ├───> 5m K线
    └───> 15m K线
         │
         ▼
    CandleCache (内存)
         │
         ▼
generateFlatCandles() (每5秒)
    │
    ▼
flushCandles() (每5秒)
    │
    ▼
Supabase PostgreSQL
    │
    ▼
TradingView API
```

## API 说明

### updateCandle(symbol, price, volume)
更新 K 线数据，同时更新 1m、5m、15m 三个时间间隔。

**参数：**
- `symbol`: 交易对（如 BTCUSDT）
- `price`: 当前价格
- `volume`: 成交量（可选，默认 0）

**示例：**
```typescript
updateCandle('BTCUSDT', 67250, 0.01);
updateCandle('XAUUSD', 2345.2, 0.5);
updateCandle('USDCHF', 0.8943, 1000);
```

### generateFlatCandles()
为所有交易对生成当前周期的平盘K线（无交易分钟）。

**逻辑：**
1. 遍历所有有 `lastPrices` 的交易对
2. 为每个交易对生成 1m、5m、15m 的平盘K线
3. 平盘K线：`open = high = low = close = lastPrice, volume = 0`

**调用时机：**
- 每 5 秒自动调用（在 market-service/src/index.ts 的定时器中）

### flushCandles()
将缓存的 K 线批量写入数据库。

**逻辑：**
1. 获取所有缓存的 K 线
2. 使用 Supabase 的 upsert API 批量写入
3. 通过 `onConflict: 'symbol,interval,open_time'` 自动去重
4. 清空缓存

**调用时机：**
- 每 5 秒自动调用（在 market-service/src/index.ts 的定时器中）

## 缓存策略

### 缓存 Key 格式
```
${symbol}_${interval}_${openTime}
```

**示例：**
- `BTCUSDT_1m_1234567890000`
- `BTCUSDT_5m_1234567890000`
- `BTCUSDT_15m_1234567890000`

### 缓存结构
```typescript
const candleCache: Record<string, Candle> = {};
```

### lastPrices 记录
```typescript
const lastPrices: Record<string, number> = {};
```

用于记录每个交易对的最后成交价格，用于生成平盘K线。

## 时间对齐

### openTime 计算逻辑
```typescript
function getOpenTime(ts: number, interval: Interval) {
  const ms = getIntervalMs(interval);
  return Math.floor(ts / ms) * ms;
}
```

**示例：**
- 当前时间：`2024-01-01 12:34:56`（1704118496000）
- 1m openTime：`2024-01-01 12:34:00`（1704118440000）
- 5m openTime：`2024-01-01 12:35:00`（1704118500000）
- 15m openTime：`2024-01-01 12:30:00`（1704118200000）

## 数据库结构

### klines 表
```sql
CREATE TABLE klines (
  id BIGSERIAL PRIMARY KEY,
  symbol TEXT,
  interval TEXT,
  open NUMERIC,
  high NUMERIC,
  low NUMERIC,
  close NUMERIC,
  volume NUMERIC,
  open_time TIMESTAMP,
  close_time TIMESTAMP
);

CREATE UNIQUE INDEX uniq_kline
ON klines(symbol, interval, open_time);
```

### 唯一约束
- `symbol` + `interval` + `open_time` 组合唯一
- 自动去重，防止重复写入

## 平盘K线生成机制

### 触发条件
- 当前周期的 K 线不存在于缓存中
- 交易对有 `lastPrices` 记录

### 生成逻辑
```typescript
const candle = {
  symbol,
  open: price,    // 使用前一根收盘价
  high: price,    // 使用前一根收盘价
  low: price,     // 使用前一根收盘价
  close: price,   // 使用前一根收盘价
  volume: 0,      // 成交量为 0
  openTime,
  closeTime: openTime + intervalMs,
  interval,
};
```

### 效果对比

#### 修复前
```
21:00 (有交易)
21:05 (有交易)
21:15 (有交易)
21:30 (有交易)
```
- TradingView 显示：空白、断层、细线 ❌

#### 修复后
```
21:00 (有交易)
21:01 (平盘K线) - 自动生成
21:02 (平盘K线) - 自动生成
21:03 (平盘K线) - 自动生成
21:04 (平盘K线) - 自动生成
21:05 (有交易)
21:06 (平盘K线) - 自动生成
...
21:15 (有交易)
...
21:30 (有交易)
```
- TradingView 显示：连续、无空白、无细线 ✅

## 与旧架构的对比

### 旧架构
```
Tick → updateCandle(1m) → KlineCache → flushCandles → DB
                                                  ↓
                                        klineAggregator
                                                  ↓
                                        1m → 5m → 15m
```

**问题：**
- 只处理 1m，需要单独的聚合引擎
- 聚合引擎从 `symbols` 表获取交易对，可能导致遗漏
- 聚合后的时间对齐可能不准确

### 新架构
```
Tick → updateCandle(1m/5m/15m) → KlineCache → flushCandles → DB
```

**优势：**
- 同时更新 1m、5m、15m，无需聚合
- 所有交易对都自动处理
- 时间对齐精确
- 性能更好（无需聚合计算）

## 性能优化

### 1. 批量写入
- 使用 Supabase 的 upsert API
- 一次请求写入多个 K 线

### 2. 缓存优化
- 使用精确的缓存 Key
- 避免重复计算

### 3. 去重机制
- 使用数据库的 UNIQUE INDEX
- ON CONFLICT DO NOTHING
- 避免重复写入

## 测试验证

### 1. 多时间间隔测试
```typescript
// 测试 updateCandle 是否同时更新 1m、5m、15m
updateCandle('BTCUSDT', 67250, 0.01);
// 预期：生成 3 个 K 线（1m、5m、15m）
```

### 2. 平盘K线测试
```typescript
// 测试 generateFlatCandles 是否生成平盘K线
generateFlatCandles();
// 预期：为所有交易对生成 1m、5m、15m 的平盘K线
```

### 3. 缓存Key测试
```typescript
// 测试缓存 Key 是否正确
const cacheKey = getCacheKey('BTCUSDT', '1m', 1234567890000);
// 预期：'BTCUSDT_1m_1234567890000'
```

### 4. 时间对齐测试
```typescript
// 测试 openTime 是否正确对齐
const openTime = getOpenTime(1704118496000, '5m');
// 预期：1704118500000（2024-01-01 12:35:00）
```

## 注意事项

1. **定时器调用顺序**：
   - 先调用 `generateFlatCandles()` 生成平盘K线
   - 再调用 `flushCandles()` 写入数据库

2. **备份文件**：
   - 旧版 `kline-engine.ts` 已备份到 `kline-engine.ts.backup`
   - 旧版 `kline-aggregator.ts` 已备份到 `kline-aggregator.ts.backup`

3. **依赖关系**：
   - 不再依赖 `kline-aggregator.ts`
   - 已从 `market-service/src/index.ts` 中移除相关导入和调用

## 后续优化建议

1. **扩展时间间隔**：
   - 可扩展支持 30m、1h、4h、1d 等更长时间间隔

2. **性能监控**：
   - 添加 K 线生成速率统计
   - 监控数据库写入性能

3. **容错机制**：
   - 添加数据库写入失败重试
   - 添加缓存丢失恢复机制

4. **分布式支持**：
   - 使用 Redis 替代内存缓存
   - 支持多实例部署
