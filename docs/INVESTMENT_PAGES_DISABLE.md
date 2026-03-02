# 理财页面说明

## 页面状态

⚠️ **此功能已禁用，仅用于展示**

## 包含的页面

1. **理财项目页面** (`/admin/trading/investment`)
2. **理财订单页面** (`/admin/trading/investment-orders`)

## 修改内容

### 1. 理财项目页面 (`/admin/trading/investment`)

#### 移除的功能
- ✗ 删除所有 API 调用（GET、POST、PATCH、DELETE）
- ✗ 移除数据获取逻辑
- ✗ 禁用所有操作按钮
  - 创建项目按钮
  - 编辑按钮
  - 删除按钮
  - 筛选按钮
  - 复选框选择
  - 分页按钮

#### 保留的功能
- ✓ 页面展示
- ✓ 静态数据显示（3条示例数据）
- ✓ 客户端搜索过滤
- ✓ 客户端排序
- ✓ 只读表格展示

#### 静态数据
```typescript
const staticData: InvestmentProject[] = [
  {
    id: 1,
    name: 'ETH 质押 30天',
    icon: 'ETH',
    rate: 5.5,
    quantity: 100,
    minStaking: 100,
    maxStaking: 100000,
    defaultStaking: 1000,
    lockDays: 30,
  },
  {
    id: 2,
    name: 'BTC 定存 90天',
    icon: 'BTC',
    rate: 6.8,
    quantity: 50,
    minStaking: 500,
    maxStaking: 500000,
    defaultStaking: 5000,
    lockDays: 90,
  },
  {
    id: 3,
    name: 'USDT 灵活收益',
    icon: 'USDT',
    rate: 3.2,
    quantity: 1000,
    minStaking: 100,
    maxStaking: 1000000,
    defaultStaking: 10000,
    lockDays: 7,
  },
];
```

### 2. 理财订单页面 (`/admin/trading/investment-orders`)

#### 新增功能
- ✓ 创建理财订单页面
- ✓ 展示用户的理财订单记录

#### 移除的功能
- ✗ 所有操作按钮
  - 创建订单按钮
  - 编辑按钮
  - 删除按钮
  - 筛选按钮
  - 复选框选择
  - 分页按钮

#### 保留的功能
- ✓ 页面展示
- ✓ 静态数据显示（3条示例数据）
- ✓ 客户端搜索过滤
- ✓ 客户端排序
- ✓ 只读表格展示

#### 静态数据
```typescript
const staticData: InvestmentOrder[] = [
  {
    id: 1001,
    userId: 1,
    userEmail: 'user@example.com',
    projectId: 1,
    projectName: 'ETH 质押 30天',
    amount: 10000,
    rate: 5.5,
    expectedProfit: 458.33,
    actualProfit: 0,
    lockDays: 30,
    startDate: '2024/01/15 10:30:00',
    endDate: '2024/02/14 10:30:00',
    status: 'completed',
  },
  {
    id: 1002,
    userId: 2,
    userEmail: 'demo@example.com',
    projectId: 2,
    projectName: 'BTC 定存 90天',
    amount: 50000,
    rate: 6.8,
    expectedProfit: 8356.16,
    actualProfit: 0,
    lockDays: 90,
    startDate: '2024/02/01 08:15:00',
    endDate: '2024/05/01 08:15:00',
    status: 'active',
  },
  {
    id: 1003,
    userId: 1,
    userEmail: 'user@example.com',
    projectId: 1,
    projectName: 'ETH 质押 30天',
    amount: 25000,
    rate: 5.5,
    expectedProfit: 1145.83,
    actualProfit: 0,
    lockDays: 30,
    startDate: '2024/02/10 14:20:00',
    endDate: '2024/03/11 14:20:00',
    status: 'active',
  },
];
```

## 数据结构

### 理财项目 (InvestmentProject)
```typescript
interface InvestmentProject {
  id: number;
  name: string;         // 项目名称
  icon: string;         // 图标
  rate: number;         // 年化收益率（%）
  quantity: number;     // 可用数量
  minStaking: number;   // 最小质押金额
  maxStaking: number;   // 最大质押金额
  defaultStaking: number; // 默认质押金额
  lockDays: number;     // 锁仓天数
}
```

### 理财订单 (InvestmentOrder)
```typescript
interface InvestmentOrder {
  id: number;
  userId: number;
  userEmail: string;
  projectId: number;
  projectName: string;
  amount: number;        // 质押金额
  rate: number;          // 年化收益率（%）
  expectedProfit: number; // 预期收益
  actualProfit: number;   // 实际收益
  lockDays: number;      // 锁仓天数
  startDate: string;     // 开始时间
  endDate: string;       // 结束时间
  status: 'active' | 'completed' | 'cancelled';
}
```

## 订单状态

| 状态 | 说明 | 图标 |
|------|------|------|
| active | 进行中 | Clock |
| completed | 已完成 | CheckCircle |
| cancelled | 已取消 | XCircle |

## 用户提示

页面加载时会显示一个黄色警告框：

```
⚠️ 功能未启用

此功能暂时未启用，页面仅用于展示。所有操作按钮已被禁用，无法添加、编辑或删除数据。
```

5秒后自动消失。

## 访问路径

### 理财项目
- 管理端菜单：品种交易 > 理财项目
- URL 路径：`/admin/trading/investment`

### 理财订单
- 管理端菜单：品种交易 > 理财订单
- URL 路径：`/admin/trading/investment-orders`

## 未来开发

如果未来需要启用此功能，请按照以下步骤：

### 1. 创建数据库表

```sql
-- 理财项目表
CREATE TABLE investment_projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(20) NOT NULL,
  rate DECIMAL(5, 2) NOT NULL,
  quantity DECIMAL(20, 8) DEFAULT 0,
  min_staking DECIMAL(20, 8) DEFAULT 0,
  max_staking DECIMAL(20, 8) DEFAULT 999999999,
  default_staking DECIMAL(20, 8) DEFAULT 0,
  lock_days INTEGER NOT NULL,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 理财订单表
CREATE TABLE investment_orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id INTEGER NOT NULL REFERENCES investment_projects(id),
  amount DECIMAL(20, 8) NOT NULL,
  rate DECIMAL(5, 2) NOT NULL,
  expected_profit DECIMAL(20, 8) NOT NULL,
  actual_profit DECIMAL(20, 8) DEFAULT 0,
  lock_days INTEGER NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. 创建 API 接口

#### 理财项目 API
- GET `/api/admin/trading/investment` - 获取项目列表
- POST `/api/admin/trading/investment` - 创建项目
- PATCH `/api/admin/trading/investment/:id` - 更新项目
- DELETE `/api/admin/trading/investment/:id` - 删除项目

#### 理财订单 API
- GET `/api/admin/trading/investment-orders` - 获取订单列表
- GET `/api/admin/trading/investment-orders/:id` - 获取订单详情
- PATCH `/api/admin/trading/investment-orders/:id` - 更新订单
- DELETE `/api/admin/trading/investment-orders/:id` - 取消订单

### 3. 启用页面功能
- 移除 `disabled` 属性
- 恢复 API 调用逻辑
- 添加表单对话框
- 实现分页功能

## 注意事项

- 此页面目前仅用于展示，不会对数据库进行任何操作
- 避免误操作引起 404 错误
- 页面使用静态数据，与数据库无连接
- 搜索和排序仅在前端进行，不影响数据
