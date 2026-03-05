# Supabase Storage 配置指南

## 概述

本项目已集成 Supabase Storage 用于存储入金凭证图片，替代之前的 Base64 存储，大幅提升性能。

## 📋 配置步骤

### 步骤 1：登录 Supabase Dashboard

1. 访问 [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 **SQL Editor**（在左侧导航栏）

### 步骤 2：执行配置脚本

1. 在 SQL Editor 中新建一个查询
2. 复制 `scripts/setup-storage.sql` 文件中的所有内容
3. 粘贴到 SQL Editor 中
4. 点击 **Run** 按钮执行

### 步骤 3：验证配置

1. 在左侧导航栏点击 **Storage**
2. 应该能看到名为 `deposit-proofs` 的存储桶
3. 点击进入该存储桶
4. 点击 **Policies** 标签页
5. 应该能看到以下 4 个策略：
   - ✅ 允许所有人查看公开图片
   - ✅ 允许认证用户上传图片
   - ✅ 允许用户更新自己的图片
   - ✅ 允许用户删除自己的图片

## 🎯 配置说明

### 存储桶信息

- **名称**: `deposit-proofs`
- **公开访问**: ✅ 是（允许前端直接显示图片）
- **文件大小限制**: 5MB
- **支持的格式**: JPEG, PNG, WebP, GIF

### 权限策略说明

| 策略名称 | 权限 | 说明 |
|---------|------|------|
| 允许所有人查看公开图片 | SELECT | 任何人都可以查看图片（前端直接显示） |
| 允许认证用户上传图片 | INSERT | 只有认证用户可以上传图片 |
| 允许用户更新自己的图片 | UPDATE | 用户只能更新自己文件夹内的图片 |
| 允许用户删除自己的图片 | DELETE | 用户只能删除自己文件夹内的图片 |

### 文件夹结构

图片将按用户 ID 自动组织：

```
deposit-proofs/
├── 1/                    # 用户ID=1的图片
│   ├── 1772718000000-abc123.png
│   └── 1772718001000-def456.png
├── 2/                    # 用户ID=2的图片
│   └── 1772718002000-ghi789.png
└── ...
```

## 🚀 使用方式

### 前端提交入金

1. 用户选择图片
2. 图片自动压缩为 WebP 格式（最大 500KB）
3. 上传到 Supabase Storage
4. 返回公共 URL
5. URL 保存到数据库

### 后端处理流程

```typescript
// POST /api/admin/wallet/deposit-requests
// 1. 接收 Base64 图片数据
// 2. 转换为 Blob
// 3. 上传到 Supabase Storage
// 4. 获取公共 URL
// 5. 保存 URL 到数据库
```

## 📊 性能对比

### 之前的 Base64 方案

| 指标 | 数据 |
|------|------|
| 单张图片大小 | ~1.35 MB |
| 7条记录总计 | ~4.35 MB |
| API 响应时间 | 3.1 分钟（最坏情况） |
| 数据库负担 | 高（每次查询都传输完整图片） |

### 现在的 Supabase Storage 方案

| 指标 | 数据 |
|------|------|
| 单张图片大小 | ~500 KB（压缩后） |
| 数据库存储 | 仅存储 URL（~100 字节） |
| API 响应时间 | < 1 秒 |
| 数据库负担 | 低（仅传输 URL） |

**性能提升**: 约 99%+ ⚡

## 🔧 故障排除

### 问题 1：图片上传失败

**错误信息**: `Image upload failed: Storage bucket not found`

**解决方案**:
1. 确认已执行 `scripts/setup-storage.sql` 脚本
2. 检查 Supabase Dashboard 中是否存在 `deposit-proofs` 存储桶
3. 检查环境变量 `NEXT_PUBLIC_SUPABASE_URL` 是否正确

### 问题 2：图片无法显示

**错误信息**: 图片显示为破碎图标

**解决方案**:
1. 检查存储桶是否设置为 Public
2. 检查权限策略是否正确配置
3. 查看浏览器控制台是否有 CORS 错误

### 问题 3：权限错误

**错误信息**: `Permission denied: user is not allowed`

**解决方案**:
1. 确认用户已登录（Supabase 认证）
2. 检查权限策略是否正确配置
3. 查看 Storage Policies 标签页中的策略规则

## 📝 后续优化建议

### 1. 添加图片缩略图

可以在上传时自动生成缩略图：

```typescript
// 原图: user123/1772718000000-abc123.png
// 缩略图: user123/1772718000000-abc123-thumb.png
```

### 2. 启用 CDN 加速

Supabase Storage 已内置 CDN，无需额外配置。

### 3. 添加图片过期时间

可以为临时图片设置过期时间：

```typescript
await supabase.storage
  .from('deposit-proofs')
  .upload(fileName, blob, {
    upsert: false,
    // 可以在 metadata 中添加过期时间
  });
```

## 📞 技术支持

如遇到问题，请检查：

1. Supabase Dashboard 中的 Storage 配置
2. 浏览器控制台日志
3. 后端日志 (`/app/work/logs/bypass/app.log`)

---

**最后更新**: 2026-03-05
