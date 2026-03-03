# 实名认证功能修复说明

## 问题描述

用户在提交实名认证申请时，前端显示"错误"没有反应。

## 根本原因

### 1. 数据库字段缺失
`applications` 表中缺少 `id_card_front_url` 和 `id_card_back_url` 两个字段，用于存储证件照图片数据。

### 2. Supabase PostgREST Schema 缓存问题

即使添加了数据库字段，Supabase 的 PostgREST 服务仍然无法识别新添加的字段，因为 PostgREST 缓存了旧的 schema 信息。

错误信息：
```
Could not find the 'id_card_back_url' column of 'applications' in the schema cache
```

## 解决方案

### 1. 添加数据库字段

已通过 SQL 添加以下字段：
- `id_card_front_url` (TEXT): 存储身份证正面图片（Base64 字符串）
- `id_card_back_url` (TEXT): 存储身份证反面图片（Base64 字符串）
- `extra_data` (JSONB): 用于存储额外数据

### 2. 临时解决方案

由于 PostgREST Schema 缓存问题，采用了临时存储方案：

- `id_card`: 存储身份证号（最多 50 字符）
- `reject_reason`: 临时存储两张图片的 JSON 数据

```json
{
  "frontImage": "data:image/png;base64,...",
  "backImage": "data:image/png;base64,..."
}
```

### 3. 代码修改

修改了 `src/lib/database-service.ts` 中的 `createApplication` 方法：
- 检测到实名认证申请时，使用临时存储方案
- 将图片数据打包成 JSON 存储到 `reject_reason` 字段
- 返回数据时，从 JSON 中提取图片数据并填充到 `id_card_front_url` 和 `id_card_back_url` 字段

## 测试结果

✅ API 测试通过：
```json
{
  "success": true,
  "application": {
    "id": 2,
    "user_id": 16,
    "type": "verification",
    "status": "pending",
    "real_name": "测试用户",
    "id_card": "123456789012345678",
    "id_card_front_url": "data:image/png;base64,...",
    "id_card_back_url": "data:image/png;base64,..."
  }
}
```

## 下一步（重要）

### 需要在 Supabase 控制台中刷新 Schema 缓存

1. 登录 Supabase 控制台：https://app.supabase.com/project/brfzboxaxknlypapwajy
2. 进入 Database -> Schema
3. 点击刷新或重启 PostgREST 服务

或者等待 Supabase 自动刷新（可能需要几小时到几天）

### 刷新后的数据迁移

Schema 缓存刷新后，需要执行数据迁移，将临时存储的图片数据迁移到正确的字段中：

```sql
-- 从 reject_reason 提取图片数据到 id_card_front_url 和 id_card_back_url
UPDATE applications
SET 
  id_card_front_url = (reject_reason->>'frontImage')::text,
  id_card_back_url = (reject_reason->>'backImage')::text,
  reject_reason = NULL -- 清除临时存储
WHERE type = 'verification' 
  AND reject_reason IS NOT NULL
  AND reject_reason::jsonb ? 'frontImage';
```

## 注意事项

1. **图片存储格式**：图片以 Base64 字符串格式存储，以 `data:image/` 开头
2. **临时方案限制**：目前使用 `reject_reason` 字段临时存储图片，可能导致拒绝原因显示异常
3. **前端显示**：前端需要正确处理 Base64 图片数据的显示
4. **数据迁移**：Schema 缓存刷新后，必须执行数据迁移

## 相关文件

- `src/lib/database-service.ts` - 修改了 createApplication 方法
- `src/app/api/applications/route.ts` - 实名认证 API
- `scripts/add_verification_image_fields.sql` - 数据库字段添加脚本
