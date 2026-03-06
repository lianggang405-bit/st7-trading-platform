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

// 创建messages映射 - 正常的一一对应关系
const messagesMap: Record<Locale, any> = {
  'zh-TW': zhTWMessages,   // zh-TW → 繁体中文翻译
  'en': enMessages,        // en → 英语翻译
  'th': thMessages,        // th → 泰语翻译
  'vi': viMessages,        // vi → 越南语翻译
  'ru': ruMessages,        // ru → 俄语翻译
  'de': deMessages,        // de → 德语翻译
};


export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  
  // 如果 requestLocale 为 undefined，尝试从请求头中提取
  if (!locale) {
    const headersList = await headers();
    const referer = headersList.get('referer') || '';
    
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
    
    // 从 pathname 中提取 locale
    const pathSegments = pathname.split('/').filter(Boolean);
    const potentialLocale = pathSegments[0];
    
    if (potentialLocale && locales.includes(potentialLocale as any)) {
      locale = potentialLocale;
    }
  }

  if (!locale || !locales.includes(locale as any)) {
    locale = defaultLocale;
  }

  return {
    locale,
    messages: messagesMap[locale as Locale] as any,
    timeZone: 'UTC',
    now: new Date(),
  };
});
