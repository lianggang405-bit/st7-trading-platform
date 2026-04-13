# Trading Platform - 运维手册

## 目录
1. [快速启动](#快速启动)
2. [环境变量配置](#环境变量配置)
3. [密钥轮换](#密钥轮换)
4. [数据库迁移](#数据库迁移)
5. [管理员管理](#管理员管理)
6. [监控与告警](#监控与告警)
7. [故障处理](#故障处理)

---

## 快速启动

```bash
# 安装依赖
pnpm install

# 开发环境
pnpm dev

# 生产构建
pnpm build
pnpm start

# 发布前检查
pnpm test                    # 运行测试
pnpm ts-check               # TypeScript 检查
pnpm security-gate          # 安全门禁
```

---

## 环境变量配置

### 必需变量

```bash
# Supabase 数据库
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# JWT 认证密钥（至少 32 字符）
JWT_USER_SECRET=<生成方式: openssl rand -base64 32>
JWT_ADMIN_SECRET=<生成方式: openssl rand -base64 32>
```

### 可选变量

```bash
# 对象存储
COZE_BUCKET_ENDPOINT_URL=https://xxx.r2.cloudflarestorage.com
COZE_BUCKET_NAME=trading-platform

# Redis（可选，默认使用内存缓存）
REDIS_URL=redis://localhost:6379

# GoldAPI（贵金属价格）
GOLDAPI_KEY=your-goldapi-key
```

---

## 密钥轮换

### JWT 密钥轮换步骤

#### 1. 备份当前密钥

```bash
# 记录当前密钥（仅用于紧急回滚）
cp .env.local .env.local.backup
```

#### 2. 生成新密钥

```bash
# 用户密钥
openssl rand -base64 32

# 管理员密钥
openssl rand -base64 32
```

#### 3. 部署新密钥

```bash
# 更新环境变量
export JWT_USER_SECRET=<新用户密钥>
export JWT_ADMIN_SECRET=<新管理员密钥>

# 重启服务
pm2 restart trading-platform
```

#### 4. 验证轮换

```bash
# 运行密钥轮换演练测试
npx tsx scripts/key-rotation-test.ts
```

#### 5. 通知用户重新登录

> ⚠️ 注意：旧密钥签发的 token 在轮换后立即失效，所有用户需要重新登录。

### 回滚步骤

```bash
# 如果轮换失败，紧急回滚
cp .env.local.backup .env.local
pm2 restart trading-platform
```

---

## 数据库迁移

### 运行迁移

```bash
# 运行所有待应用迁移
npx tsx scripts/run-migrations.ts

# 运行到指定版本
npx tsx scripts/run-migrations.ts --to=001
```

### 迁移状态

迁移状态存储在 `.migrations/applied.json`

### 回滚迁移

> ⚠️ 当前不支持自动回滚，需要手动执行 SQL 回滚。

```sql
-- 示例：回滚到版本 001
DROP TABLE IF EXISTS users;
-- 重新运行 001_initial_schema.sql
```

---

## 管理员管理

### 创建管理员账号

通过数据库直接创建：

```sql
-- 1. 生成密码哈希（使用 bcrypt）
-- Node.js 示例：
const bcrypt = require('bcrypt');
const hash = await bcrypt.hash('YourSecurePassword', 12);
console.log(hash);

-- 2. 插入数据库
INSERT INTO admin_users (email, username, password_hash)
VALUES ('admin@example.com', 'Admin', '$2b$12$...');
```

### 删除管理员

```sql
DELETE FROM admin_users WHERE email = 'admin@example.com';
```

### 列出所有管理员

```sql
SELECT id, email, username, created_at FROM admin_users;
```

---

## 监控与告警

### 告警阈值

| 告警级别 | 触发条件 | 处理建议 |
|---------|---------|---------|
| WARN | 错误率 > 5% | 检查日志，关注趋势 |
| ERROR | 5xx 错误 ≥ 10 次 | 检查服务状态 |
| FATAL | 503 错误 ≥ 3 次 | 紧急处理，可能服务不可用 |

### 日志位置

- 应用日志: `/app/work/logs/bypass/app.log`
- 控制台日志: `/app/work/logs/bypass/console.log`
- 开发日志: `/app/work/logs/bypass/dev.log`

### 查看告警状态

```bash
# 通过 API 获取当前告警状态
curl http://localhost:5000/api/monitoring/log
```

### 健康检查

```bash
# 检查服务健康状态
curl http://localhost:5000/api/debug/info-all
```

---

## 故障处理

### 常见故障

#### 1. 数据库连接失败 (503)

**症状**: API 返回 503 Service Unavailable

**排查步骤**:
```bash
# 1. 检查 Supabase 状态
curl -I https://xxx.supabase.co

# 2. 检查环境变量
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# 3. 检查数据库表
psql $DATABASE_URL -c "\dt"
```

**处理方案**:
1. 确认 Supabase 服务状态
2. 更新环境变量
3. 重启服务

#### 2. JWT 验证失败

**症状**: 登录后仍然返回 401

**排查步骤**:
```bash
# 1. 检查 JWT 环境变量
echo $JWT_USER_SECRET
echo $JWT_ADMIN_SECRET

# 2. 验证密钥长度
echo ${#JWT_USER_SECRET}  # 应 >= 32
```

**处理方案**:
1. 确认密钥配置正确
2. 确认密钥 >= 32 字符
3. 清除浏览器 Cookie 后重新登录

#### 3. GoldAPI 403 错误

**症状**: 黄金价格显示异常

**排查步骤**:
```bash
# 测试 GoldAPI
curl -H "x-access-token: $GOLDAPI_KEY" https://www.goldapi.io/api/XAU/USD
```

**处理方案**:
1. 检查 API Key 是否有效
2. 检查 API 调用频率限制
3. 系统会自动降级到模拟数据

#### 4. WebSocket 连接失败

**症状**: 行情数据不更新

**排查步骤**:
```bash
# 1. 检查 Binance 连接
curl http://localhost:5000/api/market/data

# 2. 查看重连日志
grep "reconnect" /app/work/logs/bypass/app.log
```

**处理方案**:
1. 系统会自动进行 5 次重连（指数退避）
2. 重连失败后自动降级到模拟数据
3. 确认沙箱网络策略

### 紧急联系

- 开发团队: [联系邮箱]
- 值班人员: [联系电话]

---

## 版本信息

当前版本: **v1.0.0-security-hardening**

创建日期: 2026-02-24

变更记录:
- P0 安全整改: JWT 认证、Cookie 安全、调试接口封禁
- P1 业务可信度: 错误处理、仓储层、回归测试
- P2 稳定性: KYC 存储、行情服务、数据库迁移、可观测性
