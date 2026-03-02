# Supabase 云数据库配置清单

生成时间：2025-02-27

---

## ✅ 当前状态检查

### 已存在的表

| 表名 | 记录数 | 状态 |
|------|--------|------|
| `users` | 4 条 | ✅ 存在 |
| `applications` | 0 条 | ✅ 存在 |
| `positions` | 0 条 | ✅ 存在 |
| `orders` | 0 条 | ✅ 存在 |
| `credit_adjustments` | 0 条 | ✅ 存在 |
| `market_adjustments` | 0 条 | ✅ 存在 |
| `trading_pairs` | 0 条 | ✅ 存在 |
| `trading_bots` | 0 条 | ✅ 存在 |

**结论**: ✅ 所有必需表已创建

---

## 📋 需要检查的配置项

### 1. ✅ 表结构 (已完成)

所有表已创建，包括：
- ✅ users 表
- ✅ applications 表
- ✅ positions 表
- ✅ orders 表
- ✅ credit_adjustments 表
- ✅ market_adjustments 表
- ✅ trading_pairs 表
- ✅ trading_bots 表

---

### 2. ⚠️ 索引 (需要验证)

**必需的索引**:

| 表名 | 索引名 | 字段 | 状态 |
|------|--------|------|------|
| `users` | idx_users_email | email | ❓ 需验证 |
| `users` | idx_users_account_type | account_type | ❓ 需验证 |
| `users` | idx_users_created_at | created_at DESC | ❓ 需验证 |
| `applications` | idx_applications_user_id | user_id | ❓ 需验证 |
| `applications` | idx_applications_type | type | ❓ 需验证 |
| `applications` | idx_applications_status | status | ❓ 需验证 |
| `positions` | idx_positions_user_id | user_id | ❓ 需验证 |
| `positions` | idx_positions_symbol | symbol | ❓ 需验证 |
| `positions` | idx_positions_open_time | open_time DESC | ❓ 需验证 |

---

### 3. ⚠️ 触发器 (需要验证)

**自动更新时间的触发器**:

| 表名 | 触发器名 | 状态 |
|------|---------|------|
| `users` | update_users_updated_at | ❓ 需验证 |
| `applications` | update_applications_updated_at | ❓ 需验证 |

**触发器函数**:
- `update_updated_at_column()` - 自动更新 `updated_at` 字段

---

### 4. ⚠️ 外键约束 (需要验证)

**外键关系**:

| 表名 | 外键字段 | 引用表 | 状态 |
|------|---------|--------|------|
| `applications` | user_id | users(id) | ❓ 需验证 |
| `credit_adjustments` | user_id | users(id) | ❓ 需验证 |
| `positions` | user_id | users(id) | ❓ 需验证 |

**约束**: `ON DELETE CASCADE` (级联删除)

---

### 5. ❓ Row Level Security (RLS)

**当前状态**: 默认为禁用

**建议**:
- 对于生产环境，建议**禁用 RLS**（当前配置使用 Service Role Key，不需要 RLS）
- 如果启用 RLS，需要配置 Policy 允许服务端访问

---

### 6. ✅ UUID 扩展

**状态**: 已启用
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

---

## 🚨 必须检查的项目

### ✅ 高优先级（必须检查）

1. **索引是否存在**
   - 影响：查询性能
   - 解决：运行 `init-supabase-tables.sql` 中的 CREATE INDEX 语句

2. **触发器是否存在**
   - 影响：`updated_at` 字段不会自动更新
   - 解决：运行 `init-supabase-tables.sql` 中的 CREATE TRIGGER 语句

3. **外键约束是否存在**
   - 影响：数据完整性
   - 解决：运行 `init-supabase-tables.sql` 中的 REFERENCES 约束

---

### ℹ️ 中优先级（建议检查）

4. **Row Level Security (RLS)**
   - 当前：默认禁用 ✅
   - 建议：保持禁用（使用 Service Role Key 访问）

5. **数据库连接池**
   - Supabase 默认配置已足够
   - 无需额外配置

---

### ⏰ 低优先级（可选）

6. **定时任务**
   - 如需定时更新市场数据
   - 可以使用 Supabase Edge Functions

7. **备份策略**
   - Supabase 自动备份（每日）
   - 无需手动配置

---

## 📝 推荐操作

### 步骤 1: 运行完整的初始化脚本

在 Supabase SQL Editor 中运行：

```sql
-- 复制 init-supabase-tables.sql 的内容
-- 或直接运行文件
```

这会创建：
- ✅ 所有必需的索引
- ✅ 更新时间触发器
- ✅ 外键约束
- ✅ UUID 扩展

---

### 步骤 2: 验证触发器

```sql
-- 检查 users 表的触发器
SELECT
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table = 'users';
```

**期望输出**:
```
trigger_name                | event_manipulation | event_object_table
----------------------------+--------------------+--------------------
update_users_updated_at     | UPDATE             | users
```

---

### 步骤 3: 验证索引

```sql
-- 检查 users 表的索引
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'users'
  AND schemaname = 'public';
```

---

### 步骤 4: 测试触发器

```sql
-- 更新一个用户，检查 updated_at 是否自动更新
UPDATE users
SET username = 'test_update'
WHERE email = 'admin@example.com';

-- 检查 updated_at 是否更新
SELECT email, updated_at
FROM users
WHERE email = 'admin@example.com';
```

---

## ✅ 结论

### 当前状态
- ✅ 所有表已创建
- ✅ 数据已迁移
- ⚠️ 索引、触发器、外键约束需要验证

### 是否需要操作？

**推荐**: ✅ **建议运行一次完整的初始化脚本**

**原因**:
1. 确保索引存在（提升查询性能）
2. 确保触发器存在（自动更新时间）
3. 确保外键约束存在（数据完整性）

**操作时间**: 5 分钟

**操作方式**: 在 Supabase SQL Editor 中运行 `init-supabase-tables.sql`

---

## 🎯 快速检查命令

如果你在 Supabase SQL Editor 中，可以运行以下命令快速检查：

```sql
-- 1. 检查所有表
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. 检查触发器
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public';

-- 3. 检查索引
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

---

## 📞 如果遇到问题

如果运行 `init-supabase-tables.sql` 时遇到错误：

1. **表已存在错误**: 忽略，因为使用 `CREATE TABLE IF NOT EXISTS`
2. **索引已存在错误**: 忽略，因为使用 `CREATE INDEX IF NOT EXISTS`
3. **触发器已存在错误**: 正常，使用 `DROP TRIGGER IF EXISTS` 会先删除

---

## 🎉 总结

**核心答案**: ✅ 表已存在，但**建议运行一次初始化脚本**以确保索引、触发器、外键约束完整。

**风险等级**: 🟡 低风险（即使不运行脚本，应用也能正常工作，只是性能和数据完整性可能受影响）

**建议操作**: ✅ 运行 `init-supabase-tables.sql`（5 分钟）
