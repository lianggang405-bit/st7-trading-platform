# Trading Platform - 开发规范

## 项目概述

加密货币/贵金属交易平台，基于 Next.js 16 + Supabase，支持实时 K 线图、合约交易、模拟交易等功能。

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Next.js | 16.1.1 | 全栈框架 |
| React | 19.2.3 | UI 框架 |
| TypeScript | 5.9.3 | 类型检查 |
| Supabase | 2.95.3 | 数据库 + 认证 |
| lightweight-charts | 4.x | K 线图组件 |
| shadcn/ui | latest | UI 组件库 |
| Tailwind CSS | 4.1.18 | 样式方案 |
| jose | 6.2.2 | JWT 签名/验签 |

## 环境变量

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# JWT 认证（必须）
JWT_USER_SECRET=xxx      # 用户 JWT 签名密钥（至少 32 字符）
JWT_ADMIN_SECRET=xxx     # 管理员 JWT 签名密钥（至少 32 字符）
```

## 常用命令

```bash
pnpm install        # 安装依赖
pnpm dev            # 开发环境（端口 5000）
pnpm build          # 生产构建
pnpm lint           # ESLint 检查
pnpm ts-check       # TypeScript 检查
pnpm test           # 运行测试
pnpm security-gate  # 安全门禁检查
```

## 认证体系

### 核心文件

- `src/lib/auth-kernel.ts` - JWT 签名/验签核心
- `src/lib/auth-helper.ts` - 用户认证辅助
- `src/lib/admin-auth.ts` - 管理员认证
- `src/lib/admin-guard.ts` - 管理员 API 鉴权守卫

### JWT 函数

```typescript
import { signAccessToken, verifyAccessToken, parseBearerToken } from '@/lib/auth-kernel';

// 生成用户 JWT
const token = await signAccessToken({ sub: userId, role: 'user' }, 'user');

// 验签
const payload = await verifyAccessToken(token, 'user');

// 从请求解析 Bearer token
const token = parseBearerToken(request);
```

### 管理员 API 鉴权

```typescript
import { withAdminAuth } from '@/lib/admin-guard';

// GET 请求
export const GET = withAdminAuth(async (req, admin) => {
  console.log('管理员:', admin.email);
  return NextResponse.json({ ... });
});

// 动态路由
export const GET = withAdminAuth(async (req, admin, context) => {
  const { id } = await context.params;
  return NextResponse.json({ ... });
});
```

### Cookie 安全配置

```typescript
response.cookies.set('admin_token', token, {
  httpOnly: true,        // 防止 XSS
  secure: true,          // 仅 HTTPS
  sameSite: 'strict',    // CSRF 防护
  maxAge: 86400 * 7,    // 7 天
  path: '/',
});
```

## API 路由

### 用户 API

| 路径 | 方法 | 描述 |
|------|------|------|
| `/api/auth/register` | POST | 用户注册 |
| `/api/auth/validate` | POST | 验证用户 |
| `/api/user/balance` | GET | 获取余额 |
| `/api/user/positions` | GET | 获取持仓 |
| `/api/wallet/deposit-addresses` | GET | 充值地址 |

### 管理员 API

| 路径 | 方法 | 描述 | 鉴权 |
|------|------|------|------|
| `/api/admin/login` | POST | 管理员登录 | 无 |
| `/api/admin/users/list` | GET | 用户列表 | 需要 |
| `/api/admin/trading/pairs` | GET | 交易对管理 | 需要 |

### 调试/初始化 API

| 路径 | 方法 | 描述 | 保护 |
|------|------|------|------|
| `/api/admin/debug/*` | * | 调试接口 | 仅开发环境 |
| `/api/admin/database/*` | * | 数据库初始化 | 仅沙箱环境 |

## 数据源

### 实时价格

- **Binance WebSocket**: 加密货币（BTC, ETH 等）
- **GoldAPI.io**: 现货黄金（XAUUSD）
- **模拟数据**: 贵金属、外汇（无真实数据源）

### 数据库

使用 Supabase PostgreSQL，主要表：

- `users` - 用户表
- `applications` - KYC 申请表
- `positions` - 持仓表
- `orders` - 订单表
- `credit_adjustments` - 积分调整记录
- `market_adjustments` - 市场调控记录
- `admin_users` - 管理员账号表

## 开发注意事项

1. **JWT 密钥**: 必须配置 `JWT_USER_SECRET` 和 `JWT_ADMIN_SECRET`
2. **管理员账号**: 必须通过数据库 `admin_users` 表管理，移除环境变量回退
3. **调试接口**: 生产环境自动禁用
4. **Cookie**: 始终使用 httpOnly + secure + sameSite 配置
5. **错误处理**: 使用统一的 `errors` 辅助函数，避免 mock-success 回退

## 统一错误响应

使用 `src/lib/api-response.ts` 中的统一错误处理：

```typescript
import { errors } from '@/lib/api-response';

// 401 未认证
return errors.unauthorized('需要登录');

// 403 无权限
return errors.forbidden('需要管理员权限');

// 400 参数错误
return errors.missingParam('symbol');
return errors.invalidParam('orderType', '无效的订单类型');

// 422 业务错误
return errors.insufficientBalance(available, required);
return errors.orderNotFound(orderId);

// 500/503 服务错误
return errors.internalError('服务器错误');
return errors.serviceUnavailable('数据库');
```

## 数据仓储层

使用 `src/lib/repository.ts` 中的统一数据访问：

```typescript
import { userRepository, orderRepository, isDatabaseAvailable } from '@/lib/repository';

// 检查数据库可用性
const dbAvailable = await isDatabaseAvailable();

// 查询用户
const user = await userRepository.findById(userId, { allowFallback: false });

// 查询订单
const orders = await orderRepository.findByUserId(userId);
```

## 测试与安全门禁

### 安全回归测试

```bash
# 运行安全回归测试
pnpm test

# 测试文件位置
__tests__/security-regression.test.ts
```

覆盖场景：
1. 管理员登录成功/失败
2. 过期 token 拒绝
3. role 越权拒绝
4. JWT 防伪造（篡改 payload、伪造 token）
5. Cookie 安全配置验证

### 密钥轮换演练

```bash
# 运行密钥轮换验证
npx tsx scripts/key-rotation-test.ts
```

验证行为：
- 旧密钥签发的 token 在轮换后失效
- 新密钥可以正常签发和验签

### 发布门禁

```bash
# 运行完整安全门禁检查
pnpm security-gate
```

检查项：
1. JWT 环境变量已配置且长度 >= 32
2. admin/user 密钥已分离
3. 无默认凭据残留
4. TypeScript 编译通过
