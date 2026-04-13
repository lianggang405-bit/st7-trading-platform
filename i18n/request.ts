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

  // Load messages based on locale
  let messages;
  try {
    const messagesPath = join(process.cwd(), 'src', 'messages', `${locale}.json`);
    messages = JSON.parse(readFileSync(messagesPath, 'utf-8'));
  } catch {
    // Fallback to empty messages if file not found
    messages = {};
  }

  return {
    locale,
    messages,
    timeZone: 'UTC',
    now: new Date(),
  };
});
