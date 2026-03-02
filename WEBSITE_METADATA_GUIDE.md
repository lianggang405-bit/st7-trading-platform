# 网站信息配置指南

## 概述

本指南说明如何自定义网站在分享和浏览器中显示的信息，包括标题、描述、图标等。

## 配置文件位置

主要配置文件：`src/app/[locale]/layout.tsx`

## 已配置的内容

### 1. 网站标题

**默认标题**: "全球交易平台 - 专业数字资产交易"
**模板**: "%s | 全球交易平台"

**效果**:
- 首页标题: "全球交易平台 - 专业数字资产交易"
- 其他页面标题: "页面名称 | 全球交易平台"

### 2. 网站描述

**当前描述**:
```
专业的全球数字资产交易平台，支持多语言、市价交易、挂单交易、持仓管理、风控系统。安全、稳定、高效。
```

### 3. 关键词

**当前关键词**:
```
交易平台, 数字货币, 加密货币, 交易, 投资理财, BTC, ETH, 比特币, 以太坊, 市价交易, 挂单交易
```

### 4. Open Graph 标签（社交媒体分享）

这些标签决定了在 Facebook、LinkedIn、WhatsApp 等平台分享时的预览效果。

**已配置**:
- 类型: website
- 标题: 全球交易平台 - 专业数字资产交易
- 描述: 专业的全球数字资产交易平台...
- 网站名称: 全球交易平台
- 图片: /og-image.png (需要您提供)

### 5. Twitter Card 标签

这些标签决定了在 Twitter/X 分享时的预览效果。

**已配置**:
- 卡片类型: summary_large_image
- 标题: 全球交易平台 - 专业数字资产交易
- 描述: 专业的全球数字资产交易平台...
- 图片: /og-image.png (需要您提供)

### 6. 图标配置

**已配置**:
- SVG Favicon: /favicon.svg (已创建)
- ICO Favicon: /favicon.ico (需要您提供)
- Apple Touch Icon: /apple-touch-icon.png (需要您提供)

## 需要准备的图片文件

### 必需文件

1. **og-image.png** (1200x630 像素)
   - 用途: 社交媒体分享预览图
   - 要求: PNG 格式，推荐包含品牌标识和网站名称
   - 位置: `/public/og-image.png`

2. **apple-touch-icon.png** (180x180 像素)
   - 用途: iOS 设备添加到主屏幕时的图标
   - 要求: PNG 格式，圆角
   - 位置: `/public/apple-touch-icon.png`

3. **favicon.ico** (16x16, 32x32 像素)
   - 用途: 浏览器标签页图标
   - 要求: ICO 格式
   - 位置: `/public/favicon.ico`

### 可选文件

4. **icon-192x192.png** (192x192 像素)
   - 用途: PWA 图标（中等尺寸）
   - 位置: `/public/icon-192x192.png`

5. **icon-512x512.png** (512x512 像素)
   - 用途: PWA 图标（大尺寸）
   - 位置: `/public/icon-512x512.png`

## 如何自定义网站信息

### 修改标题和描述

编辑 `src/app/[locale]/layout.tsx` 文件：

```typescript
export const metadata: Metadata = {
  title: {
    default: '您的网站标题',
    template: '%s | 您的网站名称',
  },
  description: '您的网站描述',
  // ...
};
```

### 修改 Open Graph 信息

```typescript
export const metadata: Metadata = {
  // ...
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: 'https://your-domain.com', // 替换为您的域名
    title: '您的网站标题',
    description: '您的网站描述',
    siteName: '您的网站名称',
    images: [
      {
        url: '/og-image.png', // 确保这个文件存在于 public 目录
        width: 1200,
        height: 630,
        alt: '您的网站名称',
      },
    ],
  },
};
```

### 修改 Twitter Card 信息

```typescript
export const metadata: Metadata = {
  // ...
  twitter: {
    card: 'summary_large_image',
    title: '您的网站标题',
    description: '您的网站描述',
    images: ['/og-image.png'],
    creator: '@YourTwitterHandle', // 替换为您的 Twitter 账号
  },
};
```

### 修改关键词

```typescript
export const metadata: Metadata = {
  // ...
  keywords: '关键词1, 关键词2, 关键词3',
};
```

## 图片文件准备工具

### 在线工具

1. **Favicon 生成器**
   - https://www.favicon-generator.org/
   - https://realfavicongenerator.net/

2. **Open Graph 图片生成器**
   - https://www.opengraph.xyz/
   - https://metatags.io/

3. **Canva** (免费在线设计工具)
   - https://www.canva.com/

### 推荐尺寸

| 文件类型 | 推荐尺寸 | 用途 |
|---------|---------|------|
| favicon.ico | 16x16, 32x32 | 浏览器标签 |
| apple-touch-icon.png | 180x180 | iOS 主屏幕 |
| icon-192x192.png | 192x192 | PWA 中等图标 |
| icon-512x512.png | 512x512 | PWA 大图标 |
| og-image.png | 1200x630 | 社交媒体分享 |
| screenshot-desktop.png | 1920x1080 | PWA 截图（桌面） |
| screenshot-mobile.png | 375x667 | PWA 截图（移动端） |

## 验证配置

### 1. 测试 Open Graph 标签

访问以下工具测试您的 Open Graph 配置：
- https://www.opengraph.xyz/
- https://metatags.io/
- https://developers.facebook.com/tools/debug/

### 2. 测试 Twitter Card

访问以下工具测试您的 Twitter Card 配置：
- https://cards-dev.twitter.com/validator

### 3. 测试 Favicon

直接在浏览器中访问您的网站，查看标签页图标是否正确显示。

### 4. 测试 PWA

在 Chrome DevTools 的 Application 标签中检查 Manifest 配置。

## 部署后的更新

修改配置后：

1. **重新构建项目**:
   ```bash
   pnpm run build
   ```

2. **重启服务**:
   ```bash
   pm2 restart trading-platform
   ```

3. **清除缓存**:
   - 在浏览器中清除缓存
   - 使用隐私/无痕模式测试
   - 或者在 URL 后添加 `?v=<timestamp>` 强制刷新

## 常见问题

### Q: 修改后为什么没有立即生效？

A: 可能是因为：
1. 浏览器缓存了旧的元数据
2. 社交媒体平台缓存了旧的预览信息
3. CDN 缓存

解决方法：
- 清除浏览器缓存
- 使用隐私模式测试
- 等待缓存过期（通常 24 小时）

### Q: Open Graph 图片不显示？

A: 检查：
1. 文件是否存在于 `public/` 目录
2. 文件路径是否正确
3. 文件尺寸是否符合要求（1200x630）
4. 文件大小是否过大（建议 < 500KB）

### Q: Twitter Card 显示错误？

A: 检查：
1. 是否在 Twitter Card Validator 中验证过
2. 网站是否可以被 Twitter 爬虫访问
3. 图片 URL 是否是公开可访问的

## 示例配置

完整的 metadata 配置示例已保存在 `src/app/[locale]/layout.tsx` 中，您可以根据需要进行修改。

---

**最后更新**: 2026-03-02
