# Market Collector Service

实时行情采集服务，支持从 Binance 获取加密货币实时价格数据。

## 功能特性

- ✅ 实时获取交易对价格（支持多种数据源）
- ✅ 自动写入数据库 tickers 表
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

```bash
npx tsx check-data.ts
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

### 模拟数据生成器输出

```
[MockDataGenerator] Starting mock data generator
[MockDataGenerator] Symbols: BTCUSDT, ETHUSDT, SOLUSDT
[MockDataGenerator] Interval: 3 seconds
[MockDataGenerator] 📊 BTCUSDT: $67373.40 (0.56%)
[MockDataGenerator] ✅ Updated ticker: BTCUSDT = $67373.40
[MockDataGenerator] 📊 ETHUSDT: $3360.15 (-0.22%)
[MockDataGenerator] ✅ Updated ticker: ETHUSDT = $3360.15
[MockDataGenerator] 📊 SOLUSDT: $145.63 (0.44%)
[MockDataGenerator] ✅ Updated ticker: SOLUSDT = $145.63
...
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
   Supabase Database
       ↓
   tickers 表
```

### 支持的数据源

1. **Binance WebSocket** - 实时数据流（需要网络访问）
2. **Binance HTTP API** - REST API 轮询（需要网络访问）
3. **模拟数据生成器** - 用于测试和演示（无需网络）

### 为什么提供模拟数据生成器？

由于某些网络环境可能无法直接访问 Binance API，因此提供了模拟数据生成器来：
- ✅ 验证数据库连接是否正常
- ✅ 验证数据写入逻辑是否正确
- ✅ 在受限网络环境中测试整个系统
- ✅ 作为开发环境的备用方案

## 下一步计划

- [ ] 支持更多交易对（Forex、Metals、Oil、Indices）
- [ ] 支持 K 线数据采集
- [ ] 添加 market_cache 表
- [ ] 添加性能监控和日志
- [ ] 支持多数据源聚合
- [ ] 添加数据校验和异常处理
- [ ] 集成到主项目（Next.js API Routes）
- [ ] 添加 WebSocket 推送服务

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
