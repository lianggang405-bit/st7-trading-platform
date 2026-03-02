# Supabase API Key 更新记录

## 最新更新时间
2026-02-27

## 当前配置

### Supabase Project
- **Project URL**: `https://brfzboxaxknlypapwajy.supabase.co`
- **Project ID**: `brfzboxaxknlypapwajy`

### API Keys

#### Publishable Key（可发布密钥）
- **用途**: 前端公共访问，用于客户端浏览器
- **当前密钥**: `sb_publishable_3FOyR_TdA-_zwg4K-8Feqg_Lka84e0o`
- **更新原因**: 解决 Schema 缓存未更新问题

#### Service Role Key（服务密钥）
- **用途**: 服务端特权访问，仅限后端使用
- **当前密钥**: `sb_secret_kn6Xe9tGdwkEChwq9cIaw_5mu2E910`
- **⚠️ 警告**: 严禁泄露，仅用于服务端

### 环境变量配置
```bash
COZE_SUPABASE_URL=https://brfzboxaxknlypapwajy.supabase.co
COZE_SUPABASE_ANON_KEY=sb_publishable_3FOyR_TdA-_zwg4K-8Feqg_Lka84e0o
```

## 更新历史

### 2026-02-27 05:53
- **操作**: 生成新的 Publishable Key
- **原因**: 解决 Schema 缓存问题，表已创建但 REST API 无法识别
- **旧密钥**: `sb_publishable_91cJJdJyy1daYZjeaBxG0g_8K4eHN8a`
- **新密钥**: `sb_publishable_3FOyR_TdA-_zwg4K-8Feqg_Lka84e0o`
- **状态**: ✅ 已更新并重启服务

## 数据库状态

### 已创建的表
1. **trading_pairs** - 交易对表
   - 创建时间: 2026-02-27 05:47
   - 状态: ✅ 已创建

2. **trading_bots** - 交易机器人表
   - 创建时间: 2026-02-27 05:47
   - 状态: ✅ 已创建

### Schema 缓存问题
- **问题**: Supabase REST API schema 缓存未及时更新
- **影响**: 新创建的表无法通过 REST API 访问
- **解决方案**: 生成新的 API Key 强制刷新缓存
- **状态**: ✅ 已解决

## 验证步骤

### 1. 检查数据库连接
```bash
curl http://localhost:5000/api/admin/trading/check-db
```

### 2. 验证表存在性
```bash
# 在 Supabase Studio 中检查
# https://app.supabase.com/project/brfzboxaxknlypapwajy
```

### 3. 检查应用日志
```bash
tail -n 50 /app/work/logs/bypass/app.log
```

## 重要提示

### 密钥安全
- ✅ Publishable Key 可以在浏览器中安全使用
- ⚠️ Service Role Key 必须保密，仅用于服务端
- 🔒 严禁将任何密钥提交到版本控制

### Schema 更新延迟
- Supabase REST API 的 schema 缓存通常有 1-5 分钟延迟
- 生成新密钥可以强制刷新缓存
- 如果遇到表无法识别问题，尝试生成新密钥

### 下次更新密钥时的步骤
1. 访问 Supabase 项目 → Settings → API
2. 点击 "+ 新的可发布密钥"
3. 创建新密钥并复制
4. 更新 `.env.local` 文件
5. 重启服务：`coze dev`

## 相关文档
- [SCHEMA_CACHE_FIX.md](./SCHEMA_CACHE_FIX.md) - Schema 缓存问题详解
- [UPDATE_SUPABASE_CONFIG.md](./UPDATE_SUPABASE_CONFIG.md) - 配置更新指南
- [check-supabase-config.sh](./check-supabase-config.sh) - 配置检查脚本
