import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '../../i18n';
import { BottomTab } from '../../components/layout/bottom-tab';
import { AuthProvider } from '../../components/providers/auth-provider';
import '../globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://forexpl.shop'),
  title: {
    default: 'ST7全球交易平台-专业数字资产交易',
    template: '%s | ST7全球交易平台',
  },
  description: '专业的全球数字资产交易平台，支持多语言、市价交易、挂单交易、持仓管理、风控系统。安全、稳定、高效。',
  keywords: '交易平台, 数字货币, 加密货币, 交易, 投资理财, BTC, ETH, 比特币, 以太坊, 市价交易, 挂单交易, ST7, forexpl',
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
    locale: 'zh_CN',
    url: 'https://forexpl.shop',
    title: 'ST7全球交易平台-专业数字资产交易',
    description: '专业的全球数字资产交易平台，支持多语言、市价交易、挂单交易、持仓管理、风控系统。安全、稳定、高效。',
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
    title: 'ST7全球交易平台-专业数字资产交易',
    description: '专业的全球数字资产交易平台，支持多语言、市价交易、挂单交易、持仓管理、风控系统。',
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

  const messages = await getMessages();
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <AuthProvider isDev={isDev}>
      <NextIntlClientProvider messages={messages}>
        <main className="pb-28 min-h-screen">
          {children}
        </main>
        <BottomTab />
      </NextIntlClientProvider>
    </AuthProvider>
  );
}
