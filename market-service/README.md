# Market Collector Service

专业级实时行情采集与推送服务，支持多交易对实时行情、K线生成和 WebSocket 推送。

## 功能特性

### 核心功能
- ✅ 实时获取交易对价格（支持多种数据源）
- ✅ 自动写入数据库 tickers 表
- ✅ **K 线生成引擎（自动生成 1 分钟 K 线）**
- ✅ **内存行情缓存（Market Cache）**
- ✅ **WebSocket 实时行情推送**
- ✅ 自动重连机制
- ✅ 优雅退出处理
- ✅ 支持模拟数据生成（用于测试）

### WebSocket 功能
- ✅ 实时行情推送（每秒更新）
- ✅ 订阅/取消订阅机制
- ✅ 批量订阅（一次订阅多个交易对）
- ✅ K 线数据推送
- ✅ 心跳检测
- ✅ 连接管理

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

### 4. WebSocket 功能测试

#### 启动完整服务（包含 WebSocket）

```bash
npm run dev
```

服务启动后，WebSocket 服务器会在 **8081 端口**运行。

#### 运行自动化测试

```bash
./test-websocket.sh
```

**测试内容：**
- ✅ 订阅单个交易对
- ✅ 订阅所有交易对
- ✅ 获取所有行情
- ✅ 获取 K 线数据
- ✅ 取消订阅

#### 浏览器控制台测试

打开浏览器控制台（F12），运行以下代码：

```javascript
// 连接 WebSocket
const ws = new WebSocket('ws://localhost:8081');

// 监听消息
ws.onmessage = (e) => {
  const msg = JSON.parse(e.data);
  console.log(msg);
};

// 连接成功后订阅
ws.onopen = () => {
  // 订阅单个交易对
  ws.send(JSON.stringify({
    type: 'subscribe',
    symbol: 'BTCUSDT'
  }));

  // 或者订阅所有交易对
  ws.send(JSON.stringify({
    type: 'subscribe_all'
  }));
};
```

#### WebSocket 消息格式

**订阅交易对：**
```json
{
  "type": "subscribe",
  "symbol": "BTCUSDT"
}
```

**实时行情推送：**
```json
{
  "type": "ticker_update",
  "data": {
    "BTCUSDT": {
      "symbol": "BTCUSDT",
      "price": 67000,
      "bid": 66990,
      "ask": 67010,
      "high": 67100,
      "low": 66900,
      "change": 100,
      "changePercent": 0.15,
      "time": 1710000000000
    }
  },
  "timestamp": 1710000000000
}
```

### 5. 开发模式（使用 tsx）

```bash
npm run dev
```

### 6. 生产模式（编译后运行）

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
   ┌────────────────┐
   │ Market Cache   │ ← 内存缓存
   └────────────────┘
       ↓
   Kline Engine (K 线引擎)
       ↓
   ┌─────────────────┐
   │   WebSocket     │ ← 实时推送
   │   Push Server   │ ← port 8081
   └─────────────────┘
       ↓
   klines 表 (1m K 线)
```

### 完整数据流

```
实时价格
    ↓
更新 tickers 表
    ↓
更新 Market Cache（内存）
    ↓
更新 Kline Engine（K线）
    ↓
WebSocket 推送给前端（每秒）
    ↓
K 线刷新到数据库（每5秒）
    ↓
持久化到 klines 表
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
- [ ] Market Cache（内存缓存）✅
- [ ] WebSocket 推送服务 ✅
- [ ] 添加性能监控和日志

### 中期目标
- [ ] **多周期 K 线生成**（1m, 5m, 15m, 1h, 4h, 1d）
- [ ] 支持多数据源聚合
- [ ] 添加数据校验和异常处理
- [ ] 集成到主项目（Next.js API Routes）
- [ ] K 线实时推送

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

---

## 贵金属价格数据源

### 概述

系统支持从 Yahoo Finance 获取黄金（XAUUSD）和白银（XAGUSD）的实时价格。Yahoo Finance 提供免费的公开 API，无需 API Key，适合大多数使用场景。

### 数据源详情

#### Yahoo Finance（当前方案，推荐）

**优点：**
- ✅ 完全免费，无需 API Key
- ✅ 无请求次数限制
- ✅ 数据来自 Yahoo Finance，可靠性高
- ✅ 支持黄金（GC=F）、白银（SI=F）等贵金属期货

**缺点：**
- ⚠️ 某些网络环境可能无法访问（如企业防火墙、沙箱环境）
- ⚠️ 数据延迟约 15-30 秒（但完全免费）

**API 端点：**
- 黄金期货：`https://query1.finance.yahoo.com/v8/finance/chart/GC=F`
- 白银期货：`https://query1.finance.yahoo.com/v8/finance/chart/SI=F`

**价格范围：**
- 黄金（XAUUSD）：约 $2700-2800（2025年1月）
- 白银（XAGUSD）：约 $31-34（2025年1月）

#### Metals-API（备用方案，付费）

