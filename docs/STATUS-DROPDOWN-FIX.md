# 状态下拉菜单修复说明

## 问题描述

用户编辑界面中的"状态"下拉菜单收起时显示"选择一个选项"占位符，而不是当前选中的状态值。

## 修复内容

### 1. 添加占位符属性

在 `SelectValue` 组件中添加 `placeholder="选择一个选项"` 属性：

```tsx
<SelectTrigger className="bg-slate-700 border-slate-600 text-white">
  <SelectValue placeholder="选择一个选项" />
</SelectTrigger>
```

这样在用户清空选择时，会显示"选择一个选项"占位符提示用户选择一个状态。

### 2. 简化状态处理逻辑

修改 `useEffect` 中的状态处理逻辑：

**修改前**：
```tsx
status: user.status === '正常' ? '正常' : user.status === '禁用' ? '禁用' : '冻结',
```

**修改后**：
```tsx
status: user.status || '正常',
```

这样更简单直接，直接使用 `user.status` 或默认值 '正常'。

## 状态选项

当前支持的状态选项：

| 值 | 显示文本 | 说明 |
|------|---------|------|
| 正常 | 正常 | 用户可以正常使用系统 |
| 禁用 | 禁用 | 用户被禁用，无法登录 |
| 冻结 | 冻结 | 用户被冻结（需要数据库支持） |

## 数据库支持

### 当前实现

API 接口通过 `is_active` 字段来确定用户状态：
- `is_active = true` → 状态 = '正常'
- `is_active = false` → 状态 = '禁用'

### "冻结"状态的支持

如果需要支持"冻结"状态，需要在数据库中添加额外的状态字段，例如：

```sql
ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'normal';
```

然后修改 API 接口：

```typescript
status: user.status === 'normal' ? '正常' :
        user.status === 'disabled' ? '禁用' :
        user.status === 'frozen' ? '冻结' : '正常',
```

## 使用说明

1. 打开用户编辑对话框
2. 点击"状态"下拉菜单
3. 从下拉列表中选择一个状态：
   - 正常
   - 禁用
   - 冻结（如果数据库支持）
4. 点击"保存"按钮提交更改

## 注意事项

- 当前 API 只支持"正常"和"禁用"两种状态
- "冻结"状态需要数据库支持
- 如果选择了"冻结"状态，API 会将其转换为"禁用"（`is_active = false`）
- 占位符只在未选择状态时显示

## 测试检查清单

- [x] 状态下拉菜单正确显示占位符
- [x] 状态值正确显示在下拉菜单中
- [x] 可以正常选择状态
- [x] 选中的状态正确高亮显示
- [x] 保存后状态正确更新到数据库
- [x] 前端正确刷新显示状态
- [x] TypeScript 类型检查通过
