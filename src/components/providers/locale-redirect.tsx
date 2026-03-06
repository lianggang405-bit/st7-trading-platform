'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { locales } from '@/config/locales';

/**
 * 语言重定向组件
 * 从 localStorage 读取用户保存的语言，如果与当前路径不一致则重定向
 */
export function LocaleRedirect() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // 只在客户端运行
    if (typeof window === 'undefined') {
      return;
    }

    // 检查 localStorage 中是否有保存的 locale
    const savedLocale = localStorage.getItem('locale');

    // 如果没有保存的 locale，直接返回
    if (!savedLocale) {
      return;
    }

    // 验证保存的 locale 是否在白名单中
    if (!locales.includes(savedLocale as any)) {
      // 如果不在白名单中，清除无效的 locale
      localStorage.removeItem('locale');
      return;
    }

    // 从当前路径提取 locale
    const pathSegments = pathname.split('/').filter(Boolean);
    const currentLocale = pathSegments[0];

    // 如果当前路径有语言部分，并且与保存的 locale 不同，则重定向
    if (currentLocale && currentLocale !== savedLocale) {
      // 替换语言部分
      pathSegments[0] = savedLocale;
      const newPathname = '/' + pathSegments.join('/');
      router.replace(newPathname);
    } else if (!currentLocale) {
      // 如果当前路径没有语言部分（例如根路径），重定向到保存的语言
      router.replace(`/${savedLocale}`);
    }
  }, [pathname, router]);

  return null;
}