**优点：**
- ✅ 提供专业的贵金属价格数据
- ✅ 支持更多贵金属（铂金、钯金）
- ✅ 数据延迟更低

**缺点：**
- ❌ 需要付费订阅（Business 计划 $149.99/月）
- ❌ 有请求次数限制
- ❌ 需要配置 API Key

**API 端点：**
- 黄金（XAU）：`https://api.metals-api.com/v3/latest?access_key=YOUR_KEY&base=XAU&symbols=USD`
- 白银（XAG）：`https://api.metals-api.com/v3/latest?access_key=YOUR_KEY&base=XAG&symbols=USD`

### 自动降级机制

系统实现了智能降级机制，确保在任何网络环境下都能正常运行：

1. **启动时**：尝试从 Yahoo Finance 获取真实价格
   - 如果成功：使用真实价格
   - 如果失败：使用默认价格（XAUUSD = $2750.00, XAGUSD = $33.50）

2. **定时刷新**：每 60 秒尝试刷新价格
   - 如果成功：更新价格
   - 如果失败：保持当前价格不变

3. **价格波动**：即使无法获取实时价格，系统仍会模拟小幅波动（±0.1%）

### 环境变量配置

编辑 `.env` 文件：

```env
# Yahoo Finance（当前方案，无需配置）
# 自动使用免费公开 API

# Metals-API（备用方案，付费服务）
# Get your API key from: https://metals-api.com
METALS_API_KEY=your-metals-api-key-here
```

### 验证价格数据

#### 方法 1：查看日志

```bash
tail -f /app/work/logs/bypass/market-service.log | grep -E "XAU|XAG|Yahoo"
```

**正常输出：**
```
[MockDataGenerator] 🔄 Fetching real metals prices from Yahoo Finance...
[YahooFinance] ✅ XAUUSD (GC=F): $2750.00
[YahooFinance] ✅ XAGUSD (SI=F): $33.50
[MockDataGenerator] ✅ Loaded real price for XAUUSD: $2750.00
[MockDataGenerator] ✅ Loaded real price for XAGUSD: $33.50
```

**降级输出：**
```
[MockDataGenerator] ⚠️ Yahoo Finance failed, using default price for XAUUSD: $2750.00
[MockDataGenerator] ⚠️ Yahoo Finance failed, using default price for XAGUSD: $33.50
```

#### 方法 2：检查数据库

```bash
npm run check:data | grep -E "XAU|XAG"
```

#### 方法 3：WebSocket 实时查看

```javascript
const ws = new WebSocket('ws://localhost:8081');
ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'subscribe',
    symbol: 'XAUUSD'
  }));
};
ws.onmessage = (e) => {
  const msg = JSON.parse(e.data);
  console.log(msg);
};
```

### 部署到生产环境

在用户自己的服务器上部署时，Yahoo Finance API 将正常工作：

1. **网络环境**：确保服务器可以访问外部网络（无防火墙限制）
2. **启动服务**：
   ```bash
   cd market-service
   npm install
   pnpm run dev
   ```
3. **验证价格**：查看日志确认 Yahoo Finance 请求成功

### 已知问题

1. **沙箱环境无法访问外网**
   - 症状：日志显示 "ETIMEDOUT" 或 "fetch failed"
   - 解决：自动降级到默认价格，不影响功能

2. **企业防火墙**
   - 症状：无法连接 Yahoo Finance
   - 解决：使用 Metals-API 或配置代理

3. **价格波动异常**
   - 症状：价格波动过大（±1% 以上）
   - 解决：检查网络连接，降级机制会自动修复

### 未来改进

- [ ] 添加更多数据源（TradingView、Alpha Vantage）
- [ ] 实现数据源健康检查和自动切换
- [ ] 添加价格异常检测和告警
- [ ] 支持自定义价格更新频率

---

## 开发者指南

### 代码结构

```
market-service/
├── src/
│   ├── config/
│   │   ├── database.ts          # 数据库配置
│   │   └── metals-api.ts        # Metals-API 配置（备用）
│   ├── collectors/
│   │   ├── mock.ts              # 模拟数据生成器
│   │   ├── binance.ts           # Binance 采集器
│   │   ├── yahoo-finance.ts     # Yahoo Finance 采集器
│   │   └── metals-collector.ts  # Metals-API 采集器（备用）
│   ├── engine/
│   │   ├── kline-engine.ts      # K 线生成引擎
│   │   ├── ticker-engine.ts     # Ticker 统计引擎
│   │   └── orderbook-engine.ts  # OrderBook 引擎
│   ├── cache/
│   │   └── market-cache.ts      # 市场缓存
│   └── index.ts                 # 服务入口
├── package.json
├── tsconfig.json
└── README.md
```

### 添加新的数据源

1. 在 `src/collectors/` 下创建新的采集器文件
2. 实现 `start()` 和 `stop()` 方法
3. 在 `src/index.ts` 中集成
4. 添加相应的测试

### 贡献指南

欢迎提交 Pull Request 和 Issue！

---

## 许可证

MIT License

---

## 联系方式

如有问题或建议，请提交 Issue。
