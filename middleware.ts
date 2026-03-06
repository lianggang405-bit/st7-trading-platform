import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n';

// 创建 next-intl 中间件
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always'
});

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get('token')?.value;

  console.log('[Middleware] pathname:', pathname);
  console.log('[Middleware] token exists:', !!token);

  // 🔒 排除管理端路径和 API 路径，不进行 locale 处理
  if (pathname.startsWith('/admin') || pathname.startsWith('/api')) {
    // 应用认证逻辑
    if (pathname.startsWith('/admin') && !token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    return NextResponse.next();
  }

  // 先让 next-intl 处理国际化
  const response = intlMiddleware(request);

  console.log('[Middleware] intlMiddleware response status:', response?.status);

  // 如果 intlMiddleware 返回了重定向（比如添加了 locale），直接返回
  if (response && response.status >= 300 && response.status < 400) {
    console.log('[Middleware] Redirecting to:', response.headers.get('location'));
    return response;
  }

  // 提取 locale（现在应该已经由 intlMiddleware 处理过了）
  const locale = locales.find(loc => pathname.startsWith(`/${loc}`)) || defaultLocale;
  const pathnameWithoutLocale = pathname.replace(new RegExp(`^/${locale}`), '');

  console.log('[Middleware] Extracted locale:', locale);
  console.log('[Middleware] Pathname without locale:', pathnameWithoutLocale);

  // 定义公开页面（不需要登录）
  const publicPages = ['/login', '/register'];
  const isPublicPage = publicPages.some(page => pathnameWithoutLocale.startsWith(page));
  const isLoginPage = pathnameWithoutLocale === '/login';
  const isRegisterPage = pathnameWithoutLocale === '/register';

  // 未登录访问受限页 → login
  if (!token && !isPublicPage && pathnameWithoutLocale !== '/') {
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 登录页已登录 → market
  if (token && (isLoginPage || isRegisterPage)) {
    return NextResponse.redirect(new URL(`/${locale}/market`, request.url));
  }

  // 返回 intlMiddleware 的响应，或者创建新的响应
  return response || NextResponse.next();
}

export const config = {
  matcher: [
    // 匹配所有路径，除了：
    // 1. Next.js 内部路径 (_next/static, _next/image, _next/data)
    // 2. 静态文件扩展名 (png, jpg, svg, webmanifest, ico, json, xml, txt, pdf, css, js, woff, woff2, ttf)
    // 3. API 路径
    '/((?!_next/|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|webmanifest|json|xml|txt|pdf|css|js|woff|woff2|ttf)|api/).*)',
  ],
};
