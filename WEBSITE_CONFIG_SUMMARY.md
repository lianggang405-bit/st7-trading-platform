# ST7全球交易平台 - 网站信息配置完成

## 配置概览

**网站标题**: ST7全球交易平台-专业数字资产交易
**网站域名**: forexpl.shop
**配置日期**: 2026-03-02

## 已完成的配置

### 1. 图片文件配置

所有图片文件已成功下载到 `public/` 目录：

✅ **apple-touch-icon.png** (19K)
- iOS 设备主屏幕图标
- 位置: `public/apple-touch-icon.png`

✅ **favicon.ico** (15K)
- 浏览器标签页图标（IE/Edge 兼容）
- 位置: `public/favicon.ico`

✅ **favicon.svg** (1.3M)
- 现代浏览器图标（SVG 格式）
- 位置: `public/favicon.svg`

✅ **favicon-96x96.png** (6.9K)
- 高分辨率图标
- 位置: `public/favicon-96x96.png`

✅ **web-app-manifest-192x192.png** (22K)
- PWA 中等图标
- 位置: `public/web-app-manifest-192x192.png`

✅ **web-app-manifest-512x512.png** (111K)
- PWA 大图标
- 位置: `public/web-app-manifest-512x512.png`

### 2. 网站元数据配置

**文件**: `src/app/[locale]/layout.tsx`

✅ **网站标题**
- 默认: ST7全球交易平台-专业数字资产交易
- 模板: %s | ST7全球交易平台

✅ **网站描述**
- 专业的全球数字资产交易平台，支持多语言、市价交易、挂单交易、持仓管理、风控系统。安全、稳定、高效。

✅ **关键词**
- 交易平台, 数字货币, 加密货币, 交易, 投资理财, BTC, ETH, 比特币, 以太坊, 市价交易, 挂单交易, ST7, forexpl

✅ **Open Graph 标签**（社交媒体分享）
- 网站名称: ST7全球交易平台
- 域名: https://forexpl.shop
- 图片: /og-image.png（需准备）

✅ **Twitter Card 标签**
- Twitter 账号: @ST7Trading（可修改）
- 大卡片格式，带图片

✅ **图标配置**
- SVG Favicon: /favicon.svg
- ICO Favicon: /favicon.ico
- 96x96 PNG: /favicon-96x96.png
- Apple Touch Icon: /apple-touch-icon.png

### 3. PWA 配置

**文件**: `public/manifest.json`

✅ **应用名称**
- 完整名称: ST7全球交易平台-专业数字资产交易
- 简短名称: ST7交易平台

✅ **主题颜色**
- 主题色: #007aff（蓝色）
- 背景色: #ffffff（白色）

✅ **PWA 图标**
- 192x192: /web-app-manifest-192x192.png
- 512x512: /web-app-manifest-512x512.png

**文件**: `public/site.webmanifest`

✅ **备用 PWA 配置**
- 与 manifest.json 内容同步
- 用于兼容性

## 配置效果

### 浏览器标签页
- **显示**: ST7全球交易平台-专业数字资产交易
- **图标**: 自定义图标（favicon.ico/svg）

### 搜索引擎结果
- **标题**: ST7全球交易平台-专业数字资产交易
- **描述**: 专业的全球数字资产交易平台...
- **关键词**: 优化后的关键词列表

### 社交媒体分享

**Facebook / LinkedIn / WhatsApp**
- **标题**: ST7全球交易平台-专业数字资产交易
- **描述**: 专业的全球数字资产交易平台...
- **网站名称**: ST7全球交易平台
- **图片**: og-image.png（需准备）

**Twitter / X**
- **卡片类型**: summary_large_image
- **标题**: ST7全球交易平台-专业数字资产交易
- **描述**: 专业的全球数字资产交易平台...
- **Twitter 账号**: @ST7Trading

### 移动端 PWA
- **应用名称**: ST7交易平台
- **图标**: 自定义图标（192x192, 512x512）
- **启动画面**: 主题色背景

