# Orders 表状态更新

## 2026-03-02 更新

### ✅ 确认：Orders 表已创建成功

通过 Supabase SQL Editor 确认，`orders` 表已成功创建。

### 当前状态

**表存在性：** ✅ 已创建
**字段数量：** 13 个（期望 18 个）
**数据完整性：** ⚠️ 不完整

### 已创建的字段（13个）

| 字段名 | 数据类型 | 是否可为空 | 备注 |
|--------|----------|-----------|------|
| id | character varying | NO | ⚠️ 应为 SERIAL |
| user_id | integer | NO | ✅ 正常 |
| email | character varying | YES | ✅ 正常 |
| symbol | character varying | NO | ✅ 正常 |
| side | character varying | NO | ✅ 正常 |
| order_type | character varying | NO | ✅ 正常 |
| quantity | numeric | NO | ✅ 正常 |
| price | numeric | NO | ✅ 正常 |
| leverage | integer | YES | ✅ 正常 |
| status | character varying | NO | ✅ 正常 |
| profit | numeric | YES | ✅ 正常 |
| margin | numeric | YES | ✅ 正常 |
| created_at | timestamp with time zone | NO | ✅ 正常 |

### 缺少的字段（5个）

| 字段名 | 数据类型 | 用途 |
|--------|----------|------|
| stop_loss_price | DECIMAL(20, 8) | 止损价格 |
| take_profit_price | DECIMAL(20, 8) | 止盈价格 |
| close_price | DECIMAL(20, 8) | 平仓价格 |
| closed_at | TIMESTAMP WITH TIME ZONE | 平仓时间 |
| updated_at | TIMESTAMP WITH TIME ZONE | 更新时间 |

### 需要修正的字段

| 字段名 | 当前类型 | 期望类型 | 影响 |
|--------|---------|---------|------|
| id | character varying | SERIAL | 主键应该自增 |

### 修复方案

#### 方案 1：添加缺少的字段（推荐，保留数据）

```sql
-- 添加缺少的字段
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stop_loss_price DECIMAL(20, 8);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS take_profit_price DECIMAL(20, 8);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS close_price DECIMAL(20, 8);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 创建触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 创建触发器
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 验证表结构
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;
```

#### 方案 2：重新创建表（完整结构，会丢失数据）

```sql
-- 删除表
DROP TABLE IF EXISTS orders CASCADE;

-- 重新执行完整创建脚本
-- 使用 /workspace/projects/scripts/create_orders_table.sql 中的 SQL
```

### 关于 API 查询不到表的问题

**可能原因：**

1. **Schema 缓存问题**
   - Supabase REST API 可能缓存了旧的 schema
   - 需要等待缓存刷新或使用客户端直接查询

2. **权限问题**
   - API 使用的 anon key 可能权限不足
   - 建议使用 service role key 或直接在服务端查询

3. **项目实例不一致**
   - SQL Editor 可能连接的是开发环境
   - API 连接的是生产环境

**临时解决方案：**

应用代码使用 Supabase 客户端直接查询，应该能够访问到表。可以暂时绕过 API 缓存问题。

### 下一步行动

1. ✅ 确认 orders 表存在
2. ⏸️ 添加缺少的字段
3. ⏸️ 修正 id 字段类型
4. ⏸️ 测试交易功能
5. ⏸️ 解决 API 缓存问题

### 技术说明

**为什么 id 是 character varying？**

可能是以下原因之一：
1. SQL 脚本部分执行失败
2. 手动创建表时使用了错误的类型
3. 表迁移脚本有问题

**影响：**
- 需要在应用代码中手动生成 ID
- 建议修正为 SERIAL 以便自动递增

### 相关文档

- [完整 SQL 脚本](./../scripts/create_orders_table.sql)
- [创建指南](./CREATE_ORDERS_TABLE.md)
- [错误修复指南](./SQL_ERROR_FIX.md)

---

**更新时间：** 2026-03-02
**更新者：** AI
**状态：** 待修复
