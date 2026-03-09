# Market Collector Service

实时行情采集服务，支持从 Binance 获取加密货币实时价格数据，并自动生成 K 线数据。

## 功能特性

- ✅ 实时获取交易对价格（支持多种数据源）
- ✅ 自动写入数据库 tickers 表
- ✅ **K 线生成引擎（自动生成 1 分钟 K 线）**
- ✅ 自动重连机制
- ✅ 优雅退出处理
- ✅ 支持模拟数据生成（用于测试）

## 技术栈

- **TypeScript** - 类型安全
- **Supabase** - 数据库连接
- **WebSocket** - 实时数据流
- **Node.js** - 运行环境

## 安装依赖

```bash
cd market-service
npm install
```

## 配置环境变量

编辑 `.env` 文件，配置 Supabase 连接：

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

从项目的 `.env.local` 文件复制这些配置。

## 运行服务

### 1. 测试数据库连接

```bash
npm run test:db
```

### 2. 检查数据库中的数据

#### 检查实时价格（tickers 表）

```bash
npm run check:data
```

#### 检查 K 线数据（klines 表）

```bash
npm run check:klines
```

### 3. 运行采集器

#### 模拟数据生成器（推荐用于测试）

```bash
npm run collector:mock
```

**特点：**
- 不依赖外部 API，可在任何环境运行
- 模拟 BTCUSDT、ETHUSDT、SOLUSDT 价格波动
- 验证数据链路是否正常

#### Binance WebSocket 采集器

```bash
npm run collector:binance
```

**注意：** 需要能够访问 `wss://stream.binance.com:9443`

#### Binance HTTP API 采集器

```bash
npm run collector:binance-http
```

**注意：** 需要能够访问 `https://api.binance.com`

### 4. 开发模式（使用 tsx）

```bash
npm run dev
```

### 5. 生产模式（编译后运行）

```bash
# 编译
npm run build

# 运行
npm start
```

## 预期输出

### 完整服务输出（包含 K 线引擎）

```
🚀 Starting Market Collector Service...

1. Testing database connection...
[Database] Connection test successful

2. Starting mock data generator...
[MockDataGenerator] Starting mock data generator
[MockDataGenerator] Symbols: BTCUSDT, ETHUSDT, SOLUSDT
[MockDataGenerator] Interval: 3 seconds

3. Starting K-line flush timer (every 5s)...

✅ Market Collector Service is running!
📊 Collecting mock market data...
🕯️  K-line engine active (1m interval)
Press Ctrl+C to stop.

[MockDataGenerator] ✅ Updated ticker: BTCUSDT = $67136.20
[KlineEngine] 🆕 New 1m candle for BTCUSDT: Open=$67136.20, Time=12:04:00 AM
[MockDataGenerator] 📊 BTCUSDT: $67136.20 (0.20%)
[MockDataGenerator] ✅ Updated ticker: ETHUSDT = $3425.30
[KlineEngine] 🆕 New 1m candle for ETHUSDT: Open=$3425.30, Time=12:04:00 AM
[MockDataGenerator] ✅ Updated ticker: BTCUSDT = $67807.13
[KlineEngine] 📊 Updated 1m candle for BTCUSDT: O=$67136.20 H=$67807.13 L=$67136.20 C=$67807.13
[Timer] Flushing 3 cached candles...
[KlineEngine] 💾 Flushing 3 candles to database...
[KlineEngine] ✅ Successfully inserted 3 candles:
   BTCUSDT 1m: O=67136.20 H=67807.13 L=67136.20 C=67246.20 @12:04:00 AM
   ETHUSDT 1m: O=3425.30 H=3425.30 L=3400.31 C=3400.31 @12:04:00 AM
   SOLUSDT 1m: O=145.12 H=146.56 L=145.12 C=145.48 @12:04:00 AM
```

### K 线数据检查输出

```bash
npm run check:klines
```

```
Found 20 K-line records:

┌─────────┬───────────┬──────────┬────────────┬────────────┬────────────┬────────────┬──────────┬─────────────────────────┐
│ (index) │ Symbol    │ Interval │ Open       │ High       │ Low        │ Close      │ Volume   │ Time                    │
├─────────┼───────────┼──────────┼────────────┼────────────┼────────────┼────────────┼──────────┼─────────────────────────┤
│ 0       │ 'BTCUSDT' │ '1m'     │ '67310.58' │ '67310.58' │ '66930.76' │ '67071.64' │ '0.0000' │ '2026-03-09 12:04:00 AM'│
│ 1       │ 'ETHUSDT' │ '1m'     │ '3425.30'  │ '3425.30'  │ '3395.89'  │ '3393.89'  │ '0.0000' │ '2026-03-09 12:04:00 AM'│
│ 2       │ 'SOLUSDT' │ '1m'     │ '145.12'   │ '147.15'   │ '145.12'   │ '146.71'   │ '0.0000' │ '2026-03-09 12:04:00 AM'│
└─────────┴───────────┴──────────┴────────────┴────────────┴────────────┴────────────┴──────────┴─────────────────────────┘

✅ K-line chain verified: Mock Generator → Kline Engine → Supabase → klines table
```