## 需要准备的文件（可选）

### Open Graph 分享图片

**文件**: `public/og-image.png`

**要求**:
- 尺寸: 1200x630 像素
- 格式: PNG
- 大小: 建议 < 500KB
- 内容: 建议包含品牌标识 "ST7" 和网站名称

**设计建议**:
- 使用主题色 #007aff 作为主色调
- 添加网站 logo 或图标
- 包含网站名称: "ST7全球交易平台"
- 简洁、专业的设计

**生成工具**:
- Canva: https://www.canva.com/
- Open Graph 预览工具: https://www.opengraph.xyz/

## 验证配置

### 1. 本地测试

启动开发服务器：
```bash
pnpm dev
```

在浏览器中访问 `http://localhost:5000`，查看：
- 浏览器标签页标题和图标
- 查看页面源代码的 `<head>` 部分
- 检查 meta 标签是否正确

### 2. 社交媒体验证

使用以下工具测试分享效果：

**Open Graph 验证**:
- https://www.opengraph.xyz/
- https://developers.facebook.com/tools/debug/

**Twitter Card 验证**:
- https://cards-dev.twitter.com/validator

### 3. PWA 验证

在 Chrome DevTools 中：
1. 打开 DevTools (F12)
2. 进入 Application 标签
3. 查看 Manifest 配置
4. 测试添加到主屏幕功能

## 部署更新

### 1. 重新构建

```bash
pnpm run build
```

### 2. 重启服务

```bash
pm2 restart trading-platform
```

### 3. 清除缓存

部署后，可能需要清除缓存才能看到更新：

**浏览器缓存**:
- 使用 Ctrl+F5 (Windows) 或 Cmd+Shift+R (Mac) 强制刷新
- 或使用隐私模式测试

**CDN 缓存**:
- 等待 CDN 缓存过期（通常 24 小时）
- 或手动清除 CDN 缓存

**社交媒体缓存**:
- Facebook: 使用 Facebook Sharing Debugger
- Twitter: 使用 Twitter Card Validator

## 域名配置

**主域名**: forexpl.shop

**需要配置的 DNS 记录**（如果尚未配置）:

```
A 记录:
- @: 您的服务器 IP 地址

CNAME 记录:
- www: forexpl.shop
```

**SSL 证书**:
- 使用 Let's Encrypt 免费证书
- 配置 HTTPS 访问

## 常见问题

### Q: 为什么浏览器标签页还是显示旧的图标？

A:
1. 清除浏览器缓存（Ctrl+Shift+Delete）
2. 使用隐私模式测试
3. 等待几天让浏览器更新缓存

### Q: 社交媒体分享不显示正确的预览？

A:
1. 在对应的验证工具中测试（Facebook Debugger / Twitter Card Validator）
2. 确保图片文件存在且可访问
3. 检查图片尺寸是否符合要求
4. 等待社交媒体平台更新缓存（24-48 小时）

### Q: PWA 安装图标不正确？

A:
1. 清除浏览器缓存
2. 卸载已安装的 PWA
3. 重新加载页面
4. 重新安装 PWA

### Q: 如何修改 Twitter 账号？

A:
编辑 `src/app/[locale]/layout.tsx`:
```typescript
twitter: {
  // ...
  creator: '@YourTwitterHandle', // 修改这里
}
```

## 后续建议

1. **准备 og-image.png**: 创建专业的社交媒体分享图片
2. **配置 HTTPS**: 确保网站使用 SSL 证书
3. **SEO 优化**: 添加更多 SEO 友好的内容
4. **性能监控**: 使用工具监控网站性能
5. **A/B 测试**: 测试不同的标题和描述

## 技术支持

如有问题，请查看：
- 配置指南: `WEBSITE_METADATA_GUIDE.md`
- 部署文档: `DEPLOYMENT.md`
- 检查清单: `DEPLOYMENT_CHECKLIST.md`

---

**配置完成时间**: 2026-03-02
**网站**: ST7全球交易平台
**域名**: forexpl.shop
