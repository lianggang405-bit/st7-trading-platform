import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';

export const locales = ['zh-TW', 'en', 'th', 'vi', 'ru', 'de'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'zh-TW';

// 静态导入所有messages文件
import zhTWMessages from './messages/zh-TW.json';
import enMessages from './messages/en.json';
import thMessages from './messages/th.json';
import viMessages from './messages/vi.json';
import ruMessages from './messages/ru.json';
import deMessages from './messages/de.json';

// 创建messages映射
const messagesMap = {
  'zh-TW': zhTWMessages,
  'en': enMessages,
  'th': thMessages,
  'vi': viMessages,
  'ru': ruMessages,
  'de': deMessages,
} as const;

export default getRequestConfig(async ({ requestLocale }) => {
  console.log('[i18n.ts] requestLocale param:', requestLocale);
  
  // 尝试从 requestLocale 获取
  let locale = await requestLocale;
  console.log('[i18n.ts] After awaiting requestLocale:', locale);
  
  // 如果 requestLocale 为 undefined，尝试从请求头中提取
  if (!locale) {
    const headersList = await headers();
    const pathname = headersList.get('x-pathname') || headersList.get('referer') || '';
    console.log('[i18n.ts] Pathname from headers:', pathname);
    
    // 从 pathname 中提取 locale
    const pathSegments = pathname.split('/').filter(Boolean);
    const potentialLocale = pathSegments[0];
    console.log('[i18n.ts] Potential locale from path:', potentialLocale);
    
    if (potentialLocale && locales.includes(potentialLocale as any)) {
      locale = potentialLocale;
    }
  }

  console.log('[i18n.ts] locale before validation:', locale);

  if (!locale || !locales.includes(locale as any)) {
    console.log('[i18n.ts] Invalid locale, using default:', defaultLocale);
    locale = defaultLocale;
  }

  const messages = messagesMap[locale as Locale];

  console.log('[i18n.ts] Final locale:', locale);
  console.log('[i18n.ts] Messages type:', typeof messages);
  console.log('[i18n.ts] Market messages preview:', messages?.market);

  return {
    locale,
    messages: messages as any,
    timeZone: 'UTC',
    now: new Date(),
  };
});
