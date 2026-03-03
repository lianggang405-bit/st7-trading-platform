# 数据库初始化指南

## 概述

本文档说明如何初始化缺失的数据库表，解决 API 接口使用 mock 数据导致的问题。

## 问题诊断

当 API 接口返回 mock 数据时，通常是因为对应的数据库表不存在。可以通过以下方式诊断：

### 方法 1：使用管理页面（推荐）

1. 访问管理页面：`/admin/database-management`
2. 查看统计数据，了解哪些接口在使用 mock 数据
3. 根据统计结果，点击"初始化缺失的数据库表"按钮

### 方法 2：查看 API 响应

检查 API 响应是否包含 `isMock: true` 字段：
```json
{
  "success": true,
  "data": [...],
  "isMock": true
}
```

### 方法 3：查看日志

查看 `/app/work/logs/bypass/app.log`，搜索 "使用 mock 数据" 关键词。

## 初始化方法

### 方法 1：使用管理页面（推荐）

1. 访问 `/admin/database-management`
2. 点击"初始化缺失的数据库表"按钮
3. 等待初始化完成
4. 刷新页面确认 mock 使用统计是否清零

### 方法 2：使用 API 接口

```bash
curl -X POST http://localhost:5000/api/admin/database/initialize-missing-tables
```

### 方法 3：手动执行 SQL 脚本

1. 登录 Supabase 控制台
2. 进入 SQL Editor
3. 复制 `scripts/init-missing-tables.sql` 的内容
4. 执行 SQL 脚本

## 数据表清单

### 已创建的表

以下表已经通过 `init-db.ts` 脚本创建：

- `users` - 用户表
- `user_assets` - 用户资产表
- `orders` - 订单表
- `positions` - 持仓表
- `trades` - 成交记录表
- `transfers` - 转账记录表
- `staking_records` - 质押记录表
- `staking_configs` - 质押配置表
- `staking_rewards` - 质押收益表

### 可能缺失的表

以下表可能需要手动创建：

- `symbols` - 品种表
- `symbol_types` - 品种类型表
- `trading_hours` - 交易时间表
- `crypto_addresses` - 加密货币地址表
- `deposit_requests` - 充值申请表
- `withdrawal_requests` - 提现申请表
- `flash_contract_orders` - 闪合约订单表
- `demo_flash_contract_orders` - 演示闪合约订单表
- `demo_contract_orders` - 演示合约订单表
- `project_orders` - 项目订单表
- `quick_contract_durations` - 秒合约配置表
- `wire_currency_settings` - 电汇币种设置表

## Mock 使用统计

系统会记录每个接口使用 mock 数据的次数，包括：

- 接口路径
- 使用次数
- 最后使用时间

可以通过以下方式查看：

```bash
curl http://localhost:5000/api/admin/mock-usage
```

## 常见问题

### Q: 为什么会出现 mock 数据？

A: 当数据库表不存在时，API 接口会返回 mock 数据以保证系统不会崩溃。这确保了系统可以运行，但数据不是真实的。

### Q: mock 数据会影响系统功能吗？

A: mock 数据不会导致系统崩溃，但数据不是真实的。建议尽快创建数据库表以使用真实数据。

### Q: 初始化数据库表会删除现有数据吗？

A: 不会。初始化脚本使用 `CREATE TABLE IF NOT EXISTS` 和 `ON CONFLICT DO NOTHING`，只创建不存在的表，不覆盖现有数据。

### Q: 如何确认所有表都已创建？

A: 访问 `/admin/database-management` 页面，如果显示"数据库状态良好"，说明所有表都已创建。

### Q: 可以只创建部分表吗？

A: 可以。修改 SQL 脚本，只保留需要创建的部分即可。

### Q: 创建表后，mock 数据会自动切换到真实数据吗？

A: 是的。表创建成功后，API 接口会自动检测到表存在，并从数据库读取真实数据。

## 验证步骤

初始化完成后，执行以下步骤验证：

1. 访问 `/admin/database-management` 页面
2. 确认显示"数据库状态良好"
3. 访问相关 API 接口，确认返回数据中不包含 `isMock: true`
4. 检查前端页面，确认数据正常显示

## 紧急情况处理

如果初始化失败，按以下步骤处理：

1. 查看 `/app/work/logs/bypass/app.log` 日志
2. 检查 Supabase 数据库连接配置
3. 确认 Supabase 项目状态正常
4. 尝试手动执行 SQL 脚本
5. 如仍有问题，联系技术支持

## 更新日志

- 2025-06-18: 创建数据库初始化指南
- 2025-06-18: 创建 Mock 使用统计功能
- 2025-06-18: 创建管理页面
