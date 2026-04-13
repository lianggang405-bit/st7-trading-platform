# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2026-04-14

### Bug Fix - Production Hotfix

#### next-intl 兼容性问题
- **问题**: `next-intl@3.26.1` 与 Next.js 16.1.1 不兼容
- **症状**: `Couldn't find next-intl config file` 错误导致 500
- **修复**:
  - 降级到 `next-intl@4.8.2`
  - 创建 `src/i18n/request.ts` 作为配置入口
  - 更新 `next.config.ts` 插件路径指向 `./src/i18n/request.ts`

#### PM2 端口冲突
- **问题**: 多进程并发导致 `EADDRINUSE: address already in use :::5000`
- **症状**: 服务启动失败，502 Bad Gateway
- **修复**: 清理旧进程，单实例运行

#### 翻译键缺失
- **问题**: `zh-TW.json` 缺少 `auth.login` 和 `auth.or`
- **症状**: 页面渲染时 `MISSING_MESSAGE` 警告
- **修复**: 补全缺失翻译键

### 运维 SOP

```
# 遇到 502 先查 EADDRINUSE
ss -ltnp | grep :5000
pm2 list

# 遇到 digest:2421684278 查 pm2 error.log
pm2 logs st7-trading-platform --lines 50 --nostream
```

---

## [1.0.0-security-hardening] - 2026-02-24

### Security Hardening - P0

This is the initial security-hardened release of the Trading Platform.

#### Added
- **JWT Authentication**: 
  - `auth-kernel.ts` with HMAC-SHA256 signed tokens
  - Separate `JWT_USER_SECRET` and `JWT_ADMIN_SECRET`
  - Token expiration and role-based access control

- **Cookie Security**:
  - `httpOnly`, `secure`, `sameSite: 'strict'` for admin sessions
  - Protection against XSS and CSRF attacks

- **Admin Guard**:
  - `withAdminAuth()` wrapper for all admin API routes
  - Database-only admin authentication (no default credentials)

- **Debug API Protection**:
  - `assertDevOnly()` for `/api/admin/debug/*` routes
  - `assertDevAndTrusted()` for `/api/admin/database/*` routes
  - Production environment protection

#### Changed
- **Authentication Flow**:
  - Removed `X-Auth-Token` header fallback
  - Unified to Bearer token + Cookie authentication
  - Real error responses instead of mock-success fallbacks

- **Error Handling**:
  - Standardized error codes (401/403/400/422/404/500/503)
  - `api-response.ts` with structured error responses
  - Request ID tracking for log correlation

#### Security Fixes
- Removed default admin credentials (`admin@example.com` / `admin123`)
- Removed Base64 token fallback (anti-forgery)
- Removed runtime table creation APIs (migration-based)

### Business Reliability - P1

#### Added
- **Repository Layer**: `repository.ts`
  - `userRepository`, `orderRepository`, `positionRepository`
  - Centralized data access with fallback control
  - `isDatabaseAvailable()` health check

- **Business Regression Tests**: `__tests__/business-regression.test.ts`
  - 17 tests covering failure scenarios
  - Database unavailability handling
  - Authentication failures
  - Balance insufficient checks
  - Parameter validation

- **Security Regression Tests**: `__tests__/security-regression.test.ts`
  - 11 tests covering JWT security
  - Token expiration
  - Role escalation prevention
  - JWT signature forgery prevention

#### Changed
- All API routes now return real errors instead of mock-success
- `auth/validate` no longer falls back to mock data
- `admin/contract/orders/[id]` properly returns 404/503

### Stability & Maintainability - P2

#### Added
- **KYC File Storage**: `file-storage.ts`
  - S3-compatible object storage
  - Base64 images uploaded to storage, DB stores keys
  - `uploadBase64Image()`, `generateFileUrl()`, `deleteFile()`

- **Market Engine Lifecycle**: `market-data-engine.ts`
  - `start()` / `stop()` / `restart()` lifecycle management
  - `addSymbol()` / `removeSymbol()` dynamic subscriptions
  - `getHealthReport()` health checks
  - Automatic reconnection with exponential backoff

- **Database Migrations**: `supabase/migrations/`
  - Versioned SQL migrations
  - `scripts/run-migrations.ts` migration runner
  - Migration state tracking

- **Observability**: `observability.ts`
  - Request ID correlation
  - Structured JSON logging (production)
  - Alert thresholds: 5% error rate, 10x 5xx, 3x 503

#### Added Scripts
- `scripts/security-gate.sh` - Pre-release security gate
- `scripts/key-rotation-test.ts` - JWT key rotation validation
- `scripts/failure-drill.ts` - Failure scenario testing
- `scripts/add-admin-auth.ts` - Batch admin auth migration

### Documentation

#### Added
- `AGENTS.md` - Developer specification
- `docs/OPERATIONS.md` - Operations runbook

### Environment Variables

#### Required
```bash
JWT_USER_SECRET=<min 32 chars>
JWT_ADMIN_SECRET=<min 32 chars>
```

#### Removed
- `ADMIN_EMAIL` (admin now in database)
- `ADMIN_PASSWORD` (password now in database)

---

## [0.1.0] - Previous Version

- Initial release with basic trading functionality
- KYC application handling (base64 in DB)
- Admin panel with mock data fallbacks

---

## Upgrade Notes (升级说明)

### Breaking Changes (破坏性变更)

| Item | Old Behavior | New Behavior | Action Required |
|------|-------------|--------------|-----------------|
| **User Tokens** | Legacy tokens accepted | All tokens must be HS256 JWT | Users must re-login |
| **Admin Credentials** | Env variables fallback | Database-only auth | Create admin in `admin_users` table |
| **Debug APIs** | Open in all envs | Dev-only with auth | Remove or protect production endpoints |
| **Error Responses** | Mixed formats | Standard `{success, error}` | Update frontend error handling |
| **KYC Images** | Base64 in DB | Object storage keys | Migration handles legacy data |

### Migration Steps (迁移步骤)

```bash
# 1. Backup current environment
cp .env.local .env.local.backup

# 2. Generate new JWT secrets
openssl rand -base64 32  # For JWT_USER_SECRET
openssl rand -base64 32  # For JWT_ADMIN_SECRET

# 3. Run database migrations
npx tsx scripts/run-migrations.ts

# 4. Create admin user (if needed)
# See docs/OPERATIONS.md for SQL example

# 5. Verify security gate
pnpm security-gate

# 6. Notify users to re-login
```

### Rollback (回滚)

> ⚠️ 回滚到此版本将丢失安全加固，不建议在生产环境使用。

```bash
# Emergency rollback (if needed)
cp .env.local.backup .env.local
git checkout v0.1.0
pnpm install && pnpm build
```

### Known Issues (已知问题)

1. **GoldAPI 403**: Free tier rate limits may cause 403 errors. System auto-falls back to mock data.
2. **WebSocket in Sandbox**: External WebSocket connections blocked in sandbox env. Falls back to mock data.
3. **First Login Required**: All existing users must re-authenticate after upgrade.
