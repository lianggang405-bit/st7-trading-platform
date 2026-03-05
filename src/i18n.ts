import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';

export const locales = ['zh-TW', 'en', 'th', 'vi', 'ru', 'de'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'zh-TW';

// 静态导入所有messages文件 - 按 locales 相同顺序导入
import zhTWMessages from './messages/zh-TW.json';
import enMessages from './messages/en.json';
import thMessages from './messages/th.json';
import viMessages from './messages/vi.json';
import ruMessages from './messages/ru.json';
import deMessages from './messages/de.json';

// 创建messages映射 - 根据用户要求调整映射
// 英语按钮 → 显示繁体中文翻译
// 泰语按钮 → 显示英语翻译
// 越南语按钮 → 显示泰语翻译
// 俄语按钮 → 显示越南语翻译
// 德语按钮 → 显示俄语翻译
// 繁体中文按钮 → 显示德语翻译
const messagesMap: Record<Locale, any> = {
  'zh-TW': deMessages,   // 繁体按钮 → 德语翻译
  'en': zhTWMessages,    // 英语按钮 → 繁体翻译
  'th': enMessages,      // 泰语按钮 → 英语翻译
  'vi': thMessages,      // 越南语按钮 → 泰语翻译
  'ru': viMessages,      // 俄语按钮 → 越南语翻译
  'de': ruMessages,      // 德语按钮 → 俄语翻译
};

// 调试：验证映射关系
console.log('[i18n.ts init] Verifying messagesMap:');
console.log('[i18n.ts init] locales order:', locales);
console.log('[i18n.ts init] messagesMap entries:');
Object.entries(messagesMap).forEach(([key, value], index) => {
  console.log(`  [${index}] ${key} button → ${value?.common?.login}`);
});

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

  console.log('[i18n.ts] ===== Debug Info =====');
  console.log('[i18n.ts] Final locale:', locale);
  console.log('[i18n.ts] Using messages from messagesMap for locale:', locale);
  
  const messages = messagesMap[locale as Locale];
  console.log('[i18n.ts] Messages login value:', messages?.common?.login);
  console.log('[i18n.ts] =======================');

  return {
    locale,
    messages: messages as any,
    timeZone: 'UTC',
    now: new Date(),
  };
});
