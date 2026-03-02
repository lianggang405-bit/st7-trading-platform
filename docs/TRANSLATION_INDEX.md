# 翻译文档索引 (Translation Documentation Index)

本文档是项目翻译相关文档的索引，帮助开发者快速找到所需的翻译文档。

## 📚 文档列表

### 1. 翻译管理规范 ([TRANSLATION_GUIDELINES.md](./TRANSLATION_GUIDELINES.md))

**适用对象**: 所有开发者

**内容概览**:
- 支持的语言列表
- 翻译键命名规范
- 开发规范
- 技术架构说明
- 常见问题解答

**何时查看**:
- 新加入项目时
- 需要了解翻译规范时
- 遇到翻译相关问题时

---

### 2. 术语库 ([TERMINOLOGY.md](./TERMINOLOGY.md))

**适用对象**: 翻译人员、开发者

**内容概览**:
- 金融术语对照表（6种语言）
- UI 术语对照表
- 账户术语对照表
- 货币单位对照表
- 时间术语对照表

**何时查看**:
- 添加新翻译时
- 检查术语一致性时
- 修改现有翻译时

**常用术语快速查询**:

| 中文 | 英语 | 泰语 | 越南语 | 俄语 | 德语 |
|------|------|------|--------|------|------|
| 交易 | Trade | การซื้อขาย | Giao dịch | Торговля | Handel |
| 持仓 | Position | ตำแหน่ง | Vị thế | Позиция | Position |
| Staking | Staking | Staking | Staking | Стейкинг | Staking |
| 保证金 | Margin | มาร์จิน | Ký quỹ | Маржа | Marge |

---

### 3. 翻译开发流程指南 ([TRANSLATION_WORKFLOW.md](./TRANSLATION_WORKFLOW.md))

**适用对象**: 开发者

**内容概览**:
- 开发前准备步骤
- 新功能开发流程（5个步骤）
- 翻译文件修改流程
- 测试流程
- 问题排查方法
- 最佳实践

**何时查看**:
- 开发新功能时
- 修改现有功能时
- 遇到翻译问题时

**快速流程图**:

```
添加翻译键 → 翻译其他语言 → 开发组件 → 使用翻译 → 测试验证
```

---

### 4. 代码审查清单 ([TRANSLATION_CHECKLIST.md](./TRANSLATION_CHECKLIST.md))

**适用对象**: 代码审查者、开发者

**内容概览**:
- 提交前检查清单
- PR 审查清单
- 自动化检查配置
- 测试验证步骤
- 常见问题排查

**何时查看**:
- 提交代码前
- 审查他人代码时
- 进行测试时

**快速检查命令**:

```bash
# 检查 JSON 格式
for file in src/messages/*.json; do
  jq empty "$file"
done

# 检查硬编码文本
grep -r "[\u4e00-\u9fa5]" src/app/ --include="*.tsx" --include="*.ts" \
  --exclude-dir="messages" | grep -v "// "
```

---

## 🚀 快速开始

### 新手指南

如果你是项目的新成员，按以下顺序阅读文档：

1. **第一步**: 阅读 [翻译管理规范](./TRANSLATION_GUIDELINES.md) 了解项目规范
2. **第二步**: 阅读 [术语库](./TERMINOLOGY.md) 了解术语使用
3. **第三步**: 阅读 [翻译开发流程指南](./TRANSLATION_WORKFLOW.md) 学习开发流程
4. **第四步**: 参考 [代码审查清单](./TRANSLATION_CHECKLIST.md) 进行自我检查

### 开发新功能

开发新功能时，遵循以下流程：

```
1. 在 zh-TW.json 中添加翻译键
   ↓
2. 为其他5种语言添加翻译（参考术语库）
   ↓
3. 开发组件并使用翻译
   ↓
4. 在所有语言下测试
   ↓
5. 使用代码审查清单自检
```

### 修改现有功能

修改现有功能时，遵循以下流程：

```
1. 查看现有翻译键
   ↓
2. 修改所有6种语言的翻译
   ↓
3. 更新相关组件代码
   ↓
4. 在所有语言下测试
   ↓
5. 确保没有破坏其他功能
```

