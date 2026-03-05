# 审核功能问题修复说明

## 问题描述

用户反馈：
1. 管理端充币申请中同意按钮点击后有弹窗确认
2. 但列表状态没有更改
3. 前端入金记录中的状态也没有更改

## 问题原因分析

### 主要问题

经过排查，发现了以下问题：

1. **`processed_by` 字段类型错误**
   - 数据库中 `processed_by` 字段是 `integer` 类型
   - 前端传递的是字符串 `"admin"`
   - API 尝试将字符串插入整数字段，导致更新失败
   - 错误信息：`invalid input syntax for type integer: "admin"`

2. **查询逻辑问题**
   - 审核API最初使用 `.single()` 方法查询记录
   - 如果记录不存在或查询失败，会抛出异常
   - 改为 `.maybeSingle()` 方法更安全

### 次要问题

1. **查询方式优化**
   - 原本使用 `.eq('id', requestId).single()` 查询
   - 改为查询所有记录后在内存中筛选（便于调试）
   - 可以根据需要改回直接查询

## 修复内容

### 1. 修复 API 层

#### 审核通过 API (`src/app/api/admin/wallet/deposit-requests/[id]/approve/route.ts`)

```typescript
// 修改前
const { processedBy = 'admin' } = body;

// 修改后
const { processedBy = 1 } = body; // 默认使用管理员 user_id = 1
```

#### 审核拒绝 API (`src/app/api/admin/wallet/deposit-requests/[id]/reject/route.ts`)

```typescript
// 修改前
const { processedBy = 'admin', remark } = body;

// 修改后
const { processedBy = 1, remark } = body; // 默认使用管理员 user_id = 1
```

### 2. 修复前端层

#### 列表页 (`src/app/admin/deposit-settings/deposit-requests/page.tsx`)

```typescript
// 修改前
body: JSON.stringify({ processedBy: 'admin' }),

// 修改后
body: JSON.stringify({ processedBy: 1 }), // 使用管理员 user_id = 1
```

## 数据库表结构

### `deposit_requests` 表

```sql
CREATE TABLE deposit_requests (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  type VARCHAR NOT NULL,
  currency VARCHAR NOT NULL,
  amount NUMERIC NOT NULL,
  tx_hash VARCHAR,
  status VARCHAR NOT NULL,
  remark TEXT,
  processed_by INTEGER,  -- 注意：这里是整数类型
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  proof_image TEXT
);
```

## 测试步骤

### 1. 测试审核通过

```bash
curl -X POST -H 'Content-Type: application/json' \
  -d '{"processedBy":1}' \
  http://localhost:5000/api/admin/wallet/deposit-requests/8/approve
```

**预期响应**：
```json
{
  "success": true,
  "request": {
    "id": 8,
    "status": "approved",
    "processed_by": 1,
    "processed_at": "2026-03-05T15:49:29.396+00:00"
  },
  "usdAmount": 400,
  "newBalance": 400
}
```

### 2. 测试审核拒绝

```bash
curl -X POST -H 'Content-Type: application/json' \
  -d '{"processedBy":1,"remark":"测试拒绝"}' \
  http://localhost:5000/api/admin/wallet/deposit-requests/8/reject
```

**预期响应**：
```json
{
  "success": true,
  "request": {
    "id": 8,
    "status": "rejected",
    "processed_by": 1,
    "processed_at": "2026-03-05T15:49:29.396+00:00",
    "remark": "测试拒绝"
  }
}
```

### 3. 前端测试

1. 访问管理端"充币申请"页面
2. 找到一个待审核的申请
3. 点击"同意"按钮
4. 确认弹窗
5. 检查列表状态是否更新为"已充值"
6. 检查用户端入金记录状态是否更新

## 注意事项

### 1. 管理员 user_id

当前代码中硬编码了管理员 user_id = 1。在实际生产环境中，应该：
- 从 session 或 token 中获取真实的管理员 user_id
- 或者在环境变量中配置管理员 user_id

### 2. 状态映射

前端显示的状态需要正确映射：
- `pending` → "申请中"
- `approved` → "已充值"
- `rejected` → "已拒绝"

### 3. 钱包余额更新

审核通过后，系统会：
1. 更新 `deposit_requests` 表状态为 `approved`
2. 更新 `user_wallets` 表的 `balance` 和 `total_deposit`
3. 如果用户没有 formal 账户，会自动创建

## 后续优化建议

1. **管理员认证**
   - 添加管理员登录认证
   - 从 session 中获取管理员 user_id
   - 添加操作日志记录

2. **状态同步**
   - 确保前端和后端状态映射一致
   - 添加实时状态更新（WebSocket 或 SSE）

3. **错误处理**
   - 添加更详细的错误信息
   - 优化用户提示

4. **性能优化**
   - 添加缓存机制
   - 优化数据库查询

---

**修复日期**: 2026-03-05
**修复人**: AI Assistant
