# 数据架构说明

## 概述

本平台使用 Supabase 云数据库作为统一的数据源，确保前端、管理端和后端的数据一致性。

## 数据源

### 主数据源：Supabase

所有交易对数据存储在 Supabase 数据库的 `trading_pairs` 表中。

**数据库配置**：
- 项目 URL: `https://brfzboxaxknlypapwajy.supabase.co`
- 环境变量文件: `.env.local`

## API 接口

### 1. 前端交易对 API

**端点**: `GET /api/trading/symbols`

**功能**: 获取所有交易对数据，供前端市场页面和交易页面使用

**参数**:
- `category` (可选): 按分类过滤（forex, crypto, gold, energy, indices）
- `includeHidden` (可选): 是否包含隐藏的交易对（默认 false）

**响应示例**:
```json
{
  "success": true,
  "symbols": [
    {
      "symbol": "EURUSD",
      "price": 1.0856,
      "change": 0.25,
      "category": "forex",
      "currencyId": 1,
      "isVisible": true,
      "minOrderSize": 0.001,
      "maxOrderSize": 999999,
      "contractFee": 0.1
    }
  ],
  "total": 30
}
```

### 2. 管理端交易对 API

**端点**: `GET /api/admin/trading/adjust`

**功能**: 获取交易对及其调控机器人状态，供管理端调控机器人页面使用

**参数**:
- `page` (可选): 页码（默认 1）
- `limit` (可选): 每页数量（默认 15）
- `search` (可选): 搜索关键词

**响应示例**:
```json
{
  "success": true,
  "pairs": [
    {
      "id": 1,
      "symbol": "EURUSD",
      "currencyId": 1,
      "isVisible": true,
      "hasBot": false,
      "botName": null,
      "botId": null,
      "floatValue": 0,
      "isBotActive": false,
      "minOrderSize": 0.001,
      "maxOrderSize": 999999,
      "contractFee": 0.1,
      "createdAt": "2026/2/27 08:00:00"
    }
  ],
  "total": 30,
  "page": 1,
  "limit": 15
}
```

## 数据流

### 前端数据流

1. 用户访问市场页面或交易页面
2. 前端调用 `GET /api/trading/symbols` 从 Supabase 获取数据
3. API 返回交易对数据，包括价格、涨跌幅等信息
4. 前端使用 `useMarketStore` 管理交易对状态
5. 价格实时更新通过 `tick()` 方法模拟

```
Supabase Database → API (/api/trading/symbols) → Frontend → MarketStore → UI
```

### 管理端数据流

1. 管理员访问调控机器人页面
2. 管理端调用 `GET /api/admin/trading/adjust` 从 Supabase 获取数据
3. API 返回交易对及其调控机器人状态
4. 管理员可以创建、编辑、删除调控机器人
5. 所有操作直接更新 Supabase 数据库

```
Supabase Database → API (/api/admin/trading/adjust) → Admin UI
Admin UI → API (POST/PUT/DELETE) → Supabase Database
```

## 数据一致性保证

### 1. 单一数据源

- 所有交易对数据存储在 Supabase 的 `trading_pairs` 表
- 前端和管理端都从同一数据源读取数据
- 确保数据的一致性和实时性

### 2. 缓存策略

- 所有 API 响应设置 `Cache-Control: no-store` 禁用缓存
- 确保每次请求都获取最新数据
- 避免因缓存导致的数据不一致

### 3. 备用数据

- 如果 Supabase API 不可用，前端会使用本地 mock 数据
- 备用数据存储在 `src/lib/market-mock-data.ts`
- 备用数据应与数据库保持同步

### 4. 数据更新流程

当需要更新交易对时，请按照以下步骤：

1. **更新数据库**（推荐）
   - 访问管理端调控机器人页面 `/admin/trading/bots`
   - 直接在页面上添加、编辑或删除交易对
   - 数据会自动保存到 Supabase 数据库

2. **或者使用 SQL 更新**
   ```sql
   -- 添加新交易对
   INSERT INTO trading_pairs (symbol, currency_id, is_visible, min_order_size, max_order_size, contract_fee)
   VALUES ('NEWPAIR', 31, true, 0.001, 999999, 0.1);

   -- 更新交易对
   UPDATE trading_pairs SET is_visible = false WHERE symbol = 'OLDPAIR';

   -- 删除交易对
   DELETE FROM trading_pairs WHERE symbol = 'DELETED';
   ```

3. **更新备用数据**（可选）
   - 如果 API 不可用时需要备用数据，更新 `src/lib/market-mock-data.ts`
   - 确保备用数据与数据库保持一致

## 交易对分类

### 分类定义

- **Forex（外汇）**: 货币对（如 EURUSD, GBPUSD）
- **Gold（贵金属）**: 黄金、白银（如 XAUUSD, XAGUSD）
- **Crypto（加密货币）**: 数字货币（如 BTCUSD, ETHUSD）
- **Energy（能源）**: 原油、天然气（如 USOIL, NGAS）
- **Indices（指数）**: 股指（如 US500, ND25）

### 当前交易对数量

| 分类 | 数量 |
|------|------|
| Forex | 16 |
| Gold | 2 |
| Crypto | 6 |
| Energy | 3 |
| Indices | 3 |
| **总计** | **30** |

## 注意事项

1. **不要直接修改本地文件**
   - 不要修改 `src/lib/market-mock-data.ts` 作为主要数据源
   - 该文件仅作为备用数据使用

2. **优先使用管理端界面**
   - 使用 `/admin/trading/bots` 页面管理交易对
   - 避免直接操作数据库

3. **保持数据同步**
   - 当添加或删除交易对时，确保前端和管理端都能看到更新
   - 如果发现数据不一致，检查 API 是否正常工作

4. **API 优先级**
   - 前端优先从 Supabase 获取数据
   - 只有在 API 不可用时才使用本地备用数据

## 故障排查

### 前端无法获取交易对数据

1. 检查 Supabase 连接是否正常
2. 检查 `trading_pairs` 表是否存在
3. 查看浏览器控制台的错误信息
4. 检查 API 响应：`GET /api/trading/symbols`

### 管理端无法获取交易对数据

1. 检查 Supabase 连接是否正常
2. 检查 `trading_pairs` 和 `trading_bots` 表是否存在
3. 查看 `/admin/trading/setup` 页面的数据库状态
4. 检查 API 响应：`GET /api/admin/trading/adjust`

### 数据不一致

1. 确认数据是否从 Supabase 读取（不是本地 mock 数据）
2. 检查 API 响应头的缓存设置
3. 清除浏览器缓存并刷新页面
4. 确认 Supabase 数据库中的数据是否正确

## 总结

本架构确保了：

✅ 单一数据源（Supabase）
✅ 前端和管理端数据一致
✅ 实时数据更新
✅ 容错机制（备用数据）
✅ 易于维护和管理

任何关于数据的问题，请首先检查 Supabase 数据库和 API 响应。
