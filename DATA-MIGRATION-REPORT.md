# 数据迁移与检查报告

生成时间：2025-02-27

---

## 📊 数据检查结果

### Supabase 数据库状态

| 表名 | 记录数 | 状态 |
|------|--------|------|
| `users` | 4 条 | ✅ 有数据 |
| `applications` | 0 条 | ✅ 空表（正常） |
| `positions` | 0 条 | ✅ 空表（正常） |
| `credit_adjustments` | 0 条 | ✅ 空表（正常） |
| `market_adjustments` | 0 条 | ✅ 空表（正常） |
| `orders` | 0 条 | ✅ 空表（正常） |

### 用户数据详情

| ID | 邮箱 | 账户类型 | 余额 | 信用分 | 状态 |
|----|------|---------|------|--------|------|
| 1 | admin@example.com | real | 300 | 100 | 已验证 |
| 2 | test@example.com | demo | 100,000 | 100 | 未验证 |
| 3 | newuser@example.com | demo | 100,000 | 100 | 未验证 |
| 600151 | 123@123.com | demo | 100,000 | 100 | 未验证 |

---

## 📁 项目数据源分析

### 1. 文件系统数据（已迁移 ✅）

**位置**: `/workspace/projects/data/demo-accounts.json`

**原始数据**:
```json
[
  {
    "id": "600151",
    "email": "123@123.com",
    "password": "12345678",
    "status": "normal",
    "createdAt": "2026-02-24T20:05:10.151Z",
    "balance": 100000,
    "accountType": "demo"
  }
]
```

**迁移结果**: ✅ 已成功迁移到 Supabase `users` 表

---

### 2. Mock 数据（仅参考，无需迁移 ❌）

#### mock-data.ts (localStorage)
**位置**: `/workspace/projects/src/lib/mock-data.ts`

**包含数据**:
- 3 个模拟用户（demo@example.com, demo2@example.com, real@example.com）
- 3 个模拟申请记录（存款、取款、KYC）

**状态**: ❌ 无需迁移（仅为模拟数据，用于 localStorage）

#### mock-data-service.ts (内存)
**位置**: `/workspace/projects/src/lib/mock-data-service.ts`

**包含数据**:
- 3 个模拟用户
- 3 个模拟申请记录

**状态**: ❌ 无需迁移（服务端内存数据，重启后丢失）

#### user-mock-data.ts (localStorage)
**位置**: `/workspace/projects/src/lib/user-mock-data.ts`

**包含数据**:
- 用户 ID 分配（从 600151 开始）
- 用户管理功能

**状态**: ❌ 无需迁移（前端 localStorage）

#### market-mock-data.ts (硬编码)
**位置**: `/workspace/projects/src/lib/market-mock-data.ts`

**包含数据**:
- 31 个交易对（Forex, Gold, Crypto, Energy, Indices）

**状态**: ❌ 无需迁移（静态市场数据，硬编码在代码中）

---

## 🔄 数据迁移记录

### 迁移 API
**端点**: `POST /api/admin/migrate`

**迁移结果**:
```
✅ 迁移成功: 1 条记录
❌ 迁移失败: 0 条记录
```

**详情**:
| 邮箱 | 结果 | 用户 ID |
|------|------|---------|
| 123@123.com | ✅ 成功 | 600151 |

---

## 🎯 数据完整性检查

### ✅ 已完成

1. **文件系统数据迁移**: `data/demo-accounts.json` → Supabase `users` 表
2. **密码加密**: 所有密码已使用 bcrypt 加密
3. **数据映射**: 状态、类型等字段已正确映射

### ⚠️ 注意事项

1. **Mock 数据**: 项目中的 mock 数据文件（localStorage、内存）未迁移，因为这些数据仅用于开发和测试，不是真实用户数据
2. **市场数据**: `market-mock-data.ts` 中的交易对数据是硬编码的，无需存储到数据库
3. **空表**: `applications`、`positions`、`credit_adjustments`、`market_adjustments` 等表为空是正常的，因为用户尚未产生相应业务数据

---

## 📝 数据存储架构总结

```
┌─────────────────────────────────────────────────────────────┐
│                    数据存储架构                               │
└─────────────────────────────────────────────────────────────┘

数据源                          存储位置
─────────────────────────────────────────────────────────────
真实用户数据                     Supabase (PostgreSQL 云数据库)
  - 用户信息                      ✅ users 表
  - 申请记录                      ✅ applications 表
  - 持仓信息                      ✅ positions 表
  - 信用调整                      ✅ credit_adjustments 表
  - 市场调控                      ✅ market_adjustments 表

模拟数据（开发/测试）             localStorage / 内存
  - mock-data.ts                 ❌ 前端 localStorage
  - mock-data-service.ts         ❌ 服务端内存
  - user-mock-data.ts            ❌ 前端 localStorage

静态市场数据                     代码硬编码
  - market-mock-data.ts          ❌ 无需存储

历史文件系统数据                 Supabase (已迁移)
  - demo-accounts.json           ✅ 已迁移到 users 表
```

---

## ✅ 结论

**数据完整性**: ✅ 所有真实数据已完整迁移到 Supabase

**数据一致性**: ✅ Supabase 作为唯一数据源，前后端数据统一

**数据安全性**: ✅ 密码已加密，敏感数据已保护

**下一步操作**:
1. ✅ 无需进一步迁移
2. ✅ 可以删除文件系统数据 `data/demo-accounts.json`
3. ✅ Mock 数据文件保留用于开发测试
