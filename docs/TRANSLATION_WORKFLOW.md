# 翻译开发流程指南 (Translation Workflow Guide)

本文档详细说明了从开发新功能到完成多语言翻译的完整工作流程。

## 目录

- [开发前准备](#开发前准备)
- [新功能开发流程](#新功能开发流程)
- [翻译文件修改流程](#翻译文件修改流程)
- [测试流程](#测试流程)
- [代码审查流程](#代码审查流程)
- [问题排查](#问题排查)
- [最佳实践](#最佳实践)

---

## 开发前准备

### 1. 环境检查

在开始开发前，确保以下环境已配置正确：

```bash
# 检查项目是否正常启动
npm run dev

# 检查翻译文件是否存在
ls -la src/messages/

# 应该包含以下文件：
# zh-TW.json, en.json, th.json, vi.json, ru.json, de.json
```

### 2. 熟悉现有翻译

在添加新翻译前，先熟悉现有的翻译结构：

```bash
# 查看中文翻译文件
cat src/messages/zh-TW.json

# 了解模块划分和命名规范
```

### 3. 查看术语库

使用术语库保持翻译一致性：

```bash
# 查看术语库文档
cat docs/TERMINOLOGY.md
```

---

## 新功能开发流程

### 流程概览

```
┌─────────────┐
│ 开始开发    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 步骤1:      │
│ 添加翻译键  │ (zh-TW.json)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 步骤2:      │
│ 翻译其他语言│ (5种语言)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 步骤3:      │
│ 开发组件    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 步骤4:      │
│ 使用翻译    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 步骤5:      │
│ 测试验证    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 完成        │
└─────────────┘
```

### 详细步骤

#### 步骤 1: 添加翻译键到中文文件

**文件位置**: `src/messages/zh-TW.json`

**操作示例**:

假设我们要开发一个"修改密码"功能，需要添加以下翻译：

```json
{
  "changePassword": {
    "title": "修改密码",
    "oldPassword": "旧密码",
    "oldPasswordPlaceholder": "请输入旧密码",
    "newPassword": "新密码",
    "newPasswordPlaceholder": "请输入新密码",
    "confirmNewPassword": "确认新密码",
    "confirmNewPasswordPlaceholder": "请再次输入新密码",
    "submit": "提交",
    "success": "密码修改成功",
    "error": {
      "oldPasswordIncorrect": "旧密码错误",
      "newPasswordSame": "新密码不能与旧密码相同",
      "passwordsMismatch": "两次输入的密码不一致"
    }
  }
}
```

**注意事项**:
- 使用嵌套结构组织翻译
- 翻译键使用小驼峰命名
- 保持缩进一致（2空格）
- 错误信息放在 `error` 对象中

#### 步骤 2: 翻译其他5种语言

为每种语言添加对应的翻译：

**英语** (`src/messages/en.json`):

```json
{
  "changePassword": {
    "title": "Change Password",
    "oldPassword": "Old Password",
    "oldPasswordPlaceholder": "Enter your old password",
    "newPassword": "New Password",
    "newPasswordPlaceholder": "Enter your new password",
    "confirmNewPassword": "Confirm New Password",
    "confirmNewPasswordPlaceholder": "Re-enter your new password",
    "submit": "Submit",
    "success": "Password changed successfully",
    "error": {
      "oldPasswordIncorrect": "Old password is incorrect",
      "newPasswordSame": "New password cannot be the same as old password",
      "passwordsMismatch": "Passwords do not match"
    }
  }
}
```

**泰语** (`src/messages/th.json`):

```json
{
  "changePassword": {
    "title": "เปลี่ยนรหัสผ่าน",
    "oldPassword": "รหัสผ่านเดิม",
    "oldPasswordPlaceholder": "กรอกรหัสผ่านเดิม",
    "newPassword": "รหัสผ่านใหม่",
    "newPasswordPlaceholder": "กรอกรหัสผ่านใหม่",
    "confirmNewPassword": "ยืนยันรหัสผ่านใหม่",
    "confirmNewPasswordPlaceholder": "กรอกรหัสผ่านใหม่อีกครั้ง",
    "submit": "ส่ง",
    "success": "เปลี่ยนรหัสผ่านสำเร็จ",
    "error": {
      "oldPasswordIncorrect": "รหัสผ่านเดิมไม่ถูกต้อง",
      "newPasswordSame": "รหัสผ่านใหม่ต้องไม่เหมือนรหัสผ่านเดิม",
      "passwordsMismatch": "รหัสผ่านไม่ตรงกัน"
    }
  }
}
```

**越南语** (`src/messages/vi.json`):

```json
{
  "changePassword": {
    "title": "Thay đổi mật khẩu",
    "oldPassword": "Mật khẩu cũ",
    "oldPasswordPlaceholder": "Nhập mật khẩu cũ của bạn",
    "newPassword": "Mật khẩu mới",
    "newPasswordPlaceholder": "Nhập mật khẩu mới",
    "confirmNewPassword": "Xác nhận mật khẩu mới",
    "confirmNewPasswordPlaceholder": "Nhập lại mật khẩu mới",
    "submit": "Gửi",
    "success": "Đổi mật khẩu thành công",
    "error": {
      "oldPasswordIncorrect": "Mật khẩu cũ không đúng",
      "newPasswordSame": "Mật khẩu mới không được trùng với mật khẩu cũ",
      "passwordsMismatch": "Mật khẩu không khớp"
    }
  }
}
```

**俄语** (`src/messages/ru.json`):

```json
{
  "changePassword": {
    "title": "Изменить пароль",
    "oldPassword": "Старый пароль",
    "oldPasswordPlaceholder": "Введите ваш старый пароль",
    "newPassword": "Новый пароль",
    "newPasswordPlaceholder": "Введите ваш новый пароль",
    "confirmNewPassword": "Подтвердите новый пароль",
    "confirmNewPasswordPlaceholder": "Введите новый пароль еще раз",
    "submit": "Отправить",
    "success": "Пароль успешно изменен",
    "error": {
      "oldPasswordIncorrect": "Старый пароль неверный",
      "newPasswordSame": "Новый пароль не должен совпадать со старым",
      "passwordsMismatch": "Пароли не совпадают"
    }
  }
}
```

**德语** (`src/messages/de.json`):

```json
{
  "changePassword": {
    "title": "Passwort ändern",
    "oldPassword": "Altes Passwort",
    "oldPasswordPlaceholder": "Geben Sie Ihr altes Passwort ein",
    "newPassword": "Neues Passwort",
    "newPasswordPlaceholder": "Geben Sie Ihr neues Passwort ein",
    "confirmNewPassword": "Neues Passwort bestätigen",
    "confirmNewPasswordPlaceholder": "Geben Sie Ihr neues Passwort erneut ein",
    "submit": "Absenden",
    "success": "Passwort erfolgreich geändert",
    "error": {
      "oldPasswordIncorrect": "Altes Passwort ist falsch",
      "newPasswordSame": "Neues Passwort darf nicht mit dem alten übereinstimmen",
      "passwordsMismatch": "Passwörter stimmen nicht überein"
    }
  }
}
```

**翻译注意事项**:
- 使用术语库保持一致性
- 注意不同语言的表达习惯
- 避免直译，确保自然流畅
- 检查专业术语是否准确

#### 步骤 3: 开发组件

创建页面组件，使用 `useTranslations` 钩子：

```tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ChangePasswordPage() {
  const t = useTranslations('changePassword');
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 验证逻辑
      if (formData.newPassword !== formData.confirmNewPassword) {
        toast.error(t('error.passwordsMismatch'));
        return;
      }

      if (formData.newPassword === formData.oldPassword) {
        toast.error(t('error.newPasswordSame'));
        return;
      }

      // API 调用
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldPassword: formData.oldPassword,
          newPassword: formData.newPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(t('success'));
        // 清空表单
        setFormData({
          oldPassword: '',
          newPassword: '',
          confirmNewPassword: ''
        });
      } else {
        toast.error(data.error || t('error.oldPasswordIncorrect'));
      }
    } catch (error) {
      toast.error(t('error.oldPasswordIncorrect'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="oldPassword">{t('oldPassword')}</Label>
              <Input
                id="oldPassword"
                type="password"
                placeholder={t('oldPasswordPlaceholder')}
                value={formData.oldPassword}
                onChange={(e) => setFormData({ ...formData, oldPassword: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">{t('newPassword')}</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder={t('newPasswordPlaceholder')}
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmNewPassword">{t('confirmNewPassword')}</Label>
              <Input
                id="confirmNewPassword"
                type="password"
                placeholder={t('confirmNewPasswordPlaceholder')}
                value={formData.confirmNewPassword}
                onChange={(e) => setFormData({ ...formData, confirmNewPassword: e.target.value })}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('loading') : t('submit')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

**开发注意事项**:
- 所有文本必须使用翻译键
- Toast 消息必须使用翻译
- Placeholder 文本必须使用翻译
- 不要硬编码任何文本

#### 步骤 4: 使用翻译

确保所有UI元素都使用翻译：

```tsx
// ✅ 正确：使用翻译
<h1>{t('title')}</h1>
<input placeholder={t('oldPasswordPlaceholder')} />
<button>{t('submit')}</button>

// ❌ 错误：硬编码文本
<h1>修改密码</h1>
<input placeholder="请输入旧密码" />
<button>提交</button>
```

#### 步骤 5: 测试验证

测试所有语言版本：

```bash
# 1. 启动开发服务器
npm run dev

# 2. 在浏览器中测试
# http://localhost:5000/zh-TW/  (繁体中文)
# http://localhost:5000/en/     (英语)
# http://localhost:5000/th/     (泰语)
# http://localhost:5000/vi/     (越南语)
# http://localhost:5000/ru/     (俄语)
# http://localhost:5000/de/     (德语)
```

**测试检查项**:
- [ ] 所有文本都正确显示
- [ ] 没有遗漏的翻译键
- [ ] 文本长度合适，不会溢出
- [ ] 语言切换功能正常
- [ ] 错误信息正确显示

---

## 翻译文件修改流程

### 修改现有翻译

1. **定位翻译键**: 在翻译文件中找到要修改的键
2. **修改所有语言**: 必须同时修改所有6种语言的翻译
3. **验证影响范围**: 检查哪些页面使用了此翻译
4. **测试验证**: 在所有语言下测试修改后的效果

**示例**:

```bash
# 1. 搜索使用某个翻译键的位置
grep -r "t('button.login')" src/

# 2. 修改翻译文件
vim src/messages/zh-TW.json
vim src/messages/en.json
# ... 其他语言

# 3. 测试验证
npm run dev
```

### 删除翻译键

1. **检查使用情况**: 确认翻译键是否还在使用
2. **从所有文件删除**: 从6个翻译文件中都删除该键
3. **检查组件代码**: 确保没有组件还在使用该翻译

**示例**:

```bash
# 1. 检查使用情况
grep -r "t('old.key')" src/

# 2. 如果没有使用，删除翻译键
vim src/messages/zh-TW.json
vim src/messages/en.json
# ... 其他语言
```

---

## 测试流程

### 自动化测试

#### 检查翻译完整性

```bash
# 检查所有翻译文件的键是否一致
node scripts/check-translations.js
```

#### 检查 JSON 格式

```bash
# 验证 JSON 格式是否正确
for file in src/messages/*.json; do
  echo "Checking $file..."
  jq empty "$file" || echo "Error in $file"
done
```

### 手动测试

#### 测试清单

- [ ] **视觉测试**: 检查所有语言的UI是否正常
- [ ] **功能测试**: 测试所有功能在所有语言下是否正常
- [ ] **溢出测试**: 检查长文本是否溢出
- [ ] **切换测试**: 测试语言切换是否流畅
- [ ] **错误测试**: 测试错误信息是否正确显示

#### 测试语言顺序

建议按以下顺序测试：
1. 繁体中文 (默认)
2. 英语
3. 泰语
4. 越南语
5. 俄语
6. 德语

---

## 代码审查流程

### 提交前检查

使用以下检查清单：

```bash
# 1. 检查翻译文件格式
jq empty src/messages/*.json

# 2. 检查是否有硬编码文本
grep -r "[\u4e00-\u9fa5]" src/app/ --include="*.tsx" --include="*.ts"
# 输出应该为空（除了注释）

# 3. 检查是否使用了 useTranslations
grep -r "useTranslations" src/app/ --include="*.tsx" --include="*.ts"
```

### PR 审查要点

审查PR时，重点关注以下内容：

1. **翻译完整性**
   - [ ] 新增的翻译键是否在所有6种语言中都有？
   - [ ] 翻译键命名是否符合规范？
   - [ ] 翻译内容是否准确？

2. **代码质量**
   - [ ] 是否有硬编码的文本？
   - [ ] Toast 消息是否使用翻译？
   - [ ] Placeholder 文本是否使用翻译？

3. **功能完整性**
   - [ ] 语言切换功能是否正常？
   - [ ] 所有语言的UI是否正常？

---

## 问题排查

### 常见问题

#### 1. 翻译键未显示

**症状**: 页面显示 `missing.key` 或类似内容

**排查步骤**:
```bash
# 1. 检查翻译键是否存在
grep '"your.key"' src/messages/zh-TW.json

# 2. 检查组件是否正确使用
grep "t('your.key')" src/components/YourComponent.tsx

# 3. 检查浏览器控制台是否有错误
```

**解决方案**:
- 确保翻译键存在于所有语言文件中
- 检查翻译键的拼写是否正确
- 确认组件正确使用 `useTranslations()`

#### 2. 语言切换不生效

**症状**: 切换语言后页面内容没有改变

**排查步骤**:
```bash
# 1. 检查路由配置
cat src/middleware.ts

# 2. 检查语言配置
cat src/i18n.ts

# 3. 检查语言选择器组件
cat src/components/LanguageSwitcher.tsx
```

**解决方案**:
- 确认 `middleware.ts` 正确配置
- 检查 `i18n.ts` 中的语言列表
- 验证语言选择器的实现

#### 3. JSON 格式错误

**症状**: 页面无法加载，显示 JSON 解析错误

**排查步骤**:
```bash
# 1. 验证 JSON 格式
jq . src/messages/zh-TW.json

# 2. 查看具体错误
jq . src/messages/zh-TW.json 2>&1
```

**解决方案**:
- 修复 JSON 语法错误
- 检查是否有遗漏的逗号或引号
- 确保使用正确的 JSON 格式

---

## 最佳实践

### 1. 翻译键命名

✅ **推荐**:
- 使用小驼峰命名: `confirmNewPassword`
- 按模块组织: `auth.emailLogin`
- 语义清晰: `passwordTooShort`

❌ **避免**:
- 使用蛇形命名: `confirm_new_password`
- 过长的键名: `pleaseEnterYourNewPasswordAgain`
- 重复键名: `common.confirm` 和 `auth.confirm`

### 2. 翻译内容

✅ **推荐**:
- 简洁明了: "登录"
- 一致性: 统一使用"提交"而不是"发送"
- 符合习惯: 德语名词首字母大写

❌ **避免**:
- 过于冗长: "请点击此按钮以登录系统"
- 不一致: 有时用"保存"，有时用"提交"
- 直译: 英语直接翻译成其他语言

### 3. 组件开发

✅ **推荐**:
```tsx
const t = useTranslations('module');
return <div>{t('key')}</div>;
```

❌ **避免**:
```tsx
// 硬编码文本
return <div>硬编码文本</div>;

// 错误使用
const t = useTranslations();
return <div>{t('module.key')}</div>;
```

### 4. 错误处理

✅ **推荐**:
```tsx
try {
  // ...
} catch (error) {
  toast.error(t('error.networkError'));
}
```

❌ **避免**:
```tsx
try {
  // ...
} catch (error) {
  toast.error('网络错误'); // 硬编码
}
```

---

## 版本历史

| 版本 | 日期 | 修改内容 | 作者 |
|------|------|----------|------|
| 1.0 | 2026-03-02 | 初始版本 | Team |

---

## 联系方式

如有流程相关的问题或建议，请联系开发团队。
