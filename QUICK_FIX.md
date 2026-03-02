# 快速修复指南

## 问题：Unexpected token '<', "<!DOCTYPE "... is not valid JSON

### ✅ 已修复

这个问题已经解决了！现在API会正确返回JSON格式的错误消息。

### 📋 现在的行为

如果您访问 `/admin/trading/bots` 页面但数据库表还没有创建，您会看到：

1. **页面显示**：
   ```
   暂无交易对数据
   [设置数据库] 按钮
   ```

2. **Toast提示**：
   ```
   数据库表不存在，请先创建
   ```

3. **API返回**：
   ```json
   {
     "success": false,
     "error": "数据库表不存在",
     "needsSetup": true,
     "message": "请访问 /admin/trading/setup 页面创建数据库表"
   }
   ```

### 🔧 解决步骤

1. **点击页面上的"设置数据库"按钮**，或直接访问：
   ```
   http://localhost:5000/admin/trading/setup
   ```

2. **按照页面指引创建数据库表**：
   - 点击"打开 Supabase SQL Editor"
   - 复制 `init-trading-tables.sql` 内容
   - 粘贴到 SQL Editor 中执行
   - 返回页面点击"刷新状态"

3. **访问调控机器人页面**：
   ```
   http://localhost:5000/admin/trading/bots
   ```

### 📚 相关文档

- `DATABASE_SETUP.md` - 详细设置说明
- `/admin/trading/setup` - 设置引导页面
- `init-trading-tables.sql` - SQL脚本

---

## 技术说明

### 修改内容

1. **API改进** (`/api/admin/trading/adjust`)：
   - 在表不存在时返回友好的JSON错误
   - 添加 `needsSetup` 标志
   - 提供清晰的错误消息

2. **前端改进** (`/admin/trading/bots`)：
   - 更好的错误处理
   - 显示"设置数据库"按钮
   - 友好的空状态提示

3. **用户体验**：
   - 不再显示技术错误
   - 提供明确的解决方案
   - 一键跳转到设置页面

---

现在页面应该可以正常工作了！如果还有问题，请访问 `/admin/trading/setup` 页面查看详细指引。
