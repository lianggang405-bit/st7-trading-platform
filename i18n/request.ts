import { getRequestConfig } from 'next-intl/server';
import { readFileSync } from 'fs';
import { join } from 'path';

// Locale 配置
const locales = ['zh-TW', 'en', 'th', 'vi', 'ru', 'de'] as const;
const defaultLocale = 'zh-TW';

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  let locale = await requestLocale;

  // Ensure that a valid locale is used
  if (!locale || !locales.includes(locale as any)) {
    locale = defaultLocale;
  }

  const messagesPath = join(process.cwd(), 'src', 'messages', `${locale}.json`);
  const messages = JSON.parse(readFileSync(messagesPath, 'utf-8'));

  return {
    locale,
    messages,
    timeZone: 'UTC',
    now: new Date(),
  };
});
