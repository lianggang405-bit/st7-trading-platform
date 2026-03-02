# SQL 错误修复指南

## 错误信息

```
ERROR: 42601: syntax error at or near "NOT"
LINE 36: ALTER TABLE orders ADD CONSTRAINT IF NOT EXISTS fk_orders_user_id ^
```

## 问题原因

PostgreSQL 的 `ALTER TABLE ADD CONSTRAINT` 语法**不支持** `IF NOT EXISTS` 子句。

这是 PostgreSQL 的语法限制，不支持在添加约束时使用条件判断。

## 解决方案

使用 `DO` 块进行条件判断，检查约束是否已存在。

### 修复前的代码（错误）

```sql
ALTER TABLE orders ADD CONSTRAINT IF NOT EXISTS fk_orders_user_id 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
```

### 修复后的代码（正确）

```sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_orders_user_id'
  ) THEN
    ALTER TABLE orders ADD CONSTRAINT fk_orders_user_id 
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END
$$;
```

## 完整的修复步骤

### 选项 1: 使用修复后的 SQL 脚本

1. 打开文件：`/workspace/projects/scripts/create_orders_table.sql`
2. 复制整个文件内容
3. 粘贴到 Supabase SQL Editor
4. 点击 "Run" 执行

### 选项 2: 直接执行修复 SQL

如果你已经执行过部分 SQL（表已创建但约束未创建），只执行以下部分：

```sql
-- 创建外键约束（使用条件判断）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_orders_user_id'
  ) THEN
    ALTER TABLE orders ADD CONSTRAINT fk_orders_user_id 
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END
$$;
```

### 选项 3: 使用 API 创建

调用以下 API 端点（已修复语法）：

```bash
curl -X POST http://localhost:5000/api/admin/trading/init-orders-sql
```

## 验证修复成功

### 方法 1: 检查约束是否存在

在 Supabase SQL Editor 中执行：

```sql
SELECT
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conname = 'fk_orders_user_id';
```

应该看到：
```
constraint_name    | constraint_definition
-------------------|------------------------
fk_orders_user_id  | FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
```

### 方法 2: 检查表结构

```sql
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;
```

### 方法 3: 使用 API 检查

```bash
curl http://localhost:5000/api/admin/trading/orders-status
```

应该看到：
```json
{
  "success": true,
  "exists": true,
  "message": "orders 表已存在",
  "tableInfo": {
    "name": "orders",
    "columnCount": 18,
    "columns": [...]
  }
}
```

## 其他相关语法限制

PostgreSQL 中不支持 `IF NOT EXISTS` 的语法：

| 语法 | 是否支持 | 替代方案 |
|------|---------|---------|
| `CREATE TABLE ... IF NOT EXISTS` | ✅ 支持 | 直接使用 |
| `CREATE INDEX ... IF NOT EXISTS` | ✅ 支持 | 直接使用 |
| `CREATE VIEW ... IF NOT EXISTS` | ✅ 支持 | 直接使用 |
| `ALTER TABLE ADD CONSTRAINT ... IF NOT EXISTS` | ❌ 不支持 | 使用 `DO` 块 |
| `ALTER TABLE DROP CONSTRAINT ... IF EXISTS` | ✅ 支持 | 直接使用 |
| `CREATE TRIGGER ... IF NOT EXISTS` | ❌ 不支持 | 使用 `DROP TRIGGER IF EXISTS` 先删除 |

## 常见问题

### Q: 为什么 PostgreSQL 不支持这个语法？

A: 这是 PostgreSQL 的设计决策，因为约束的名称是唯一的，如果约束已存在，通常会返回错误。需要开发者明确处理这种情况。

### Q: 如果约束已存在，这个修复代码会报错吗？

A: 不会。`DO` 块会先检查约束是否存在，只有在不存在时才会创建。

### Q: 可以直接使用 `ALTER TABLE ... ADD CONSTRAINT` 而不检查吗？

A: 可以，但如果约束已存在，会报错。在生产环境中，建议使用条件判断。

### Q: 这个修复会影响性能吗？

A: 影响极小。`pg_constraint` 表通常很小，查询速度很快。

## 技术细节

### pg_constraint 表结构

- `conname`: 约束名称
- `conrelid`: 关联表的对象 ID
- `contype`: 约束类型 (c = CHECK, f = FOREIGN KEY, p = PRIMARY KEY, u = UNIQUE)
- `confrelid`: 外键引用的表的对象 ID

### 约束类型

- `c`: CHECK 约束
- `f`: FOREIGN KEY 约束
- `p`: PRIMARY KEY 约束
- `u`: UNIQUE 约束

### 外键约束的特殊性

外键约束涉及到两个表，因此在创建时需要：
1. 引用的表（`users`）必须存在
2. 引用的列（`id`）必须存在
3. 引用的列必须是主键或唯一键

## 相关文档

- [PostgreSQL 约束文档](https://www.postgresql.org/docs/current/ddl-constraints.html)
- [PostgreSQL DO 语句文档](https://www.postgresql.org/docs/current/sql-do.html)
- [Orders 表创建指南](./CREATE_ORDERS_TABLE.md)
- [快速启动指南](./QUICK_START.md)

---

**修复完成时间**: 2026-03-02
**修复状态**: ✅ 已完成
**影响文件**:
- `/workspace/projects/scripts/create_orders_table.sql`
- `/workspace/projects/src/app/api/admin/trading/init-orders/route.ts`
- `/workspace/projects/src/app/api/admin/trading/init-orders-sql/route.ts`
- `/workspace/projects/docs/CREATE_ORDERS_TABLE.md`
- `/workspace/projects/docs/QUICK_START.md`
