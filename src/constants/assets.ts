/**
 * 静态资源统一管理
 * 
 * 所有静态资源必须使用绝对路径，避免多语言路由问题
 * 
 * 使用示例：
 * ```tsx
 * import { ASSETS } from '@/constants/assets';
 * 
 * <img src={ASSETS.logo} alt="Logo" />
 * <Image src={ASSETS.logo} width={200} height={80} />
 * ```
 */

export const ASSETS = {
  // Logo
  logo: '/logo.png',

  // Favicon
  favicon: '/favicon.ico',
  faviconSvg: '/favicon.svg',
  favicon96: '/favicon-96x96.png',
  appleTouchIcon: '/apple-touch-icon.png',

  // Manifest
  manifest: '/site.webmanifest',

  // OG Image
  ogImage: '/og-image.png',

  // Web App Manifest Icons
  manifestIcon192: '/web-app-manifest-192x192.png',
  manifestIcon512: '/web-app-manifest-512x512.png',
} as const;

// 导出类型
export type AssetKey = keyof typeof ASSETS;

// 导出尺寸常量
export const ASSET_SIZES = {
  logo: { width: 200, height: 80 },
  ogImage: { width: 1200, height: 630 },
  favicon96: { width: 96, height: 96 },
  manifestIcon192: { width: 192, height: 192 },
  manifestIcon512: { width: 512, height: 512 },
} as const;

// 辅助函数：获取资产路径
export function getAssetPath(key: AssetKey): string {
  return ASSETS[key];
}