### Binance WebSocket 采集器输出

```
🚀 Starting Market Collector Service...

1. Testing database connection...
[Database] Connection test successful

2. Starting Binance collector for BTCUSDT...
[BinanceCollector] Starting collector for BTCUSDT
[BinanceCollector] Connecting to wss://stream.binance.com:9443/ws/btcusdt@trade

✅ Market Collector Service is running!
📊 Collecting real-time market data...
Press Ctrl+C to stop.

[BinanceCollector] ✅ Connected to Binance WebSocket
[BinanceCollector] 📊 BTCUSDT: $67321.25 (Vol: 0.001)
[BinanceCollector] ✅ Updated ticker: BTCUSDT = $67321.25
[BinanceCollector] 📊 BTCUSDT: $67321.40 (Vol: 0.002)
[BinanceCollector] ✅ Updated ticker: BTCUSDT = $67321.40
```

## 验证数据

在 Supabase 控制台执行：

```sql
SELECT * FROM tickers WHERE symbol = 'BTCUSDT';
```

应该能看到实时更新的价格数据：

| symbol | price | volume | updated_at |
|--------|-------|--------|------------|
| BTCUSDT | 67321.40 | 0.002 | 2026-03-09 01:45:30 |

## 系统架构

```
数据源 (Binance / Mock)
       ↓
   Collector (采集器)
       ↓
   ┌──────────────┐
   │  Tick Stream  │ → tickers 表
   └──────────────┘
       ↓
   Kline Engine (K 线引擎)
       ↓
   klines 表 (1m K 线)
```

### 支持的数据源

1. **Binance WebSocket** - 实时数据流（需要网络访问）
2. **Binance HTTP API** - REST API 轮询（需要网络访问）
3. **模拟数据生成器** - 用于测试和演示（无需网络）

### K 线引擎工作流程

1. **实时价格更新** → 更新当前 1 分钟 K 线
2. **每 5 秒检查** → 是否有 K 线结束
3. **K 线结束** → 写入数据库
4. **新 K 线** → 重新开始

**示例：**
```
09:00:01  BTCUSDT 67000  → 新 K 线创建
09:00:15  BTCUSDT 67020  → 更新 K 线
09:00:40  BTCUSDT 66980  → 更新 K 线
09:00:59  BTCUSDT 67010  → 更新 K 线
09:01:00  BTCUSDT 67015  → K 线结束，写入数据库，新 K 线开始

结果：
Open:  67000
High:  67020
Low:   66980
Close: 67010
```

### 为什么提供模拟数据生成器？

由于某些网络环境可能无法直接访问 Binance API，因此提供了模拟数据生成器来：
- ✅ 验证数据库连接是否正常
- ✅ 验证数据写入逻辑是否正确
- ✅ 在受限网络环境中测试整个系统
- ✅ 作为开发环境的备用方案

## 下一步计划

### 短期目标
- [ ] 支持更多交易对（Forex、Metals、Oil、Indices）
- [ ] 支持 K 线数据采集 ✅
- [ ] 添加 market_cache 表
- [ ] 添加性能监控和日志

### 中期目标
- [ ] **多周期 K 线生成**（1m, 5m, 15m, 1h, 4h, 1d）
- [ ] 支持多数据源聚合
- [ ] 添加数据校验和异常处理
- [ ] 集成到主项目（Next.js API Routes）
- [ ] 添加 WebSocket 推送服务

### 长期目标
- [ ] 添加 Forex、Metals、Oil、Indices 真实数据源
- [ ] 支持多种时间周期（1m, 5m, 15m, 1h, 4h, 1d）
- [ ] 添加数据回溯和历史数据补全
- [ ] 实现分布式采集架构

## 注意事项

### 网络限制

由于某些网络环境可能无法访问 Binance API，请先测试：

```bash
# 测试 WebSocket 连接
curl -I https://stream.binance.com:9443/ws/btcusdt@trade

# 测试 HTTP API
curl https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT
```

如果无法访问，请使用模拟数据生成器：
```bash
npm run collector:mock
```

### 运行环境

- 确保 Supabase 配置正确
- 服务需要长时间运行，建议使用 PM2 或 Docker
- 确保有足够的网络带宽（如果是真实数据源）
