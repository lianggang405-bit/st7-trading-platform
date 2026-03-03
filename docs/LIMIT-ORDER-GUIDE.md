# 挂单交易（限价单）说明

## 概述

挂单交易（Limit Order）允许用户指定交易价格，只有当市场价格达到或超过指定价格时才自动成交。

## 工作流程

### 1. 用户下单

用户通过交易界面创建限价单，提供以下信息：
- 交易对（如 BTCUSD）
- 方向（买入/卖出）
- 价格（触发价格）
- 数量
- 杠杆倍数

**系统行为**：
- 验证用户余额是否充足
- 扣除保证金
- 创建订单，状态设为 `pending`
- 订单记录到 `orders` 表

### 2. 价格监控

系统通过以下方式监控价格：

**方式 1：市场数据流集成**（推荐）
- 每次 `/api/market/stream` 推送价格更新时
- 自动检查所有 pending 状态的限价单
- 异步执行，不阻塞数据推送

**方式 2：手动触发**
- 访问管理页面 `/admin/order-monitor`
- 点击"立即监控"按钮
- 调用 `/api/trading/monitor-orders` 接口

### 3. 触发条件

订单触发条件根据交易方向而定：

**买单（buy）**：
- 条件：当前价格 ≤ 订单价格
- 说明：价格降到指定价格时触发买入

**卖单（sell）**：
- 条件：当前价格 ≥ 订单价格
- 说明：价格涨到指定价格时触发卖出

### 4. 自动成交

当订单满足触发条件时：

**系统行为**：
1. 更新订单状态：`pending` → `open`
2. 使用实际成交价格（当前市场价格）
3. 创建持仓记录到 `positions` 表
4. 记录成交时间和价格

**持仓信息**：
- 使用当前市场价格作为开仓价格
- 扣除的保证金转为持仓保证金
- 利润从 0 开始计算

### 5. 过期取消

超过 24 小时未触发的订单会自动取消：

**系统行为**：
- 检查创建时间超过 24 小时的 pending 订单
- 更新订单状态：`pending` → `cancelled`
- 返还扣除的保证金到用户余额

## API 接口

### 1. 创建订单（用户下单）

**接口**：`POST /api/user/positions`

**请求体**：
```json
{
  "symbol": "BTCUSD",
  "side": "buy",
  "orderType": "limit",
  "price": 94000,
  "volume": 0.1,
  "leverage": 10
}
```

**响应**：
```json
{
  "success": true,
  "data": {
    "id": "order_id",
    "symbol": "BTCUSD",
    "side": "buy",
    "volume": 0.1,
    "openPrice": 94000,
    "status": "pending"
  }
}
```

### 2. 订单监控（管理员）

**接口**：`POST /api/trading/monitor-orders`

**请求体**：
```json
{
  "action": "trigger" // 或 "cancel-expired" 或 "both"
}
```

**响应**：
```json
{
  "success": true,
  "data": {
    "trigger": {
      "success": true,
      "triggered": 2,
      "failed": 0,
      "errors": []
    },
    "cancelled": 1
  }
}
```

### 3. 查询订单

**接口**：`GET /api/user/positions?status=pending`

**响应**：
```json
{
  "success": true,
  "data": [
    {
      "id": "order_id",
      "symbol": "BTCUSD",
      "side": "buy",
      "order_type": "limit",
      "quantity": 0.1,
      "price": 94000,
      "status": "pending",
      "created_at": "2026-03-03T12:00:00Z"
    }
  ]
}
```

## 订单状态

| 状态 | 说明 | 可转换状态 |
|------|------|----------|
| `pending` | 等待价格触发 | `open`, `cancelled` |
| `open` | 已成交，持仓中 | `closed` |
| `closed` | 已平仓 | - |
| `cancelled` | 已取消 | - |

## 常见问题

### Q1: 限价单会立即成交吗？

A: 不会。限价单只有在市场价格达到或超过指定价格时才会自动成交。在此之前，订单状态为 `pending`，处于等待状态。

