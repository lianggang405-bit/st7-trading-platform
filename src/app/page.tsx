import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { locales, defaultLocale } from '@/config/locales';

export default async function RootPage() {
  const cookieStore = await cookies();
  const savedLocale = cookieStore.get('locale');

  // 检查保存的语言是否在白名单中
  let targetLocale = defaultLocale;
  if (savedLocale?.value && locales.includes(savedLocale.value as any)) {
    targetLocale = savedLocale.value as typeof defaultLocale;
  }

  redirect(`/${targetLocale}`);
}
