# 翻译代码审查清单 (Translation Code Review Checklist)

本文档提供了翻译相关的代码审查清单，确保代码质量和翻译的一致性。

## 目录

- [提交前检查](#提交前检查)
- [PR 审查清单](#pr-审查清单)
- [自动化检查](#自动化检查)
- [测试验证](#测试验证)
- [常见问题](#常见问题)

---

## 提交前检查

### 快速检查清单

在提交代码前，快速检查以下项目：

#### 翻译文件检查

- [ ] **翻译文件完整性**: 新增的翻译键是否在所有6种语言中都添加了？
- [ ] **JSON 格式**: 所有翻译文件的 JSON 格式是否正确？
- [ ] **键名规范**: 翻译键命名是否符合规范（小驼峰、点分法）？
- [ ] **缩进一致**: JSON 缩进是否统一为2空格？
- [ ] **无多余键**: 是否有未使用的翻译键？

#### 组件代码检查

- [ ] **无硬编码**: 组件中没有硬编码的中文字符？
- [ ] **使用 useTranslations**: 所有需要翻译的文本都使用了 `useTranslations()`？
- [ ] **Toast 翻译**: Toast 消息是否使用了翻译？
- [ ] **Placeholder 翻译**: Input placeholder 是否使用了翻译？
- [ ] **错误翻译**: 错误信息是否使用了翻译？
- [ ] **按钮翻译**: 按钮文本是否使用了翻译？

#### 功能检查

- [ ] **语言切换**: 语言切换功能是否正常？
- [ ] **默认语言**: 默认语言是否为繁体中文？
- [ ] **后备语言**: 缺失翻译是否正确显示为英语？

### 命令行检查

使用以下命令快速检查：

```bash
# 1. 检查 JSON 格式
for file in src/messages/*.json; do
  echo "Checking $file..."
  jq empty "$file" && echo "✅ OK" || echo "❌ Error"
done

# 2. 检查硬编码文本
echo "Checking hardcoded text..."
grep -r "[\u4e00-\u9fa5]" src/app/ --include="*.tsx" --include="*.ts" --exclude-dir="messages" \
  | grep -v "// " | grep -v "/*" | grep -v "*" \
  && echo "❌ Found hardcoded text" || echo "✅ No hardcoded text"

# 3. 检查 useTranslations 使用
echo "Checking useTranslations usage..."
grep -r "useTranslations" src/app/ --include="*.tsx" --include="*.ts" | wc -l

# 4. 检查翻译键一致性
echo "Checking translation keys consistency..."
node scripts/check-translations.js
```

---

## PR 审查清单

### 翻译相关审查

#### 新增翻译键

当 PR 包含新增翻译键时，检查以下内容：

- [ ] **所有语言**: 新增的翻译键是否在所有6种语言中都添加了？
  ```bash
  # 检查方法
  grep '"newKey"' src/messages/*.json
  # 应该输出6个文件都包含该键
  ```

- [ ] **键名规范**: 翻译键命名是否符合规范？
  - 使用小驼峰: `confirmNewPassword` ✅
  - 使用点分法: `auth.emailLogin` ✅
  - 不使用蛇形命名: `confirm_new_password` ❌
  - 不使用大写: `ConfirmPassword` ❌

- [ ] **模块划分**: 翻译键是否放在正确的模块中？
  - 导航相关 → `nav` 模块
  - 认证相关 → `auth` 模块
  - 交易相关 → `trade` 模块

#### 翻译内容质量

检查翻译内容的质量：

- [ ] **准确性**: 翻译是否准确表达原意？
- [ ] **自然性**: 翻译是否符合目标语言的表达习惯？
- [ ] **一致性**: 术语使用是否与术语库一致？
- [ ] **长度**: 翻译长度是否合适，不会导致UI溢出？
- [ ] **专业术语**: 金融术语是否正确？

**常见术语检查**:
| 中文 | 英语 | 泰语 | 越南语 | 俄语 | 德语 |
|------|------|------|--------|------|------|
| 交易 | Trade | การซื้อขาย | Giao dịch | Торговля | Handel |
| 持仓 | Position | ตำแหน่ง | Vị thế | Позиция | Position |
| Staking | Staking | Staking | Staking | Стейкинг | Staking |
| 保证金 | Margin | มาร์จิน | Ký quỹ | Маржа | Marge |

#### 组件代码审查

检查组件代码中翻译的使用：

- [ ] **导入翻译**: 是否正确导入 `useTranslations`？
  ```tsx
  // ✅ 正确
  import { useTranslations } from 'next-intl';
  const t = useTranslations('module');
  
  // ❌ 错误
  import { useTranslations } from 'next-intl';
  const t = useTranslations();  // 未指定模块
  ```

- [ ] **使用翻译**: 所有文本是否都使用了翻译？
  ```tsx
  // ✅ 正确
  <h1>{t('title')}</h1>
  <input placeholder={t('placeholder')} />
  <button onClick={handleSubmit}>{t('submit')}</button>
  
  // ❌ 错误
  <h1>页面标题</h1>
  <input placeholder="请输入..." />
  <button onClick={handleSubmit}>提交</button>
  ```

- [ ] **错误处理**: 错误信息是否使用翻译？
  ```tsx
  // ✅ 正确
  try {
    await api.call();
  } catch (error) {
    toast.error(t('error.networkError'));
  }
  
  // ❌ 错误
  try {
    await api.call();
  } catch (error) {
    toast.error('网络错误，请稍后重试');
  }
  ```

- [ ] **条件渲染**: 条件渲染中的文本是否使用翻译？
  ```tsx
  // ✅ 正确
  {isLoading ? t('loading') : t('submit')}
  
  // ❌ 错误
  {isLoading ? '加载中...' : '提交'}
  ```

#### 布局和样式检查

检查不同语言下的布局：

- [ ] **文本溢出**: 长文本（如德语、俄语）是否会导致UI溢出？
- [ ] **按钮宽度**: 按钮宽度是否适应不同语言的文本长度？
- [ ] **对齐方式**: 文本对齐是否在所有语言下都合适？
- [ ] **字体大小**: 字体大小是否适合所有语言？

**测试方法**:
```bash
# 在所有语言下测试页面
http://localhost:5000/zh-TW/  # 繁体中文
http://localhost:5000/en/     # 英语
http://localhost:5000/de/     # 德语（通常文本较长）
http://localhost:5000/ru/     # 俄语（通常文本较长）
```

### 性能审查

检查翻译相关性能：

- [ ] **重复渲染**: 是否有不必要的重复渲染？
  ```tsx
  // ✅ 正确：在组件外部或使用 useMemo
  const t = useTranslations('module');
  
  // ❌ 错误：在循环内重复调用
  {items.map(item => {
    const t = useTranslations('module');  // 每次都创建新的实例
    return <div>{t('item')}</div>;
  })}
  ```

- [ ] **模块导入**: 是否按需导入翻译模块？

### 安全审查

检查翻译相关的安全问题：

- [ ] **XSS 防护**: 翻译内容是否正确转义？（next-intl 默认处理）
- [ ] **敏感信息**: 翻译中是否包含敏感信息？

---

## 自动化检查

### ESLint 规则

建议添加以下 ESLint 规则：

```javascript
// .eslintrc.js
{
  rules: {
    // 检查硬编码文本
    'no-hardcoded-text': 'error',
    
    // 检查翻译键命名
    'translation-key-naming': 'error'
  }
}
```

### 预提交钩子

使用 Husky 和 lint-staged 自动检查：

```bash
# 安装依赖
pnpm add -D husky lint-staged

# 初始化 husky
pnpm exec husky install

# 添加预提交钩子
echo "pnpm exec lint-staged" > .husky/pre-commit
```

```javascript
// package.json
{
  "lint-staged": {
    "src/messages/*.json": [
      "jq empty",
      "node scripts/check-translations.js"
    ],
    "src/**/*.{ts,tsx}": [
      "eslint --fix",
      "grep -v '[\u4e00-\u9fa5]' || echo '❌ Found hardcoded text'"
    ]
  }
}
```

### GitHub Actions CI

在 CI 流程中添加翻译检查：

```yaml
# .github/workflows/translation-check.yml
name: Translation Check

on:
  pull_request:
    paths:
      - 'src/messages/**'
      - 'src/**/*.{ts,tsx}'

jobs:
  check-translations:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: pnpm install
        
      - name: Check JSON format
        run: |
          for file in src/messages/*.json; do
            jq empty "$file"
          done
          
      - name: Check translation keys consistency
        run: node scripts/check-translations.js
        
      - name: Check hardcoded text
        run: |
          ! grep -r "[\u4e00-\u9fa5]" src/app/ --include="*.tsx" --include="*.ts" \
            --exclude-dir="messages" | grep -v "// " | grep -v "/*" | grep -v "*"
```

---

## 测试验证

### 功能测试

#### 语言切换测试

- [ ] 点击语言切换器，语言是否正确切换？
- [ ] 切换后页面内容是否更新？
- [ ] 切换后 URL 是否正确变化？
- [ ] 刷新页面后语言是否保持？

#### 内容显示测试

为每种语言执行以下测试：

- [ ] **繁体中文 (zh-TW)**
  - [ ] 所有文本正确显示
  - [ ] 没有乱码
  - [ ] 没有显示键名

- [ ] **英语 (en)**
  - [ ] 所有文本正确显示
  - [ ] 语法正确
  - [ ] 没有拼写错误

- [ ] **泰语 (th)**
  - [ ] 所有文本正确显示
  - [ ] 泰文字符正确显示
  - [ ] 没有乱码

- [ ] **越南语 (vi)**
  - [ ] 所有文本正确显示
  - [ ] 越南语字符正确显示
  - [ ] 没有乱码

- [ ] **俄语 (ru)**
  - [ ] 所有文本正确显示
  - [ ] 西里尔字母正确显示
  - [ ] 没有乱码

- [ ] **德语 (de)**
  - [ ] 所有文本正确显示
  - [ ] 德语语法正确（名词首字母大写）
  - [ ] 没有乱码

#### UI 适配测试

- [ ] 所有语言下布局正常
- [ ] 没有文本溢出
- [ ] 按钮宽度合适
- [ ] 表单对齐正确

### 回归测试

修改翻译后，测试以下内容：

- [ ] **受影响的页面**: 所有使用了修改翻译键的页面
- [ ] **相关功能**: 与翻译相关的功能
- [ ] **语言切换**: 切换语言功能是否正常
- [ ] **缓存**: 浏览器缓存是否影响翻译显示

---

## 常见问题

### 问题 1: 翻译键遗漏

**症状**: 页面显示 `missing.key` 或类似内容

**审查要点**:
- [ ] 检查所有语言文件是否都包含该键
- [ ] 检查键名拼写是否正确
- [ ] 检查组件是否正确使用翻译键

**检查命令**:
```bash
# 检查翻译键是否存在于所有文件
grep '"yourKey"' src/messages/*.json
```

### 问题 2: 硬编码文本

**症状**: 某些文本没有翻译，直接显示中文

**审查要点**:
- [ ] 搜索代码中的中文字符
- [ ] 检查注释是否被误认为硬编码文本
- [ ] 检查字符串字面量

**检查命令**:
```bash
# 查找硬编码的中文字符
grep -r "[\u4e00-\u9fa5]" src/app/ --include="*.tsx" --include="*.ts" \
  --exclude-dir="messages" | grep -v "// " | grep -v "/*"
```

### 问题 3: JSON 格式错误

**症状**: 页面无法加载，显示 JSON 解析错误

**审查要点**:
- [ ] 检查 JSON 语法
- [ ] 检查引号是否匹配
- [ ] 检查逗号是否正确

**检查命令**:
```bash
# 验证 JSON 格式
jq empty src/messages/zh-TW.json
```

### 问题 4: 翻译不一致

**症状**: 相同的概念在不同地方使用不同的翻译

**审查要点**:
- [ ] 检查术语库
- [ ] 检查现有翻译
- [ ] 确保翻译一致性

**示例**:
```json
// ❌ 不一致
"auth": { "login": "登录" },
"nav": { "login": "登入" }

// ✅ 一致
"auth": { "login": "登录" },
"nav": { "login": "登录" }
```

---

## 版本历史

| 版本 | 日期 | 修改内容 | 作者 |
|------|------|----------|------|
| 1.0 | 2026-03-02 | 初始版本 | Team |

---

## 联系方式

如有审查相关的问题或建议，请联系开发团队。