---

## 📋 常用命令

### 翻译文件检查

```bash
# 检查所有翻译文件的 JSON 格式
for file in src/messages/*.json; do
  echo "Checking $file..."
  jq empty "$file" && echo "✅ OK" || echo "❌ Error"
done

# 检查某个翻译键是否在所有文件中都存在
grep '"yourKey"' src/messages/*.json
```

### 硬编码文本检查

```bash
# 查找硬编码的中文字符（排除注释）
grep -r "[\u4e00-\u9fa5]" src/app/ --include="*.tsx" --include="*.ts" \
  --exclude-dir="messages" | grep -v "// " | grep -v "/*" | grep -v "*"
```

### 组件翻译检查

```bash
# 检查哪些组件使用了翻译
grep -r "useTranslations" src/app/ --include="*.tsx" --include="*.ts"

# 检查特定组件的翻译键
grep -r "useTranslations('module')" src/app/
```

---

## 🔗 相关资源

### 项目文档

- [数据架构文档](./DATA_ARCHITECTURE.md) - 了解项目数据结构
- [禁用货币配置](./CURRENCY_KXES_DISABLE.md) - 查看已禁用的货币
- [禁用的投资页面](./INVESTMENT_PAGES_DISABLE.md) - 查看已禁用的页面

### 外部资源

- [next-intl 官方文档](https://next-intl-docs.vercel.app/)
- [i18n 最佳实践](https://www.i18next.com/principles/best-practices)

---

## 📞 获取帮助

如果你遇到翻译相关的问题：

1. **查阅文档**: 首先查看相关文档
2. **搜索术语**: 在术语库中查找正确的翻译
3. **参考示例**: 查看翻译开发流程指南中的示例
4. **联系团队**: 如果仍有问题，联系开发团队

---

## 📝 文档维护

### 如何更新文档

如果你发现文档有误或需要更新：

1. 修改对应文档文件
2. 更新版本历史
3. 提交 PR 并说明修改原因

### 版本历史

| 文档 | 最后更新 | 维护人 |
|------|---------|--------|
| 翻译管理规范 | 2026-03-02 | Team |
| 术语库 | 2026-03-02 | Team |
| 翻译开发流程指南 | 2026-03-02 | Team |
| 代码审查清单 | 2026-03-02 | Team |
| 文档索引 | 2026-03-02 | Team |

---

## 🎯 最佳实践总结

### 开发规范

- ✅ 所有文本必须使用翻译，禁止硬编码
- ✅ 翻译键必须在所有6种语言中都添加
- ✅ 使用术语库保持翻译一致性
- ✅ 在所有语言下测试页面

### 命名规范

- ✅ 使用小驼峰命名: `confirmNewPassword`
- ✅ 使用点分法: `auth.emailLogin`
- ✅ 模块化组织: 按功能模块划分

### 审查规范

- ✅ 提交前检查所有翻译文件
- ✅ 确保 JSON 格式正确
- ✅ 验证没有硬编码文本
- ✅ 测试所有语言版本

---

## 📚 文档目录树

```
docs/
├── TRANSLATION_INDEX.md          # 本文档 - 翻译文档索引
├── TRANSLATION_GUIDELINES.md     # 翻译管理规范
├── TERMINOLOGY.md                # 术语库
├── TRANSLATION_WORKFLOW.md       # 翻译开发流程指南
├── TRANSLATION_CHECKLIST.md      # 代码审查清单
├── DATA_ARCHITECTURE.md          # 数据架构文档
├── CURRENCY_KXES_DISABLE.md      # 禁用货币配置
└── INVESTMENT_PAGES_DISABLE.md   # 禁用的投资页面
```

---

## 🔄 快速链接

- [翻译管理规范](./TRANSLATION_GUIDELINES.md)
- [术语库](./TERMINOLOGY.md)
- [翻译开发流程指南](./TRANSLATION_WORKFLOW.md)
- [代码审查清单](./TRANSLATION_CHECKLIST.md)

---

**最后更新**: 2026-03-02  
**文档版本**: 1.0
