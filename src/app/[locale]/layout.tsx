import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '../../config/locales';
import { BottomTab } from '../../components/layout/bottom-tab';
import { AuthProvider } from '../../components/providers/auth-provider';
import { LocaleRedirect } from '../../components/providers/locale-redirect';
import { MarketProvider } from '../../components/providers/market-provider';
import { Toaster } from '../../components/ui/sonner';
import '../globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://forexpl.shop'),
  title: {
    default: 'ST7全球交易平台-專業數字資產交易',
    template: '%s | ST7全球交易平台',
  },
  description: '專業的全球數字資產交易平台，支援多語言、市價交易、掛單交易、持倉管理、風控系統。安全、穩定、高效。',
  keywords: '交易平台, 數字貨幣, 加密貨幣, 交易, 投資理財, BTC, ETH, 比特幣, 以太坊, 市價交易, 掛單交易, ST7, forexpl',
  authors: [{ name: 'ST7全球交易平台' }],
  creator: 'ST7全球交易平台',
  publisher: 'ST7全球交易平台',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'zh_TW',
    url: 'https://forexpl.shop',
    title: 'ST7全球交易平台-專業數字資產交易',
    description: '專業的全球數字資產交易平台，支援多語言、市價交易、掛單交易、持倉管理、風控系統。安全、穩定、高效。',
    siteName: 'ST7全球交易平台',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ST7全球交易平台',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ST7全球交易平台-專業數字資產交易',
    description: '專業的全球數字資產交易平台，支援多語言、市價交易、掛單交易、持倉管理、風控系統。',
    images: ['/og-image.png'],
    creator: '@ST7Trading',
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1e1e1e' },
  ],
};

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!locales.includes(locale as any)) {
    notFound();
  }

  // 关键修复：明确传递 locale 参数给 getMessages
  const messages = await getMessages({ locale });
  const isDev = process.env.NODE_ENV === 'development';

  // 调试日志（仅开发环境）
  if (isDev && messages.common?.login) {
    console.log('[LocaleLayout] locale:', locale, '| common.login:', messages.common.login);
  }

  return (
    <AuthProvider isDev={isDev}>
      <MarketProvider>
        <NextIntlClientProvider messages={messages}>
          <LocaleRedirect />
          <main className="pb-28 min-h-screen">
            {children}
          </main>
          <BottomTab />
          <Toaster />
        </NextIntlClientProvider>
      </MarketProvider>
    </AuthProvider>
  );
}
