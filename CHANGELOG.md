# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
