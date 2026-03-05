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

  // 如果 intlMiddleware 返回了重定向（比如添加了 locale），直接返回
  if (response && response.status >= 300 && response.status < 400) {
    return response;
  }

  // 提取 locale（现在应该已经由 intlMiddleware 处理过了）
  const locale = locales.find(loc => pathname.startsWith(`/${loc}`)) || defaultLocale;
  const pathnameWithoutLocale = pathname.replace(new RegExp(`^/${locale}`), '');

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
    // 匹配所有路径，除了静态资源和 Next.js 内部路径
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
