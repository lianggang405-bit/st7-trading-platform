import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

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
  let locale = await requestLocale;

  console.log('[i18n.ts] requestLocale:', requestLocale);
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
