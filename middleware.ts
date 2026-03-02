import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 支持的语言列表
const locales = ['zh-TW', 'en', 'th', 'vi', 'ru', 'de'] as const;
const defaultLocale = 'zh-TW';

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get('token')?.value;

  // 🔒 排除管理端路径和 API 路径，不进行 locale 处理
  if (pathname.startsWith('/admin') || pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // 1️⃣ 没有 locale → 补 locale
  const hasLocale = locales.some(loc => pathname.startsWith(`/${loc}`));
  if (!hasLocale) {
    const url = new URL(`/${defaultLocale}${pathname}`, request.url);
    return NextResponse.redirect(url);
  }

  // 提取 locale
  const locale = locales.find(loc => pathname.startsWith(`/${loc}`)) || defaultLocale;
  const pathnameWithoutLocale = pathname.replace(new RegExp(`^/${locale}`), '');

  // 定义公开页面（不需要登录）
  const publicPages = ['/login', '/register'];
  const isPublicPage = publicPages.some(page => pathnameWithoutLocale.startsWith(page));
  const isLoginPage = pathnameWithoutLocale === '/login';
  const isRegisterPage = pathnameWithoutLocale === '/register';

  // 2️⃣ 未登录访问受限页 → login
  if (!token && !isPublicPage) {
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3️⃣ 登录页已登录 → market
  if (token && (isLoginPage || isRegisterPage)) {
    return NextResponse.redirect(new URL(`/${locale}/market`, request.url));
  }

  // 其他情况 → 放行
  return NextResponse.next();
}

export const config = {
  matcher: [
    // 匹配所有路径，除了静态资源和 Next.js 内部路径
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
