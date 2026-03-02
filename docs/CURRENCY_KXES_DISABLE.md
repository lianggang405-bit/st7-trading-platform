# Currency Kxes 页面说明

## 页面状态

⚠️ **此功能已禁用，仅用于展示**

## 修改内容

### 1. 移除的功能

- ✗ 删除所有 API 调用（GET、POST、PATCH、DELETE）
- ✗ 移除数据获取逻辑
- ✗ 禁用所有操作按钮
  - 添加配置按钮
  - 编辑按钮
  - 删除按钮
  - 刷新按钮
- ✗ 移除编辑对话框

### 2. 保留的功能

- ✓ 页面展示
- ✓ 静态数据显示（3条示例数据）
- ✓ 客户端搜索过滤
- ✓ 只读表格展示

### 3. 新增功能

- ✓ 功能未启用提示（5秒后自动消失）
- ✓ 所有按钮显示"已禁用"提示
- ✓ 表格标注"（只读）"

## 技术实现

### 静态数据

```typescript
const staticData: CurrencyKxe[] = [
  {
    id: 14,
    name: '以太坊',
    symbol: 'ETH',
    type: 'spot',
    rate: 2285.50,
    minAmount: 0.01,
    maxAmount: 1000,
    status: 'active',
    description: '以太坊现货交易配置'
  },
  {
    id: 12,
    name: '比特币',
    symbol: 'BTC',
    type: 'spot',
    rate: 43250.00,
    minAmount: 0.001,
    maxAmount: 100,
    status: 'active',
    description: '比特币现货交易配置'
  },
  {
    id: 11,
    name: '澳元兑美元',
    symbol: 'AUDUSD',
    type: 'forex',
    rate: 0.6543,
    minAmount: 0.001,
    maxAmount: 999999,
    status: 'active',
    description: '澳元兑美元外汇交易配置'
  },
];
```

### 禁用的操作

```typescript
// 禁用的操作函数
const handleDisabledAction = () => {
  // 不执行任何操作，仅作为占位
  return;
};
```

### 按钮状态

所有按钮都添加了以下属性：
```typescript
<Button
  disabled
  className="bg-slate-700 text-gray-500 cursor-not-allowed"
  title="功能已禁用"
>
```

## 用户提示

页面加载时会显示一个黄色警告框：

```
⚠️ 功能未启用

此功能暂时未启用，页面仅用于展示。所有操作按钮已被禁用，无法添加、编辑或删除数据。
```

5秒后自动消失。

## 访问路径

- 管理端菜单：品种交易 > Currency Kxes
- URL 路径：`/admin/trading/currency`

## 未来开发

如果未来需要启用此功能，请按照以下步骤：

1. **创建数据库表**
   ```sql
   CREATE TABLE currency_kxes (
     id SERIAL PRIMARY KEY,
     name VARCHAR(100) NOT NULL,
     symbol VARCHAR(20) UNIQUE NOT NULL,
     type VARCHAR(20) NOT NULL,
     rate DECIMAL(20, 8) NOT NULL,
     min_amount DECIMAL(20, 8) DEFAULT 0.001,
     max_amount DECIMAL(20, 8) DEFAULT 999999,
     status VARCHAR(20) DEFAULT 'active',
     description TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

2. **创建 API 接口**
   - GET `/api/admin/trading/currency` - 获取列表
   - POST `/api/admin/trading/currency` - 创建配置
   - PATCH `/api/admin/trading/currency/:id` - 更新配置
   - DELETE `/api/admin/trading/currency/:id` - 删除配置

3. **启用页面功能**
   - 移除 `disabled` 属性
   - 恢复 API 调用逻辑
   - 添加表单对话框

## 注意事项

- 此页面目前仅用于展示，不会对数据库进行任何操作
- 避免误操作引起 404 错误
- 页面使用静态数据，与数据库无连接
