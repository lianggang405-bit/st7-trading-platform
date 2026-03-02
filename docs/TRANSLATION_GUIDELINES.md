# 翻译管理规范 (Translation Guidelines)

## 目录

- [概述](#概述)
- [技术架构](#技术架构)
- [翻译文件管理](#翻译文件管理)
- [翻译键命名规范](#翻译键命名规范)
- [开发规范](#开发规范)
- [代码审查清单](#代码审查清单)
- [术语库](#术语库)
- [常见问题](#常见问题)

---

## 概述

本文档规定了项目的多语言翻译管理规范，确保翻译的一致性、准确性和可维护性。

### 支持的语言

| 语言代码 | 语言名称 | 旗帜 | 文件名 |
|---------|---------|------|--------|
| zh-TW | 繁体中文 | 🇹🇼 | zh-TW.json |
| en | 英语 | 🇬🇧 | en.json |
| th | 泰语 | 🇹🇭 | th.json |
| vi | 越南语 | 🇻🇳 | vi.json |
| ru | 俄语 | 🇷🇺 | ru.json |
| de | 德语 | 🇩🇪 | de.json |

### 默认语言

- **默认语言**: 繁体中文 (zh-TW)
- **后备语言**: 英语 (en)

---

## 技术架构

### 技术栈

- **国际化库**: next-intl
- **翻译文件格式**: JSON
- **翻译文件位置**: `src/messages/`

### 核心组件

```typescript
// 使用翻译
import { useTranslations } from 'next-intl';

function MyComponent() {
  const t = useTranslations('module');
  return <div>{t('key')}</div>;
}
```

---

## 翻译文件管理

### 文件结构

```
src/messages/
├── zh-TW.json    # 繁体中文（主文件）
├── en.json       # 英语
├── th.json       # 泰语
├── vi.json       # 越南语
├── ru.json       # 俄语
└── de.json       # 德语
```

### 模块划分

翻译文件按功能模块划分，每个模块包含相关的翻译键：

```json
{
  "common": { ... },      // 通用词汇
  "nav": { ... },         // 导航
  "auth": { ... },        // 认证
  "market": { ... },      // 市场
  "trade": { ... },       // 交易
  "position": { ... },    // 持仓
  "wealth": { ... },      // 理财
  "wallet": { ... },      // 钱包
  "deposit": { ... },     // 入金
  "withdraw": { ... },    // 出金
  "customerService": { ... }, // 客服
  "profile": { ... },     // 个人中心
  "changePassword": { ... },  // 修改密码
  "verify": { ... },      // 实名认证
  "staking": { ... },     // 质押
  "complaint": { ... },   // 投诉邮箱
  "language": { ... }     // 语言选择
}
```

### 文件完整性规则

1. **一致性**: 所有语言文件必须包含相同的翻译键
2. **完整性**: 任何新增翻译键必须在所有6种语言中添加
3. **格式**: 使用统一的 JSON 格式（2空格缩进）
4. **顺序**: 保持翻译键的顺序一致性

---

## 翻译键命名规范

### 命名规则

1. **使用点分法**: `module.key`
2. **小驼峰命名**: `confirmNewPassword`
3. **保持简洁**: 避免过长的键名
4. **语义清晰**: 键名应清楚表达含义

### 命名示例

```json
{
  "common": {
    "login": "登录",
    "register": "注册",
    "confirm": "确认"
  },
  "auth": {
    "emailLogin": "邮箱登录",
    "emailPlaceholder": "请输入您的邮箱",
    "confirmPassword": "请再次输入密码"
  },
  "changePassword": {
    "oldPassword": "旧密码",
    "newPassword": "新密码",
    "confirmNewPassword": "确认新密码"
  }
}
```

### 禁止事项

- ❌ 不要使用中划线: `change-password`
- ❌ 不要使用蛇形命名: `change_password`
- ❌ 不要使用大写: `ChangePassword`
- ❌ 不要重复键名: 多个模块中使用相同的键名

---

## 开发规范

### 页面开发规范

#### ✅ 正确做法

```tsx
'use client';

import { useTranslations } from 'next-intl';

export default function MyPage() {
  const t = useTranslations('module');
  
  return (
    <div>
      <h1>{t('title')}</h1>
      <button onClick={handleClick}>
        {t('button.save')}
      </button>
    </div>
  );
}
```

#### ❌ 错误做法

```tsx
// ❌ 硬编码文本
export default function MyPage() {
  return (
    <div>
      <h1>页面标题</h1>
      <button onClick={handleClick}>保存</button>
    </div>
  );
}
```

### 新功能开发规范

当开发新功能时，必须遵循以下步骤：

1. **第一步**: 在 `zh-TW.json` 中添加翻译键
2. **第二步**: 为其他5种语言添加对应的翻译
3. **第三步**: 在组件中使用 `useTranslations()`
4. **第四步**: 测试语言切换功能

### 翻译键使用规范

#### 基本使用

```tsx
// 导入单个模块
const t = useTranslations('auth');

// 使用翻译
<t('emailLogin'>
<t('emailPlaceholder'>
```

#### 跨模块引用

```tsx
// 导入多个模块
const tCommon = useTranslations('common');
const tAuth = useTranslations('auth');

// 使用翻译
{tCommon('confirm')}
{tAuth('emailLogin')}
```

#### 带参数的翻译

```json
// 翻译文件
{
  "common": {
    "welcome": "欢迎, {name}!"
  }
}
```

```tsx
// 使用
const t = useTranslations('common');
const message = t('welcome', { name: '张三' });
// 输出: 欢迎, 张三!
```

### Toast/消息提示规范

```tsx
import { toast } from 'sonner';

export function MyComponent() {
  const t = useTranslations('module');
  
  const handleSuccess = () => {
    toast.success(t('successMessage'));
  };
  
  const handleError = () => {
    toast.error(t('errorMessage'));
  };
}
```

---

## 代码审查清单

### 提交前检查清单

#### 翻译文件检查

- [ ] 所有语言文件都包含新的翻译键
- [ ] JSON 格式正确，无语法错误
- [ ] 翻译键命名符合规范
- [ ] 翻译内容准确且符合语言习惯
- [ ] 金融术语使用正确

#### 组件代码检查

- [ ] 页面组件使用了 `useTranslations()`
- [ ] 所有文本都使用翻译键，无硬编码
- [ ] Toast/提示信息使用了翻译
- [ ] 确认对话框使用了翻译
- [ ] 按钮文本使用了翻译

#### 功能测试检查

- [ ] 在所有6种语言下测试页面
- [ ] 验证语言切换功能正常
- [ ] 检查文本显示是否完整
- [ ] 检查是否有截断或溢出
- [ ] 检查翻译内容是否合适

### PR 审查清单

#### 翻译相关检查项

- [ ] 是否有新增的翻译键？
- [ ] 新增的翻译键是否在所有语言文件中都添加了？
- [ ] 翻译键命名是否符合规范？
- [ ] 翻译内容是否准确？
- [ ] 金融术语是否正确？
- [ ] 是否有硬编码的文本？

---

## 术语库

### 金融术语对照表

| 中文 | 英语 | 泰语 | 越南语 | 俄语 | 德语 |
|------|------|------|--------|------|------|
| 交易 | Trade | การซื้อขาย | Giao dịch | Торговля | Handel |
| 持仓 | Position | ตำแหน่ง | Vị thế | Позиция | Position |
| 订单 | Order | คำสั่ง | Lệnh | Ордер | Auftrag |
| 杠杆 | Leverage | เลเวอเรจ | Đòn bẩy | Кредитное плечо | Hebel |
| 止损 | Stop Loss | ตัดขาดทุน | Cắt lỗ | Стоп-лосс | Stop-Loss |
| 止盈 | Take Profit | ทำกำไร | Chốt lời | Тейк-профит | Take-Profit |
| Staking | Staking | Staking | Staking | Стейкинг | Staking |
| 质押 | Staking | Staking | Staking | Стейкинг | Staking |
| 赎回 | Unstake | Unstake | Rút staking | Вывод из стейкинга | Staking aufheben |
| 保证金 | Margin | มาร์จิน | Ký quỹ | Маржа | Marge |
| 可用保证金 | Free Margin | มาร์จินที่ใช้ได้ | Ký quỹ khả dụng | Доступная маржа | Verfügbare Marge |
| 风险率 | Risk Ratio | อัตราความเสี่ยง | Tỷ lệ rủi ro | Коэффициент риска | Risikoquote |
| 外汇 | Forex | ฟอเร็กซ์ | Ngoại hối | Форекс | Forex |
| 贵金属 | Metal | โลหะมีค่า | Kim loại quý | Драгоценные металлы | Edelmetalle |
| 加密货币 | Crypto | สกุลเงินดิจิทัล | Tiền điện tử | Криптовалюта | Kryptowährungen |

### UI 术语对照表

| 中文 | 英语 | 泰语 | 越南语 | 俄语 | 德语 |
|------|------|------|--------|------|------|
| 登录 | Login | เข้าสู่ระบบ | Đăng nhập | Войти | Anmelden |
| 注册 | Register | ลงทะเบียน | Đăng ký | Регистрация | Registrieren |
| 退出 | Logout | ออกจากระบบ | Đăng xuất | Выйти | Abmelden |
| 确认 | Confirm | ยืนยัน | Xác nhận | Подтвердить | Bestätigen |
| 取消 | Cancel | ยกเลิก | Hủy | Отмена | Abbrechen |
| 保存 | Save | บันทึก | Lưu | Сохранить | Speichern |
| 删除 | Delete | ลบ | Xóa | Удалить | Löschen |
| 编辑 | Edit | แก้ไข | Chỉnh sửa | Редактировать | Bearbeiten |
| 提交 | Submit | ส่ง | Gửi | Отправить | Senden |
| 加载中 | Loading | กำลังโหลด | Đang tải | Загрузка | Laden |

### 更多术语

请参考 [TERMINOLOGY.md](./TERMINOLOGY.md) 获取完整的术语库。

---

## 常见问题

### Q1: 如何添加新的翻译键？

**步骤**:
1. 在 `src/messages/zh-TW.json` 中添加翻译键
2. 为其他5种语言添加对应的翻译
3. 在组件中使用 `useTranslations()` 引用
4. 测试语言切换功能

### Q2: 如何处理专业术语？

**原则**:
- 金融术语优先保留英文（如: Staking, Stop Loss）
- 如果本地化更常见，使用本地化术语（如: 保证金 → Margin）
- 参考术语库保持一致性

### Q3: 如何处理长文本？

**原则**:
- 避免过长的文本，尽量拆分成多个键
- 使用清晰的段落结构
- 考虑不同语言的文本长度差异

### Q4: 如何处理日期和数字格式？

**方法**:
```tsx
import { useFormatter } from 'next-intl';

function MyComponent() {
  const format = useFormatter();
  const date = new Date();
  const number = 1234.56;
  
  return (
    <div>
      <p>{format.dateTime(date, { dateStyle: 'full' })}</p>
      <p>{format.number(number, { style: 'currency', currency: 'USD' })}</p>
    </div>
  );
}
```

### Q5: 如何处理复数形式？

**方法**:
```json
{
  "items": {
    "zero": "没有项目",
    "one": "1 个项目",
    "other": "{count} 个项目"
  }
}
```

### Q6: 如何调试翻译问题？

**方法**:
1. 检查浏览器控制台是否有翻译错误
2. 确认翻译键存在于所有语言文件中
3. 验证 JSON 格式是否正确
4. 检查组件是否正确使用 `useTranslations()`

### Q7: 如何处理新语言的支持？

**步骤**:
1. 在 `i18n.ts` 中添加新语言代码
2. 创建对应的翻译文件 `messages/{lang}.json`
3. 从 `zh-TW.json` 复制翻译键结构
4. 翻译所有内容
5. 在 `src/config/languages.ts` 中添加语言配置
6. 测试新语言功能

---

## 版本历史

| 版本 | 日期 | 修改内容 | 作者 |
|------|------|----------|------|
| 1.0 | 2026-03-02 | 初始版本 | Team |

---

## 联系方式

如有翻译相关的问题或建议，请联系开发团队。
