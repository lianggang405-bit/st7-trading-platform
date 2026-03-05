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

// 创建messages映射 - 按索引顺序排列
const messagesByIndex = [
  zhTWMessages,  // index 0: zh-TW
  enMessages,    // index 1: en
  thMessages,    // index 2: th
  viMessages,    // index 3: vi
  ruMessages,    // index 4: ru
  deMessages,    // index 5: de
];

// 添加调试信息
console.log('[i18n.ts init] locales array:', locales);
console.log('[i18n.ts init] messagesByIndex:', messagesByIndex.map((m, i) => ({ index: i, locale: locales[i], login: m?.common?.login })));

export default getRequestConfig(async ({ requestLocale }) => {
  console.log('[i18n.ts] ===== New Request =====');
  console.log('[i18n.ts] requestLocale param:', requestLocale);
  
  // 尝试从 requestLocale 获取
  let locale = await requestLocale;
  console.log('[i18n.ts] After awaiting requestLocale:', locale);
  
  // 如果 requestLocale 为 undefined，尝试从请求头中提取
  if (!locale) {
    const headersList = await headers();
    const referer = headersList.get('referer') || '';
    console.log('[i18n.ts] Referer from headers:', referer);
    
    // 从 URL 中提取 pathname（去掉协议和域名）
    let pathname = '';
    try {
      if (referer.includes('http')) {
        const url = new URL(referer);
        pathname = url.pathname;
      } else {
        pathname = referer;
      }
    } catch (e) {
      pathname = referer;
    }
    
    console.log('[i18n.ts] Extracted pathname:', pathname);
    
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

  // 使用索引获取 messages
  const localeIndex = locales.indexOf(locale as Locale);
  console.log('[i18n.ts] Final locale:', locale, 'index:', localeIndex);
  
  const messages = messagesByIndex[localeIndex];
  console.log('[i18n.ts] Messages login value:', messages?.common?.login);

  return {
    locale,
    messages: messages as any,
    timeZone: 'UTC',
    now: new Date(),
  };
});