### Q2: 如何查看我的挂单？

A: 在交易界面选择"订单"或"挂单"选项卡，可以查看所有状态为 `pending` 的订单。

### Q3: 订单触发后，成交价格是什么？

A: 订单触发后，使用触发时刻的市场价格作为成交价格，而不是订单指定价格。这样可以确保成交价格是当前真实的市场价格。

### Q4: 挂单可以取消吗？

A: 可以。用户可以在交易界面取消挂单，系统会自动返还扣除的保证金。此外，超过 24 小时未触发的订单也会自动取消。

### Q5: 如果价格只是短暂达到触发条件会怎样？

A: 只要价格在监控时达到触发条件，订单就会自动成交，不会撤销。系统每次监控都会检查所有 pending 订单。

### Q6: 订单监控的频率是多久？

A: 订单监控在每次市场数据更新时执行，默认每 1 秒检查一次。可以通过修改 `/api/market/stream` 的 `interval` 参数调整。

### Q7: 如果订单触发失败会怎样？

A: 如果订单触发失败（如持仓创建失败），系统会尝试回滚订单状态，保持订单为 `pending`。失败的错误会在管理页面显示，管理员可以手动处理。

### Q8: 限价单和市价单有什么区别？

A:
- **市价单**：立即以当前市场价格成交，订单状态直接为 `open`
- **限价单**：等待价格达到指定价格才成交，订单状态先为 `pending`，触发后变为 `open`

## 最佳实践

1. **合理设置触发价格**：根据市场行情和技术分析设置合理的触发价格，避免设置过高或过低的价格导致订单长时间无法成交。

2. **定期检查订单状态**：定期查看订单页面，了解挂单状态，及时取消不需要的订单。

3. **关注市场波动**：市场剧烈波动时，价格可能在极短时间内达到触发条件，建议密切关注。

4. **注意资金占用**：挂单会占用保证金，如果资金紧张，建议取消不需要的挂单以释放资金。

5. **使用止损止盈**：订单成交后，建议设置止损止盈，控制风险和保护利润。

## 技术实现

### 核心模块

1. **订单监控服务**（`src/lib/order-monitor.ts`）
   - 获取所有 pending 订单
   - 检查价格触发条件
   - 触发订单并创建持仓
   - 取消过期订单

2. **市场数据流集成**（`src/app/api/market/stream/route.ts`）
   - 在每次价格更新时异步触发订单监控
   - 不阻塞数据推送流程

3. **订单管理页面**（`src/app/admin/order-monitor/page.tsx`）
   - 查看监控状态
   - 手动触发监控
   - 查看监控结果和错误

### 数据表

**orders 表**：
```sql
CREATE TABLE orders (
  id VARCHAR(255) PRIMARY KEY,
  user_id INTEGER NOT NULL,
  email VARCHAR(255),
  symbol VARCHAR(50) NOT NULL,
  side VARCHAR(10) NOT NULL,
  order_type VARCHAR(20) NOT NULL,
  quantity NUMERIC(20, 2) NOT NULL,
  price NUMERIC(20, 2) NOT NULL,
  leverage INTEGER,
  status VARCHAR(20) NOT NULL,
  profit NUMERIC(20, 2) DEFAULT 0,
  margin NUMERIC(20, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**positions 表**：
```sql
CREATE TABLE positions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  email VARCHAR(255),
  symbol VARCHAR(50) NOT NULL,
  side VARCHAR(10) NOT NULL,
  quantity NUMERIC(20, 2) NOT NULL,
  open_price NUMERIC(20, 2) NOT NULL,
  current_price NUMERIC(20, 2) NOT NULL,
  leverage INTEGER,
  margin NUMERIC(20, 2) DEFAULT 0,
  profit NUMERIC(20, 2) DEFAULT 0,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 更新日志

- 2026-03-03: 创建挂单交易系统
- 2026-03-03: 集成订单监控到市场数据流
- 2026-03-03: 添加订单过期自动取消功能
