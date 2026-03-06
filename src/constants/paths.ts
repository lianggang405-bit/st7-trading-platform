/**
 * 静态资源路径常量
 * 统一管理所有静态资源的路径，使用绝对路径以避免多语言路由问题
 */

// Logo
export const LOGO_PATH = '/logo.png';
export const LOGO_WIDTH = 200;
export const LOGO_HEIGHT = 80;

// Favicon
export const FAVICON_PATH = '/favicon.ico';
export const FAVICON_SVG_PATH = '/favicon.svg';
export const FAVICON_96_PATH = '/favicon-96x96.png';
export const APPLE_TOUCH_ICON_PATH = '/apple-touch-icon.png';

// Manifest
export const MANIFEST_PATH = '/site.webmanifest';

// OG Image
export const OG_IMAGE_PATH = '/og-image.png';
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

// Web App Manifest Icons
export const MANIFEST_ICON_192_PATH = '/web-app-manifest-192x192.png';
export const MANIFEST_ICON_512_PATH = '/web-app-manifest-512x512.png';

// 辅助函数：获取正确的静态资源路径
export function getStaticPath(path: string): string {
  // 如果已经以 / 开头，直接返回
  if (path.startsWith('/')) {
    return path;
  }
  
  // 否则添加 /
  return `/${path}`;
}
