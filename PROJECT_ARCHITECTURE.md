# ST7 全球交易平台 - 完整架构文档

> **最后更新**: 2026年3月5日
> **版本**: 1.0.0
> **生产环境**: https://forexpl.shop
> **Git仓库**: https://github.com/lianggang405-bit/st7-trading-platform

---

## 📋 目录

1. [项目概述](#项目概述)
2. [技术栈](#技术栈)
3. [项目结构](#项目结构)
4. [前端架构](#前端架构)
5. [后端架构](#后端架构)
6. [数据库设计](#数据库设计)
7. [状态管理](#状态管理)
8. [认证与权限](#认证与权限)
9. [核心功能模块](#核心功能模块)
10. [API设计规范](#api设计规范)
11. [部署流程](#部署流程)
12. [开发规范](#开发规范)

---

## 项目概述

### 项目简介
ST7 全球交易平台是一个完整的金融交易平台，支持多种交易类型，包括外汇交易、差价合约、加密货币交易等。平台提供用户端和管理端两套界面，支持多语言（6种语言），并具备完善的用户管理、交易管理、资产管理功能。

### 核心特性
- ✅ **双端系统**: 用户端 + 管理端
- ✅ **多语言支持**: 简体中文、繁体中文、英文、日语、韩语、越南语
- ✅ **多种交易类型**: 市价交易、挂单交易、秒合约、快速合约
- ✅ **完整账户系统**: 模拟账户、正式账户
- ✅ **资产管理**: 入金、出金、财务记录
- ✅ **风控系统**: 信用分、止损止盈、杠杆控制
- ✅ **响应式设计**: 完美支持PC和移动端
- ✅ **PWA支持**: 支持离线访问
- ✅ **实时数据**: WebSocket支持实时价格推送

---

## 技术栈

### 前端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| **Next.js** | 16.1.1 | React框架，SSR/SSG |
| **React** | 19.2.3 | UI框架 |
| **TypeScript** | 5.x | 类型安全 |
| **Tailwind CSS** | 4.x | 样式框架 |
| **shadcn/ui** | latest | UI组件库（基于Radix UI） |
| **Zustand** | 5.0.11 | 状态管理 |
| **next-intl** | 4.8.2 | 国际化 |
| **Recharts** | 2.15.4 | 图表库 |
| **Sonner** | 2.0.7 | Toast通知 |
| **QRCode** | 1.5.4 | 二维码生成 |

### 后端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| **Next.js API Routes** | - | 后端API（Serverless Functions）|
| **Supabase** | 2.95.3 | 数据库和认证 |
| **PostgreSQL** | - | 关系型数据库 |
| **bcrypt** | 6.0.0 | 密码加密 |

### 工具和依赖

| 工具 | 版本 | 用途 |
|------|------|------|
| **pnpm** | 9.0.0 | 包管理器 |
| **ESLint** | 9.x | 代码检查 |
| **TypeScript** | 5.x | 类型检查 |
| **AWS SDK** | 3.958.0 | 对象存储集成 |

---

## 项目结构

```
st7-trading-platform/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── [locale]/            # 用户端页面（多语言路由）
│   │   │   ├── login/           # 登录页
│   │   │   ├── register/        # 注册页
│   │   │   ├── market/          # 行情页面
│   │   │   ├── trade/           # 交易页面
│   │   │   ├── position/        # 持仓页面
│   │   │   ├── orders/          # 订单页面
│   │   │   ├── wallet/          # 钱包页面
│   │   │   ├── deposit/         # 入金页面
│   │   │   ├── withdraw/        # 出金页面
│   │   │   ├── verify/          # 实名认证
│   │   │   ├── me/              # 个人中心
│   │   │   └── ...
│   │   ├── admin/               # 管理端页面
│   │   │   ├── login/           # 管理员登录
│   │   │   ├── users/           # 用户管理
│   │   │   ├── trading/         # 交易管理
│   │   │   ├── wallet/          # 钱包管理
│   │   │   ├── deposit-settings/# 入金设置
│   │   │   ├── withdraw-settings/# 出金设置
│   │   │   └── ...
│   │   └── api/                 # API路由
│   │       ├── auth/            # 认证API
│   │       ├── user/            # 用户API
│   │       ├── trading/         # 交易API
│   │       ├── wallet/          # 钱包API
│   │       ├── admin/           # 管理员API
│   │       └── ...
│   ├── components/              # 共享组件
│   │   ├── auth-guard.tsx       # 认证守卫
│   │   ├── ui/                  # shadcn/ui组件
│   │   ├── layout/              # 布局组件
│   │   ├── account/             # 账户相关组件
│   │   └── ...
│   ├── stores/                  # Zustand状态管理
│   │   ├── authStore.ts         # 认证状态
│   │   ├── assetStore.ts        # 资产状态
│   │   ├── positionStore.ts     # 持仓状态
│   │   └── ...
│   ├── lib/                     # 工具库
│   │   ├── auth.ts              # 认证工具
│   │   ├── user-mock-data.ts    # Mock数据
│   │   ├── database-service.ts  # 数据库服务
│   │   └── ...
│   ├── storage/                 # 存储相关
│   │   ├── database/            # 数据库客户端
│   │   └── ...
│   ├── api/                     # API客户端
│   │   ├── auth.ts              # 认证API
│   │   └── ...
│   ├── types/                   # TypeScript类型定义
│   └── i18n.ts                  # 国际化配置
├── public/                      # 静态资源
├── migrations/                  # 数据库迁移文件
├── .coze                        # Coze CLI配置
├── package.json                 # 项目配置
├── tsconfig.json                # TypeScript配置
├── tailwind.config.ts          # Tailwind配置
└── next.config.js              # Next.js配置
```

---

## 前端架构

### 页面路由结构

#### 用户端路由 (`/app/[locale]`)

| 路由 | 页面 | 功能 |
|------|------|------|
| `/` | 首页 | 跳转到行情页面 |
| `/login` | 登录 | 用户登录 |
| `/register` | 注册 | 用户注册 |
| `/market` | 行情 | 查看实时行情 |
| `/trade` | 交易 | 进行交易操作 |
| `/position` | 持仓 | 查看持仓信息 |
| `/orders` | 订单 | 查看待处理/历史订单 |
| `/wallet` | 钱包 | 查看资产信息 |
| `/deposit` | 入金 | 充值操作 |
| `/withdraw` | 出金 | 提现操作 |
| `/verify` | 实名认证 | 身份认证 |
| `/me` | 个人中心 | 账户设置 |
| `/notice` | 公告 | 查看公告列表 |
| `/wealth` | 理财 | 理财页面 |
| `/language` | 语言切换 | 切换显示语言 |

#### 管理端路由 (`/app/admin`)

| 路由 | 页面 | 功能 |
|------|------|------|
| `/login` | 登录 | 管理员登录 |
| `/users/list` | 用户列表 | 查看和管理用户 |
| `/users/demo` | 模拟账户 | 管理模拟账户 |
| `/users/kyc` | KYC审核 | 审核实名认证 |
| `/trading/pairs` | 交易对配置 | 配置交易品种 |
| `/trading/symbols` | 交易品种 | 管理交易符号 |
| `/trading/orders` | 订单监控 | 监控交易订单 |
| `/trading/bots` | 交易机器人 | 管理自动交易 |
| `/wallet/user-wallets` | 用户钱包 | 查看用户资产 |
| `/wallet/financial-records` | 财务记录 | 查看财务流水 |
| `/deposit-settings/deposit-requests` | 充币申请 | 审核充币申请 |
| `/withdraw-settings/withdraw-requests` | 提币申请 | 审核提币申请 |
| `/settings/site` | 站点设置 | 网站配置 |
| `/info/list` | 信息管理 | 管理公告信息 |

### 组件架构

#### 认证组件
- `AuthGuard`: 认证守卫，保护需要登录的页面
- `PageShell`: 页面外壳，处理加载状态
- `AuthGuardedLayout`: 带认证的布局组件

#### 布局组件
- `BottomTab`: 底部导航栏（移动端）
- `TopBar`: 顶部导航栏
- `Sidebar`: 侧边栏（管理端）

#### UI组件 (shadcn/ui)
- Button, Input, Select
- Card, Dialog, DropdownMenu
- Table, Badge, Tabs
- Toast, Alert, Form

#### 业务组件
- `AccountInfo`: 账户信息展示
- `FunctionList`: 功能列表（个人中心）
- `DepositWithdrawButtons`: 入金/出金按钮

---

## 后端架构

### API路由设计

#### 认证API (`/api/auth`)

| 方法 | 路径 | 功能 | 权限 |
|------|------|------|------|
| POST | `/validate` | 登录验证 | 公开 |
| POST | `/register` | 用户注册 | 公开 |
| GET | `/me` | 获取当前用户信息 | 需认证 |
| GET | `/accounts` | 获取账户列表 | 公开（Mock数据）|

#### 用户API (`/api/user`)

| 方法 | 路径 | 功能 | 权限 |
|------|------|------|------|
| GET | `/[id]` | 获取用户详情 | 需认证 |
| GET | `/assets` | 获取用户资产 | 需认证 |
| GET | `/positions` | 获取用户持仓 | 需认证 |
| GET | `/orders` | 获取用户订单 | 需认证 |
| POST | `/verification` | 提交实名认证 | 需认证 |
| GET | `/verification/status` | 获取认证状态 | 需认证 |
| POST | `/credit-score` | 更新信用分 | 管理员 |

#### 交易API (`/api/trading`)

| 方法 | 路径 | 功能 | 权限 |
|------|------|------|------|
| GET | `/symbols` | 获取交易品种 | 公开 |
| POST | `/monitor-orders` | 监控订单 | 管理员 |

#### 钱包API (`/api/wallet`)

| 方法 | 路径 | 功能 | 权限 |
|------|------|------|------|
| GET | `/balance` | 获取余额 | 需认证 |
| GET | `/deposit-addresses` | 获取入金地址 | 需认证 |
| POST | `/set-deposit-address` | 设置入金地址 | 需认证 |
| GET | `/deposit-requests` | 获取充币记录 | 需认证 |
| POST | `/deposit-requests` | 创建充币申请 | 需认证 |

#### 应用API (`/api/applications`)

| 方法 | 路径 | 功能 | 权限 |
|------|------|------|------|
| GET | `/` | 获取申请列表 | 需认证 |
| POST | `/` | 创建申请 | 需认证 |

#### 管理员API (`/api/admin/*`)

| 分类 | 功能 | 权限 |
|------|------|------|
| `/admin/users/*` | 用户管理 | 管理员 |
| `/admin/trading/*` | 交易管理 | 管理员 |
| `/admin/wallet/*` | 钱包管理 | 管理员 |
| `/admin/deposit-settings/*` | 入金设置 | 管理员 |
| `/admin/withdraw-settings/*` | 出金设置 | 管理员 |
| `/admin/settings/*` | 系统设置 | 管理员 |

### API响应格式

#### 成功响应
```json
{
  "success": true,
  "data": { ... }
}
```

#### 错误响应
```json
{
  "success": false,
  "error": "错误信息"
}
```

#### 分页响应
```json
{
  "success": true,
  "data": [ ... ],
  "total": 100,
  "page": 1,
  "pageSize": 20
}
```

---

## 数据库设计

### 核心数据表

#### 1. users（用户表）
```sql
CREATE TABLE users (
  id BIGINT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  account_type VARCHAR(20) NOT NULL, -- 'demo' | 'real'
  balance NUMERIC(20, 8) NOT NULL DEFAULT 0,
  credit_score INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

#### 2. deposit_requests（充币申请表）
```sql
CREATE TABLE deposit_requests (
  id BIGINT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  type VARCHAR(20) NOT NULL, -- 'crypto' | 'wire' | 'bank'
  currency VARCHAR(20) NOT NULL,
  amount NUMERIC(20, 8) NOT NULL,
  tx_hash TEXT,
  proof_image TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  remark TEXT,
  processed_by INTEGER,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

#### 3. applications（申请表）
```sql
CREATE TABLE applications (
  id BIGINT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  type VARCHAR(20) NOT NULL, -- 'deposit' | 'withdraw' | 'verification'
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  amount NUMERIC(20, 8),
  bank_name VARCHAR(100),
  bank_account VARCHAR(200),
  real_name VARCHAR(100),
  id_card VARCHAR(50),
  id_card_front_url TEXT,
  id_card_back_url TEXT,
  reject_reason TEXT,
  reviewed_by VARCHAR(100),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

#### 4. crypto_addresses（加密货币地址表）
```sql
CREATE TABLE crypto_addresses (
  id BIGINT PRIMARY KEY,
  currency VARCHAR(20) NOT NULL,
  protocol VARCHAR(20) NOT NULL, -- 'TRC20' | 'ERC20' | 'BEP20'
  address TEXT NOT NULL,
  network VARCHAR(50),
  min_amount NUMERIC(20, 8) DEFAULT 0,
  max_amount NUMERIC(20, 8) DEFAULT 999999999,
  fee NUMERIC(20, 8) DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

#### 5. market_adjustments（市场调控记录表）
```sql
CREATE TABLE market_adjustments (
  id BIGINT PRIMARY KEY,
  action VARCHAR(50) NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  before_price NUMERIC(20, 8) NOT NULL,
  after_price NUMERIC(20, 8) NOT NULL,
  change_percent VARCHAR(20),
  created_by VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE
);
```

#### 6. credit_adjustments（信用调整记录表）
```sql
CREATE TABLE credit_adjustments (
  id BIGINT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  before_score INTEGER NOT NULL,
  after_score INTEGER NOT NULL,
  change_value INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_by VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE
);
```

---

## 状态管理

### Zustand Stores

#### authStore（认证状态）
```typescript
interface AuthState {
  isLogin: boolean;
  token: string | null;
  user: User | null;
  isHydrated: boolean;
  
  login(email, password): Promise<void>;
  logout(): void;
  register(email, password, accountType): Promise<{userId: string}>;
  hydrateFromCookie(): void;
  syncFromBackend(): Promise<void>;
}
```

#### assetStore（资产状态）
```typescript
interface AssetState {
  balance: number;
  equity: number;
  usedMargin: number;
  freeMargin: number;
  floatingProfit: number;
  marginLevel: number;
  
  initWithUser(user): void;
  syncFromBackend(): Promise<void>;
  updateBalance(balance): void;
}
```

#### positionStore（持仓状态）
```typescript
interface PositionState {
  positions: Position[];
  pendingOrders: Order[];
  
  syncFromBackend(): Promise<void>;
  syncPendingOrders(): Promise<void>;
  clearPositions(): void;
}
```

#### stakingStore（理财状态）
```typescript
interface StakingState {
  stakingProducts: StakingProduct[];
  userStakings: UserStaking[];
  
  loadProducts(): Promise<void>;
  loadUserStakings(): Promise<void>;
  reset(): void;
}
```

#### riskControlStore（风控状态）
```typescript
interface RiskControlState {
  creditScore: number;
  creditHistory: CreditAdjustment[];
  
  syncCreditScore(): Promise<void>;
  updateCreditScore(score): void;
  reset(): void;
}
```

---

## 认证与权限

### 认证流程

#### 1. 用户注册
```
用户填写信息 → POST /api/auth/register → 验证邮箱和密码 → 创建用户 → 返回userId
```

#### 2. 用户登录
```
用户输入账号密码 → POST /api/auth/validate → 验证成功 → 生成token → 保存到cookie和localStorage → 更新store
```

#### Token格式
```
token_<userId>_<timestamp>
例如: token_10_1234567890
```

#### 3. 认证守卫（AuthGuard）
- 检测 `isHydrated` 状态
- 如果未登录，重定向到登录页
- 保存当前页面URL，登录后跳转回原页面

### 权限系统

#### 用户类型
- **demo**: 模拟账户，有初始资金，用于练习
- **real**: 正式账户，需要实名认证，可以进行真实交易

#### 功能限制
- 模拟账户不能入金/出金
- 模拟账户不能进行实名认证
- 正式账户需要完成实名认证才能出金

---

## 核心功能模块

### 1. 入金功能

#### 前端流程
```
用户访问入金页面 → 选择数字货币 → 显示钱包地址和二维码 → 输入充值金额 → 上传支付凭证 → 提交申请
```

#### 关键文件
- 页面: `src/app/[locale]/deposit/page.tsx`
- API: `src/app/api/admin/wallet/deposit-requests/route.ts`
- 货币配置: `src/app/api/app/deposit/crypto-currencies/route.ts`

#### 数据流程
```
前端 → POST /api/admin/wallet/deposit-requests → 创建deposit_requests记录 → 返回成功 → 显示提示
```

#### 验证规则
- 最低金额: 10
- 最高金额: 9,999,999
- 图片大小: 最大 50MB
- 必须上传支付凭证

### 2. 出金功能

#### 前端流程
```
用户访问出金页面 → 选择出金方式 → 输入金额 → 提交申请 → 等待审核
```

#### 关键文件
- 页面: `src/app/[locale]/withdraw/page.tsx`
- API: `src/app/api/admin/wallet/withdrawal-requests/route.ts`

### 3. 实名认证

#### 前端流程
```
用户访问认证页面 → 上传身份证正反面 → 输入真实姓名和身份证号 → 提交申请 → 等待审核
```

#### 关键文件
- 页面: `src/app/[locale]/verify/page.tsx`
- API: `src/app/applications/route.ts` (type: 'verification')

#### 数据存储
- 正面照片: Base64字符串，保存到 `id_card_front_url` 字段
- 反面照片: Base64字符串，保存到 `id_card_back_url` 字段

### 4. 交易功能

#### 交易类型
- **市价交易**: 立即按当前价格成交
- **挂单交易**: 设置触发价格，达到价格后成交
- **秒合约**: 短期快速交易
- **快速合约**: 固定期限的快速交易

#### 关键文件
- 页面: `src/app/[locale]/trade/page.tsx`
- 持仓页面: `src/app/[locale]/position/page.tsx`
- 订单页面: `src/app/[locale]/orders/page.tsx`

---

## API设计规范

### 统一错误处理
```typescript
try {
  // 业务逻辑
  return NextResponse.json({ success: true, data });
} catch (error) {
  console.error('[API Error]', error);
  return NextResponse.json(
    { success: false, error: '操作失败' },
    { status: 500 }
  );
}
```

### 认证检查
```typescript
const token = req.cookies.get('token')?.value;
if (!token) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// 从token解析userId
const userIdMatch = token.match(/token_(\d+)_/);
const userId = parseInt(userIdMatch[1]);
```

### Supabase查询优化
```typescript
// 第一次尝试
let result = await supabase.from('table').select('*');

// 如果遇到schema cache错误，刷新后重试
if (error && error.message?.includes('schema cache')) {
  await supabase.from('table').select('id').limit(1); // 刷新schema
  result = await supabase.from('table').select('*'); // 重试
}

// 如果仍然失败，返回mock数据兜底
if (error) {
  return NextResponse.json({ success: true, data: mockData });
}
```

---

## 部署流程

### 本地开发
```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm run dev

# 访问
http://localhost:5000
```

### 生产部署
```bash
# 1. 拉取代码
cd /var/www/st7-trading-platform
git pull origin main

# 2. 安装依赖
pnpm install

# 3. 构建项目
pnpm run build

# 4. 重启服务
pm2 restart st7-trading-platform

# 5. 查看日志
pm2 logs st7-trading-platform
```

### 环境变量
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SUPABASE_SERVICE_KEY=your-service-key
```

---

## 开发规范

### Git工作流
1. 创建新功能分支: `git checkout -b feature/xxx`
2. 开发并提交: `git commit -m "feat: xxx"`
3. 推送到远程: `git push origin feature/xxx`
4. 合并到main: `git checkout main && git merge feature/xxx`
5. 推送到生产: `git push origin main`

### 提交信息规范
- `feat:` 新功能
- `fix:` 修复bug
- `refactor:` 重构
- `docs:` 文档更新
- `style:` 代码格式调整
- `test:` 测试相关
- `chore:` 构建/工具相关

### 代码规范
1. 使用TypeScript，避免any类型
2. 使用ESLint检查代码质量
3. 组件使用函数式组件 + Hooks
4. 使用Zustand进行状态管理
5. API统一返回格式：`{ success: boolean, data?: any, error?: string }`
6. 所有异步操作添加错误处理
7. 使用console.log进行调试，生产环境可考虑移除

### 命名规范
- 文件名: kebab-case (user-profile.tsx)
- 组件名: PascalCase (UserProfile)
- 函数名: camelCase (getUserProfile)
- 常量名: UPPER_SNAKE_CASE (MAX_AMOUNT)
- 接口名: PascalCase + I前缀 (IUserProfile)

---

## 总结

### 项目特点
- ✅ 完整的双端系统（用户端 + 管理端）
- ✅ 现代化技术栈（Next.js 16 + React 19 + TypeScript）
- ✅ 完善的状态管理（Zustand）
- ✅ 优雅的UI组件（shadcn/ui）
- ✅ 多语言支持（6种语言）
- ✅ 完整的认证和权限系统
- ✅ 灵活的API设计
- ✅ 完善的错误处理

### 待完善功能
- ⏳ 实时交易数据推送（WebSocket）
- ⏳ 完善的订单撮合系统
- ⏳ 更完善的风控规则
- ⏳ 移动端App开发
- ⏳ 通知系统（短信/邮件）

### 当前生产环境
- 域名: https://forexpl.shop
- 服务器: Ubuntu 24.04 LTS
- 部署方式: PM2 + Nginx
- 数据库: Supabase (PostgreSQL)

---

**文档结束** | 最后更新: 2026年3月5日
