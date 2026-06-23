import './globals.scss';
import { Inter } from 'next/font/google';
import localFont from 'next/font/local';
import classNames from 'classnames';
import { ReactNode } from 'react';
import SessionProviderWrapper from '../components/SessionProvider';
import { auth } from '../auth';

const font = localFont({
  src: [
    { path: '../fonts/open-sans-400.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/open-sans-600.woff2', weight: '600', style: 'normal' },
    { path: '../fonts/open-sans-700.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  fallback: ['Arial', 'sans-serif'],
  adjustFontFallback: false,
  variable: '--font-open-sans',
});

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata = {
  title: 'StatGPT Portal',
  description: 'AI-powered conversation platform with DIAL API integration',
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="en">
      <head>
        <link rel="icon" href={'/images/favicon.ico'} sizes="any" />
        <link rel="apple-touch-icon" href={'/images/favicon.ico'} />
      </head>
      <body
        className={classNames(font.variable, inter.variable, 'antialiased')}
      >
        <SessionProviderWrapper session={session}>
          {children}
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
